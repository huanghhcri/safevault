mod commands;
mod crypto;
mod db;
mod models;

use commands::VaultState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let resolver = app.path();
            let dir = resolver
                .app_data_dir()
                .expect("failed to resolve app data dir");
            std::fs::create_dir_all(&dir).ok();
            let db_path = dir.join("safevault.db");
            app.manage(VaultState::new(db_path));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::vault_status,
            commands::vault_setup,
            commands::vault_unlock,
            commands::vault_lock,
            commands::list_credentials,
            commands::get_credential,
            commands::create_credential,
            commands::update_credential,
            commands::delete_credential,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
