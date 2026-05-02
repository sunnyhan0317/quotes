# 語境 Yu境

> 那些無法言說的，都藏在別人的句子裡

一個深色文青風格的語錄分享平台，支援用戶投稿、AI 生成語錄、社群互動、個人日記與情緒分析。

---

## 功能總覽

### 🏠 主頁
- 語錄牆：深藍色卡片式佈局，支援 hover 動效
- 搜尋：導覽列放大鏡圖示，點擊展開搜尋欄
- 標籤篩選、排序（最新 / 最多讚）
- 分頁瀏覽

### 📝 語錄卡片
- 按讚 ❤、收藏 🔖
- 💬 **留言區**：可新增、編輯、刪除自己的留言
- ⚖ **辯論專區**：選擇「認同 / 不認同」立場發表，附計分板與按讚
- 🖼 **海報產生器**：8 種主題配色 × 2 種字體，Canvas 渲染，一鍵下載 PNG

### 👤 用戶功能
| 功能 | 說明 |
|------|------|
| 電子郵件 / Google 登入 | 密碼欄位支援顯示 / 隱藏切換 |
| 個人資料 | 修改用戶名、Email |
| 自訂頭像 | 30 種 emoji 頭像選擇器 |
| 我的投稿 | 查看投稿狀態，可編輯（退回審核）或撤回待審語錄 |
| 已收藏 / 已按讚 | 快速瀏覽互動過的語錄 |
| 修改密碼 | 需輸入舊密碼確認 |
| 聯絡管理員 | 一鍵開啟 Gmail 寄信 |

### 🧬 語錄 DNA（`/dna`）
分析你收藏與按讚的語錄，生成個人語錄人格報告：
- 15 種語錄人格（深思者、靈魂流浪者、浪漫主義者...）
- 品味稀有度環形進度條（0–100 分）
- 最共鳴主題標籤雲（字體大小依頻率變化）
- 語句長度偏好分析
- 最常共鳴的作者排行

> 需至少 3 則收藏或按讚才能生成

### 🌡 社群情緒地圖（`/mood-map`）
根據所有用戶心情日記的匿名統計：
- 今日情緒泡泡圖（泡泡大小＝人數比例）
- 正向 / 中性 / 低落三段比例條
- 7 / 14 / 30 天情緒走勢折線圖（正面指數）

### 📓 我的日記（`/diary`，私密）

**心情日記**：每天記錄一則，包含：
- 10 種心情 emoji + 6 種天氣
- 日記內文與關鍵字標籤
- 歷史列表（點擊跳回該日）

**寫給未來的信**：
- 設定開封日期（必須是未來）
- 到期自動解封，解封前無法閱讀內容
- 顯示倒數天數

### 🛡 管理後台（`/admin`，需管理員角色）
- 儀表板：語錄數、用戶數、待審核數統計
- 語錄審核：通過 / 拒絕 / 永久刪除
- 全部語錄管理（依狀態篩選）
- 用戶管理：設定 / 取消管理員權限

---

## 技術架構

| 層級 | 技術 |
|------|------|
| 前端 | React 18 + Vite + React Router v6 |
| 後端 | Node.js + Express |
| 資料庫 | MongoDB Atlas（Mongoose ODM） |
| 認證 | JWT + Google OAuth 2.0 |
| AI | Anthropic Claude API（語錄生成）|
| 海報 | HTML5 Canvas |

---

## 快速開始

### 環境需求
- Node.js v18 以上
- npm v8 以上

### 1. 安裝依賴

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. 設定環境變數

`backend/.env`：
```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/quotes?retryWrites=true&w=majority&appName=<AppName>
JWT_SECRET=your_strong_random_secret
ANTHROPIC_API_KEY=sk-ant-...        # 選填，AI 語錄生成
GOOGLE_CLIENT_ID=...googleusercontent.com  # 選填，Google 登入
PORT=5000
```

`frontend/.env`：
```env
VITE_GOOGLE_CLIENT_ID=...googleusercontent.com
```

### 3. 啟動

```bash
# 終端機 1
cd backend && npm start        # http://localhost:5000

# 終端機 2
cd frontend && npm run dev     # http://localhost:3000
```

---

## 設定第一個管理員

1. 在網站上註冊帳號
2. 登入 [MongoDB Atlas](https://cloud.mongodb.com) → `quotes` 資料庫 → `users` collection
3. 找到你的帳號 → 編輯 → 新增欄位 `role`，值 `"admin"`（String）
4. 儲存，重新整理網站即可看到「管理」連結

---

## API 金鑰取得

### Anthropic（選填）
1. [console.anthropic.com](https://console.anthropic.com) → 建立 API Key
2. 填入 `ANTHROPIC_API_KEY`

### Google OAuth（選填）
1. [Google Cloud Console](https://console.cloud.google.com) → API & Services → 憑證 → OAuth 2.0 用戶端 ID
2. 應用程式類型：網頁應用程式
3. 已授權 JavaScript 來源：`http://localhost:3000`
4. 複製 Client ID 填入前後端 `.env`

---

## 部署到 Render

### 後端（Web Service）
| 欄位 | 值 |
|------|-----|
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `node server.js` |

在 Environment 頁籤填入 `.env` 所有變數。

### 前端（Static Site）
| 欄位 | 值 |
|------|-----|
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

建立 `frontend/.env.production`：
```env
VITE_API_URL=https://你的後端服務名.onrender.com
```

並修改 `frontend/src/context/AuthContext.jsx` 的 API baseURL：
```js
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
});
```

---

## 專案結構

```
quotes-app/
├── backend/
│   ├── middleware/auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Quote.js          # 含留言、辯論留言 schema
│   │   └── Diary.js          # 心情日記 + 未來的信
│   ├── routes/
│   │   ├── auth.js           # 登入、註冊、Google OAuth
│   │   ├── quotes.js         # 語錄 CRUD、留言、辯論
│   │   ├── user.js           # 個人資料、密碼、頭像
│   │   ├── admin.js          # 管理後台
│   │   ├── ai.js             # AI 語錄生成
│   │   ├── diary.js          # 日記 API
│   │   └── analytics.js      # DNA + 情緒地圖
│   └── server.js
│
└── frontend/src/
    ├── components/
    │   ├── Navbar.jsx         # 導覽列 + 展開搜尋
    │   ├── QuoteCard.jsx      # 語錄卡（留言、辯論、海報）
    │   ├── PosterModal.jsx    # Canvas 海報產生器
    │   ├── AuthModal.jsx      # 登入 / 註冊
    │   └── SubmitQuotePanel.jsx
    ├── pages/
    │   ├── HomePage.jsx
    │   ├── ProfilePage.jsx    # 個人資料 + DNA 連結
    │   ├── DiaryPage.jsx      # 心情日記 + 未來的信
    │   ├── DNAPage.jsx        # 語錄人格分析
    │   ├── MoodMapPage.jsx    # 社群情緒地圖
    │   └── AdminPage.jsx
    ├── context/
    │   ├── AuthContext.jsx
    │   └── ToastContext.jsx
    ├── App.jsx
    └── index.css
```

---

## 注意事項

- `.env` 已加入 `.gitignore`，請勿上傳至 Git
- 心情日記完全私密，情緒地圖只統計匿名數字，不顯示個人資訊
- 用戶投稿需管理員審核才會公開；AI 生成語錄自動通過審核
- 語錄 DNA 需至少 3 則互動記錄才能分析

---

## 聯絡

有任何問題或建議，請聯絡管理員：[yihan970317@gmail.com](mailto:yihan970317@gmail.com)
