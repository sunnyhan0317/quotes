# 語境（Yu境）— 語錄網站

一個功能完整的語錄分享平台，支援用戶投稿、AI 生成語錄、管理員審核機制。

---

## 功能特色

### 前台（一般用戶）
- **語錄牆**：瀑布式卡片展示，支援搜尋、標籤篩選、排序
- **語錄卡**：每則語錄有標籤、按讚、收藏、留言功能
- **AI 語錄生成器**：輸入主題/情緒/風格，讓 AI 創作並直接加入語錄庫
- **投稿語錄**：用戶可提交自己的語錄，等待管理員審核
- **用戶認證**：支援電子郵件註冊/登入 + Google OAuth

### 後台（管理員）
- **儀表板**：總覽統計（語錄數、用戶數、待審核數）
- **語錄審核**：通過 / 拒絕 / 永久刪除投稿內容
- **用戶管理**：查看所有用戶，設定管理員權限
- 路徑：`/admin`

---

## 技術架構

| 層級 | 技術 |
|------|------|
| 前端 | React 18 + Vite + React Router v6 |
| 後端 | Node.js + Express |
| 資料庫 | MongoDB Atlas（Mongoose） |
| AI | Anthropic Claude API |
| 認證 | JWT + Google OAuth 2.0 |

---

## 快速開始

### 1. 安裝依賴

```bash
# 後端
cd backend && npm install

# 前端
cd frontend && npm install
```

### 2. 設定環境變數

#### `backend/.env`
```
MONGODB_URI=mongodb+srv://sunnyhan:...@cluster0.1fp2tbz.mongodb.net/quotes?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_jwt_secret_here
ANTHROPIC_API_KEY=sk-ant-...        ← 從 console.anthropic.com 取得
GOOGLE_CLIENT_ID=...apps.googleusercontent.com  ← 選填，Google OAuth 用
PORT=5000
```

#### `frontend/.env`
```
VITE_GOOGLE_CLIENT_ID=...apps.googleusercontent.com  ← 與後端相同
```

### 3. 啟動專案

開兩個終端機分別執行：

```bash
# 終端 1：後端
cd backend && npm start

# 終端 2：前端
cd frontend && npm run dev
```

前端：http://localhost:3000  
後端 API：http://localhost:5000/api

---

## 取得 API 金鑰

### Anthropic API Key（AI 語錄生成必須）
1. 前往 https://console.anthropic.com
2. 建立 API Key
3. 貼入 `backend/.env` 的 `ANTHROPIC_API_KEY`

### Google OAuth（選填）
1. 前往 https://console.cloud.google.com
2. 建立專案 → API & Services → OAuth 2.0 Client ID
3. 設定授權來源：`http://localhost:3000`
4. 設定重新導向 URI：`http://localhost:3000`
5. 複製 Client ID 貼入 `backend/.env` 和 `frontend/.env`

---

## 設定第一個管理員

MongoDB Atlas 中手動更新用戶 role：

```javascript
// 在 MongoDB Atlas Data Explorer 或 mongosh 執行
db.users.updateOne(
  { email: "your_email@example.com" },
  { $set: { role: "admin" } }
)
```

之後管理員可以在後台將其他用戶升為管理員。

---

## MongoDB 資料結構

**Database**: `quotes`

**Collections**:
- `users`：用戶資料（username, email, password hash, googleId, role, savedQuotes）
- `quotes`：語錄（content, author, tags, source, status, likes, saves, comments）

---

## 注意事項
- AI 生成的語錄自動通過審核（status: approved）
- 用戶投稿的語錄需要等待管理員審核（status: pending）
- 請妥善保管 `.env` 檔案，不要上傳至 GitHub
- 建議在 `.gitignore` 中加入 `.env`
