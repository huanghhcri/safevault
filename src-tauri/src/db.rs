use crate::crypto::{self, CryptoError, VaultKey, KDF_ITERATIONS, SALT_LEN};
use crate::models::Credential;
use chrono::Utc;
use rusqlite::{params, Connection};
use std::path::Path;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum DbError {
    #[error(transparent)]
    Sqlite(#[from] rusqlite::Error),
    #[error(transparent)]
    Crypto(#[from] CryptoError),
    #[error(transparent)]
    Serde(#[from] serde_json::Error),
    #[error("密码库尚未初始化")]
    NotInitialized,
    #[error("密码库已初始化")]
    AlreadyInitialized,
    #[error("密码库未解锁")]
    Locked,
    #[error("凭证不存在")]
    NotFound,
}

pub struct VaultDb {
    conn: Connection,
}

impl VaultDb {
    pub fn open(path: &Path) -> Result<Self, DbError> {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).ok();
        }
        let conn = Connection::open(path)?;
        conn.execute_batch(
            "
            PRAGMA journal_mode = WAL;
            PRAGMA foreign_keys = ON;
            CREATE TABLE IF NOT EXISTS vault_meta (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                salt BLOB NOT NULL,
                verifier BLOB NOT NULL,
                kdf_iterations INTEGER NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS credentials (
                id TEXT PRIMARY KEY NOT NULL,
                ciphertext BLOB NOT NULL,
                updated_at TEXT NOT NULL
            );
            ",
        )?;
        Ok(Self { conn })
    }

    pub fn is_initialized(&self) -> Result<bool, DbError> {
        let count: i64 =
            self.conn
                .query_row("SELECT COUNT(*) FROM vault_meta WHERE id = 1", [], |r| {
                    r.get(0)
                })?;
        Ok(count > 0)
    }

    pub fn setup(&self, password: &str) -> Result<VaultKey, DbError> {
        if self.is_initialized()? {
            return Err(DbError::AlreadyInitialized);
        }
        let salt = crypto::random_salt()?;
        let key = crypto::derive_key(password, &salt, KDF_ITERATIONS)?;
        let verifier = crypto::make_verifier(&key)?;
        let created_at = Utc::now().to_rfc3339();
        self.conn.execute(
            "INSERT INTO vault_meta (id, salt, verifier, kdf_iterations, created_at) VALUES (1, ?1, ?2, ?3, ?4)",
            params![salt.as_slice(), verifier, KDF_ITERATIONS as i64, created_at],
        )?;
        Ok(key)
    }

    pub fn unlock(&self, password: &str) -> Result<VaultKey, DbError> {
        let (salt, verifier, iterations): (Vec<u8>, Vec<u8>, i64) = self
            .conn
            .query_row(
                "SELECT salt, verifier, kdf_iterations FROM vault_meta WHERE id = 1",
                [],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
            )
            .map_err(|_| DbError::NotInitialized)?;

        if salt.len() != SALT_LEN {
            return Err(DbError::Crypto(CryptoError::Crypto));
        }
        let key = crypto::derive_key(password, &salt, iterations as u32)?;
        crypto::verify_password(&key, &verifier)?;
        Ok(key)
    }

    pub fn list_decrypted(&self, key: &VaultKey) -> Result<Vec<Credential>, DbError> {
        let mut stmt = self
            .conn
            .prepare("SELECT ciphertext FROM credentials ORDER BY updated_at DESC")?;
        let rows = stmt.query_map([], |row| {
            let ciphertext: Vec<u8> = row.get(0)?;
            Ok(ciphertext)
        })?;

        let mut out = Vec::new();
        for row in rows {
            let ciphertext = row?;
            let plain = crypto::decrypt(key, &ciphertext)?;
            let cred: Credential = serde_json::from_slice(&plain)?;
            out.push(cred);
        }
        Ok(out)
    }

    pub fn upsert_encrypted(&self, key: &VaultKey, cred: &Credential) -> Result<(), DbError> {
        let plain = serde_json::to_vec(cred)?;
        let ciphertext = crypto::encrypt(key, &plain)?;
        self.conn.execute(
            "INSERT INTO credentials (id, ciphertext, updated_at) VALUES (?1, ?2, ?3)
             ON CONFLICT(id) DO UPDATE SET ciphertext = excluded.ciphertext, updated_at = excluded.updated_at",
            params![cred.id, ciphertext, cred.updated_at],
        )?;
        Ok(())
    }

    pub fn delete(&self, id: &str) -> Result<bool, DbError> {
        let n = self
            .conn
            .execute("DELETE FROM credentials WHERE id = ?1", params![id])?;
        Ok(n > 0)
    }

    pub fn get_decrypted(&self, key: &VaultKey, id: &str) -> Result<Credential, DbError> {
        let ciphertext: Vec<u8> = self
            .conn
            .query_row(
                "SELECT ciphertext FROM credentials WHERE id = ?1",
                params![id],
                |r| r.get(0),
            )
            .map_err(|_| DbError::NotFound)?;
        let plain = crypto::decrypt(key, &ciphertext)?;
        Ok(serde_json::from_slice(&plain)?)
    }
}
