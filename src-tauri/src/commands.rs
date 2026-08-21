use crate::db::{DbError, VaultDb};
use crate::models::{Credential, CredentialInput, VaultStatus};
use chrono::Utc;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;
use uuid::Uuid;
use zeroize::Zeroize;

pub struct VaultState {
    pub db_path: PathBuf,
    pub db: Mutex<Option<VaultDb>>,
    pub key: Mutex<Option<crate::crypto::VaultKey>>,
}

impl VaultState {
    pub fn new(db_path: PathBuf) -> Self {
        Self {
            db_path,
            db: Mutex::new(None),
            key: Mutex::new(None),
        }
    }

    fn with_db<T>(&self, f: impl FnOnce(&VaultDb) -> Result<T, String>) -> Result<T, String> {
        let mut guard = self.db.lock().map_err(|_| "内部锁定失败".to_string())?;
        if guard.is_none() {
            let db = VaultDb::open(&self.db_path).map_err(map_db_err)?;
            *guard = Some(db);
        }
        f(guard.as_ref().unwrap())
    }
}

fn map_db_err(err: DbError) -> String {
    err.to_string()
}

fn today() -> String {
    Utc::now().format("%Y-%m-%d").to_string()
}

fn empty_to_none(value: Option<String>) -> Option<String> {
    value.and_then(|v| {
        let t = v.trim().to_string();
        if t.is_empty() {
            None
        } else {
            Some(t)
        }
    })
}

fn require_key(state: &VaultState) -> Result<crate::crypto::VaultKey, String> {
    let guard = state.key.lock().map_err(|_| "内部锁定失败".to_string())?;
    guard
        .as_ref()
        .cloned()
        .ok_or_else(|| "密码库未解锁".to_string())
}

fn validate_input(input: &CredentialInput) -> Result<(), String> {
    if input.name.trim().is_empty() {
        return Err("请填写名称".into());
    }
    if input.username.trim().is_empty() {
        return Err("请填写用户名 / 账号".into());
    }
    if input.password.is_empty() {
        return Err("请填写密码".into());
    }
    Ok(())
}

#[tauri::command]
pub fn vault_status(state: State<'_, VaultState>) -> Result<VaultStatus, String> {
    let unlocked = state
        .key
        .lock()
        .map_err(|_| "内部锁定失败".to_string())?
        .is_some();
    let initialized = state.with_db(|db| db.is_initialized().map_err(map_db_err))?;
    Ok(VaultStatus {
        initialized,
        unlocked,
    })
}

#[tauri::command]
pub fn vault_setup(password: String, state: State<'_, VaultState>) -> Result<(), String> {
    if password.trim().len() < 8 {
        return Err("主密码至少 8 位".into());
    }
    let already = state.with_db(|db| db.is_initialized().map_err(map_db_err))?;
    if already {
        return Err("密码库已初始化".into());
    }
    let key = state.with_db(|db| db.setup(&password).map_err(map_db_err))?;
    let mut key_guard = state.key.lock().map_err(|_| "内部锁定失败".to_string())?;
    *key_guard = Some(key);
    Ok(())
}

#[tauri::command]
pub fn vault_unlock(password: String, state: State<'_, VaultState>) -> Result<(), String> {
    let key = state.with_db(|db| db.unlock(&password).map_err(map_db_err))?;
    let mut key_guard = state.key.lock().map_err(|_| "内部锁定失败".to_string())?;
    *key_guard = Some(key);
    Ok(())
}

#[tauri::command]
pub fn vault_lock(state: State<'_, VaultState>) -> Result<(), String> {
    let mut key_guard = state.key.lock().map_err(|_| "内部锁定失败".to_string())?;
    if let Some(mut key) = key_guard.take() {
        // VaultKey implements Zeroize via derive
        key.zeroize();
    }
    Ok(())
}

#[tauri::command]
pub fn list_credentials(state: State<'_, VaultState>) -> Result<Vec<Credential>, String> {
    let key = require_key(&state)?;
    state.with_db(|db| db.list_decrypted(&key).map_err(map_db_err))
}

#[tauri::command]
pub fn get_credential(id: String, state: State<'_, VaultState>) -> Result<Credential, String> {
    let key = require_key(&state)?;
    state.with_db(|db| db.get_decrypted(&key, &id).map_err(map_db_err))
}

#[tauri::command]
pub fn create_credential(
    input: CredentialInput,
    state: State<'_, VaultState>,
) -> Result<Credential, String> {
    validate_input(&input)?;
    let key = require_key(&state)?;
    let now = today();
    let cred = Credential {
        id: Uuid::new_v4().to_string(),
        name: input.name.trim().to_string(),
        username: input.username.trim().to_string(),
        password: input.password,
        url: empty_to_none(input.url),
        category: input.category,
        icon_color: input.icon_color,
        icon_letter: input.icon_letter,
        strength: input.strength,
        totp_secret: empty_to_none(input.totp_secret),
        note: empty_to_none(input.note),
        tags: input.tags,
        updated_at: now.clone(),
        created_at: now,
    };
    state.with_db(|db| db.upsert_encrypted(&key, &cred).map_err(map_db_err))?;
    Ok(cred)
}

#[tauri::command]
pub fn update_credential(
    id: String,
    input: CredentialInput,
    state: State<'_, VaultState>,
) -> Result<Credential, String> {
    validate_input(&input)?;
    let key = require_key(&state)?;
    let existing = state.with_db(|db| db.get_decrypted(&key, &id).map_err(map_db_err))?;
    let cred = Credential {
        id: existing.id,
        name: input.name.trim().to_string(),
        username: input.username.trim().to_string(),
        password: input.password,
        url: empty_to_none(input.url),
        category: input.category,
        icon_color: input.icon_color,
        icon_letter: input.icon_letter,
        strength: input.strength,
        totp_secret: empty_to_none(input.totp_secret),
        note: empty_to_none(input.note),
        tags: input.tags,
        created_at: existing.created_at,
        updated_at: today(),
    };
    state.with_db(|db| db.upsert_encrypted(&key, &cred).map_err(map_db_err))?;
    Ok(cred)
}

#[tauri::command]
pub fn delete_credential(id: String, state: State<'_, VaultState>) -> Result<(), String> {
    let _key = require_key(&state)?;
    let deleted = state.with_db(|db| db.delete(&id).map_err(map_db_err))?;
    if !deleted {
        return Err("凭证不存在".into());
    }
    Ok(())
}
