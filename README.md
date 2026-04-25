# Quotes Hub

一個全端名言管理平台，專注於提供結構化的語錄瀏覽、收藏與個人化管理體驗。此專案結合現代前後端技術，實作完整的使用者驗證流程、資料持久化與安全機制，適合作為全端應用開發的實務範例。

線上預覽（Live Demo）：
https://quoteshub.onrender.com/

---

## 專案目標

Quotes Hub 的核心目標不只是展示語錄內容，而是建立一個具備以下能力的應用系統：

* 提供穩定且可擴展的 API 架構
* 實作安全的使用者驗證與授權機制
* 支援使用者個人化資料（收藏、管理）
* 建立清晰的前後端分離架構
* 作為可部署的實際產品，而非僅限於學習用途

---

## 功能說明（詳細）

### 使用者系統（Authentication & Authorization）

* 使用者註冊與登入（Email / Password）
* JWT Token 發行與驗證機制
* Token 儲存與自動附加於 API 請求（Authorization Header）
* Google OAuth 登入整合（快速登入流程）
* 登出機制（前端 Token 清除）
* 基本權限控管（僅登入用戶可操作收藏功能）

---

### 語錄瀏覽系統（Quotes Browsing）

* 從後端 API 動態取得語錄資料
* 支援隨機語錄顯示（Random Quote）
* 可擴展為：

  * 分類（Category-based filtering）
  * 作者（Author filtering）
  * 關鍵字搜尋（Keyword search）
* 前端非同步資料載入（避免阻塞 UI）
* 錯誤處理與 fallback UI（例如 API 失敗時提示）

---

### 收藏系統（Favorites Management）

* 使用者可將語錄加入收藏
* 防止重複收藏（透過後端驗證）
* 取得個人收藏列表（User-specific data isolation）
* 刪除收藏語錄
* 收藏狀態同步（前端 UI 與後端資料一致）

---

### API 與資料流設計

* 前端透過 Axios 呼叫 RESTful API
* API 分層設計：

  * `/api/auth`：身份驗證
  * `/api/quotes`：語錄資料
  * `/api/favorites`：收藏管理
* 使用 middleware 驗證 JWT Token
* 統一錯誤處理（Error Handling Middleware）
* JSON 格式資料傳輸

---

### 安全機制（Security Features）

* bcrypt 密碼雜湊（避免明文儲存）
* JWT 驗證避免 session 劫持問題
* Rate Limiting（防止暴力攻擊與濫用）
* 環境變數管理敏感資訊（.env）
* 基本輸入驗證（避免惡意請求）
* CORS 設定（控制跨來源請求）

---

### 使用者體驗（UX Enhancements）

* 即時 UI 更新（收藏/取消收藏不需重新整理）
* Loading 狀態提示（提升互動回饋）
* 錯誤提示訊息（登入失敗、API 錯誤）
* 簡潔直觀的操作流程
* 響應式設計（可擴展至行動裝置）

---

### 系統穩定性與可維護性

* 模組化後端架構（routes / controllers / models）
* 清楚的資料責任分離（Separation of Concerns）
* 可擴展 API 設計（方便新增功能）
* 前後端獨立開發與部署

---

## 技術架構

### 前端（Client）

* React（SPA 架構）
* Axios（HTTP Client）
* Hooks / Context（狀態管理）

### 後端（Server）

* Node.js
* Express
* MongoDB
* Mongoose

### 驗證與安全

* JWT（JSON Web Token）
* bcrypt
* Google OAuth 2.0

---

## 系統設計重點

### 1. RESTful API 設計

資源導向設計，將使用者、語錄與收藏拆分為獨立 API，提高可讀性與維護性。

### 2. 無狀態驗證

使用 JWT 進行驗證，使系統更易於水平擴展（Horizontal Scaling）。

### 3. 模組化架構

將後端邏輯拆分，避免單一檔案過度複雜。

### 4. 資料一致性

透過後端驗證機制確保收藏資料不重複且正確。

---

## 安裝與執行

### 1. 下載專案

```bash id="2f9n9m"
git clone https://github.com/your-username/quotes-app.git
cd quotes-app
```

### 2. 安裝依賴

```bash id="z0yy3m"
npm run install:all
```

### 3. 設定環境變數

```env id="w6y6kp"
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
```

### 4. 啟動開發模式

```bash id="v5cs3z"
npm run dev
```

### 5. 啟動正式環境

```bash id="y8pp8n"
npm start
```

---

## 專案結構

```id="h3t9xq"
quotes-app/
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── server.js
│
├── frontend/
│   ├── src/
│   └── public/
│
├── package.json
```

---

## 部署

https://quoteshub.onrender.com/

---

## 可擴展方向

### 功能擴展

* 語錄分類 / 標籤系統
* 搜尋與排序功能
* 社群互動（留言、按讚）
* 使用者個人頁面

### 技術優化

* TypeScript 重構
* Redis 快取
* Swagger API 文件
* 單元測試與整合測試