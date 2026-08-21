use ring::aead::{Aad, LessSafeKey, Nonce, UnboundKey, AES_256_GCM, NONCE_LEN};
use ring::error::Unspecified;
use ring::pbkdf2;
use ring::rand::{SecureRandom, SystemRandom};
use std::num::NonZeroU32;
use thiserror::Error;
use zeroize::{Zeroize, ZeroizeOnDrop};

pub const KEY_LEN: usize = 32;
pub const SALT_LEN: usize = 32;
pub const KDF_ITERATIONS: u32 = 210_000;
const VERIFY_MESSAGE: &[u8] = b"safevault-master-v1";

#[derive(Debug, Error)]
pub enum CryptoError {
    #[error("加密操作失败")]
    Crypto,
    #[error("主密码不正确")]
    InvalidPassword,
    #[error("密文格式无效")]
    InvalidCiphertext,
}

impl From<Unspecified> for CryptoError {
    fn from(_: Unspecified) -> Self {
        CryptoError::Crypto
    }
}

#[derive(Clone, Zeroize, ZeroizeOnDrop)]
pub struct VaultKey {
    bytes: [u8; KEY_LEN],
}

impl VaultKey {
    pub fn from_bytes(bytes: [u8; KEY_LEN]) -> Self {
        Self { bytes }
    }

    pub fn as_bytes(&self) -> &[u8; KEY_LEN] {
        &self.bytes
    }
}

pub fn random_bytes(len: usize) -> Result<Vec<u8>, CryptoError> {
    let rng = SystemRandom::new();
    let mut buf = vec![0u8; len];
    rng.fill(&mut buf).map_err(|_| CryptoError::Crypto)?;
    Ok(buf)
}

pub fn random_salt() -> Result<[u8; SALT_LEN], CryptoError> {
    let bytes = random_bytes(SALT_LEN)?;
    let mut salt = [0u8; SALT_LEN];
    salt.copy_from_slice(&bytes);
    Ok(salt)
}

pub fn derive_key(password: &str, salt: &[u8], iterations: u32) -> Result<VaultKey, CryptoError> {
    let iters = NonZeroU32::new(iterations.max(1)).ok_or(CryptoError::Crypto)?;
    let mut key = [0u8; KEY_LEN];
    pbkdf2::derive(
        pbkdf2::PBKDF2_HMAC_SHA256,
        iters,
        salt,
        password.as_bytes(),
        &mut key,
    );
    Ok(VaultKey::from_bytes(key))
}

/// 用密钥加密固定校验明文，用于验证主密码而不存储明文主密码。
pub fn make_verifier(key: &VaultKey) -> Result<Vec<u8>, CryptoError> {
    encrypt(key, VERIFY_MESSAGE)
}

pub fn verify_password(key: &VaultKey, verifier: &[u8]) -> Result<(), CryptoError> {
    match decrypt(key, verifier) {
        Ok(plain) if plain == VERIFY_MESSAGE => Ok(()),
        Ok(_) => Err(CryptoError::InvalidPassword),
        Err(CryptoError::InvalidCiphertext) | Err(CryptoError::Crypto) => {
            Err(CryptoError::InvalidPassword)
        }
        Err(other) => Err(other),
    }
}

/// AES-256-GCM：输出 = nonce(12) || ciphertext+tag
pub fn encrypt(key: &VaultKey, plaintext: &[u8]) -> Result<Vec<u8>, CryptoError> {
    let unbound = UnboundKey::new(&AES_256_GCM, key.as_bytes()).map_err(|_| CryptoError::Crypto)?;
    let sealing = LessSafeKey::new(unbound);

    let nonce_bytes = random_bytes(NONCE_LEN)?;
    let nonce = Nonce::try_assume_unique_for_key(&nonce_bytes).map_err(|_| CryptoError::Crypto)?;

    let mut in_out = plaintext.to_vec();
    sealing
        .seal_in_place_append_tag(nonce, Aad::empty(), &mut in_out)
        .map_err(|_| CryptoError::Crypto)?;

    let mut out = nonce_bytes;
    out.extend_from_slice(&in_out);
    Ok(out)
}

pub fn decrypt(key: &VaultKey, packed: &[u8]) -> Result<Vec<u8>, CryptoError> {
    if packed.len() <= NONCE_LEN {
        return Err(CryptoError::InvalidCiphertext);
    }
    let (nonce_bytes, ciphertext) = packed.split_at(NONCE_LEN);
    let unbound = UnboundKey::new(&AES_256_GCM, key.as_bytes()).map_err(|_| CryptoError::Crypto)?;
    let opening = LessSafeKey::new(unbound);
    let nonce = Nonce::try_assume_unique_for_key(nonce_bytes).map_err(|_| CryptoError::Crypto)?;

    let mut in_out = ciphertext.to_vec();
    let plain = opening
        .open_in_place(nonce, Aad::empty(), &mut in_out)
        .map_err(|_| CryptoError::InvalidCiphertext)?;
    Ok(plain.to_vec())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn roundtrip_and_verify() {
        let salt = random_salt().unwrap();
        let key = derive_key("correct-horse", &salt, 10_000).unwrap();
        let verifier = make_verifier(&key).unwrap();
        verify_password(&key, &verifier).unwrap();

        let wrong = derive_key("wrong-pass", &salt, 10_000).unwrap();
        assert!(verify_password(&wrong, &verifier).is_err());

        let ct = encrypt(&key, b"secret").unwrap();
        let pt = decrypt(&key, &ct).unwrap();
        assert_eq!(pt, b"secret");
    }
}
