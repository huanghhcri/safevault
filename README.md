# SafeVault

本地优先的加密密码管理器，使用 AES-256-GCM 加密存储所有凭证。

## 下载

正式安装包发布在 GitHub Releases：

**https://github.com/huanghhcri/safevault/releases**

选择对应系统的文件安装即可：

| 系统 | 文件 |
|------|------|
| Windows | `.msi` / `.exe` |
| macOS | `.dmg` |
| Linux | `.AppImage` / `.deb` |

若 Releases 页面尚无安装包，说明正在构建中，稍等几分钟刷新即可。

## 功能

- 🔐 AES-256-GCM 加密，PBKDF2-HMAC-SHA256 密钥派生（210,000 次迭代）
- 📋 凭证管理：7 种分类（微信/支付宝/银行卡/游戏/邮箱/社交/自定义）
- 🔍 模糊搜索：Fuse.js 支持名称、账号、网址、标签、备注
- 🎲 密码生成器：8-64 位，可自定义字符类型，排除易混淆字符
- 🛡️ 安全增强：密码自动遮盖、剪贴板自动清除
- 🌙 暗黑/亮色主题

## 技术栈

- 前端：Vue 3 + TypeScript + Tailwind CSS + Pinia
- 桌面：Tauri 2.0（Rust）
- 加密：Web Crypto API（浏览器）/ ring（Rust）
- 搜索：Fuse.js
- 密码强度：zxcvbn

## 开发

```bash
pnpm install
pnpm dev          # 浏览器开发模式（Web Crypto 加密）
pnpm tauri dev    # 桌面应用模式（需 Rust 环境）
```

## 构建

```bash
pnpm tauri build  # 构建桌面安装包
```

推送形如 `v1.0.0` 的 tag 会触发 GitHub Actions，自动构建并上传到 Releases。

## 安全说明

- 主密码永不以明文存储，仅保存 salt 和校验密文
- 所有凭证使用 AES-256-GCM 独立加密
- 复制密码后 30 秒自动清空剪贴板
- 密钥仅存于内存，锁定后立即清除

## 设计风格

暖白 Linear 风格，背景 #FAFAF8，强调色 #5E6AD2。

## License

MIT
