# Model Billing Bridge

多模型、多平台计费桥接：不修改各 AI 产品官方前端代码，通过 **Chrome 扩展 + Billing 站** 完成充值与余额管理。适用于 ChatGPT、Claude、Gemini 等（扩展已匹配常见域名）。

包含：

- **Chrome 扩展**：在支持的 AI 网页右下角注入「Open Billing」按钮，带 `return_url` 便于支付后返回原页面
- **Next.js Billing 站**：登录/注册、套餐选择、支付宝支付、真实余额、成功页返回来源应用
- **Gateway（可选）**：`gateway/` 最小中转服务，转发 `/v1/chat/completions` 到 Billing OpenAI 代理

---

## 功能概览

| 功能           | 说明 |
|----------------|------|
| 用户登录/注册  | NextAuth Credentials，JWT session，/login、/register |
| 受保护路由     | `/billing`、`/checkout` 需登录，未登录跳转 `/login`（旧路径 `/openclaw` 会重定向到 `/billing`） |
| 支付宝支付     | 创建订单 → 跳转支付宝收银台 → 支付成功回 /success |
| 真实余额       | SQLite + Prisma，User.credits；支付宝异步通知入账 |
| 套餐 API       | GET /api/plans 动态拉取套餐，前端 PricingSection 使用 |
| 返回来源应用   | 扩展传 `return_url`，成功页「Return to app」跳回该 URL |

---

## 目录结构（主要）

```
.
├── extension/           # Chrome 扩展
├── web/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/   # NextAuth
│   │   │   ├── auth/register/        # 注册
│   │   │   ├── checkout/alipay/create/  # 创建支付宝支付链接
│   │   │   ├── user/balance/        # 当前用户余额
│   │   │   ├── plans/               # 套餐列表
│   │   │   └── webhooks/alipay/      # 支付宝异步通知入账
│   │   ├── login/、register/、billing/、openclaw/（重定向）、success/
│   │   └── ...
│   ├── prisma/
│   │   ├── schema.prisma   # User(id, email, passwordHash, credits)
│   │   └── dev.db          # SQLite（git 可忽略）
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── prisma.ts
│   │   └── constants.ts
│   └── middleware.ts      # 保护 /billing、/checkout 等
└── README.md
```

---

## 本地运行

### 1. 环境变量

在 `web/` 下复制并编辑 `.env`：

```bash
cp .env.example .env
```

必填：

- `DATABASE_URL="file:./prisma/dev.db"`（或 `file:./dev.db`，路径相对 `prisma/`）
- `NEXTAUTH_URL="http://localhost:3000"`
- `NEXTAUTH_SECRET`：用 `openssl rand -base64 32` 生成
- `BILLING_BASE_URL`：Billing 站点基址（如 `http://localhost:3000`）
- `ALIPAY_APP_ID`：支付宝应用 ID
- `ALIPAY_PRIVATE_KEY`：你的 RSA2 私钥（PKCS8）
- `ALIPAY_PUBLIC_KEY`：支付宝公钥（用于异步通知验签）
- `ALIPAY_GATEWAY`：网关地址（沙箱：`https://openapi.alipaydev.com/gateway.do`）
- `ALIPAY_NOTIFY_URL`：服务端异步通知地址（需公网可访问）

可选：

- `ALIPAY_RETURN_URL`：覆盖默认同步跳转地址；不填则自动使用 `/success?order=...&return_url=...`

### 2. 数据库

```bash
cd web
npm install
npx prisma db push
```

### 3. 启动 Billing 站

```bash
npm run dev
```

访问：`http://localhost:3000`。  
主入口（需先登录）：`http://localhost:3000/billing`。  
兼容旧链接：`/openclaw` → 301/重定向到 `/billing`。

### 4. 支付宝异步通知（本地联调）

1. 在支付宝开放平台配置异步通知地址（`notify_url`）：
   `https://你的域名/api/webhooks/alipay`
2. 确保该地址可被支付宝服务器访问，且 `ALIPAY_PUBLIC_KEY` 正确。
3. 支付成功后，服务端收到异步通知并自动入账积分。

生产环境：使用 HTTPS 域名，核对 `ALIPAY_APP_ID / ALIPAY_PRIVATE_KEY / ALIPAY_PUBLIC_KEY / ALIPAY_NOTIFY_URL` 一致。

### 5. Chrome 扩展

1. Chrome 打开 `chrome://extensions/`，开启「开发者模式」
2. 「加载已解压的扩展程序」→ 选择本项目下的 `extension` 文件夹
3. 在扩展「选项」里设置 Billing 基址，例如 `http://localhost:3000/billing` 或生产域名

扩展会在 ChatGPT、Claude、Gemini、OpenClaw 等匹配页面显示「Open Billing」，点击打开 Billing 站并带 `return_url`。

---

## 测试流程

1. 打开 `http://localhost:3000`，先到 `/register` 注册账号，再登录。
2. 访问 `/billing`（或通过扩展打开），看到当前余额（初始 0）和套餐列表。
3. 选择套餐 → 跳转支付宝收银台支付。
4. 支付成功后回到 `/success?order=...&return_url=...`，显示真实订单状态。
5. 异步通知触发后用户余额增加；再次进入 `/billing` 可见更新后的余额。

---

## 配置说明

- **Billing 站地址**：扩展选项页或 `extension/content.js` 的默认基址；生产环境改为 `https://你的域名/billing`。
- **套餐与价格**：`web/lib/constants.ts` 的 `PLANS`；对外由 GET `/api/plans` 提供，可按需改为从 API/CMS 拉取。

---

## 安全与生产

- 生产环境务必使用 HTTPS、强 `NEXTAUTH_SECRET`，并正确配置支付宝应用密钥与通知地址。
- 密码使用 bcrypt 存储；支付宝异步通知通过 RSA2 签名校验，验签失败会拒绝处理。
