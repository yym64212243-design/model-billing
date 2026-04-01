# Tencent Cloud CVM（Ubuntu）部署 Model Billing Bridge

默认域名：`modelbillingbridge.com`；默认代码目录：`/opt/model-billing`；仓库：`https://github.com/yym64212243-design/model-billing.git`。

## 部署前（腾讯云控制台 + DNS）

1. **安全组**：为 CVM 绑定规则，放行 **TCP 80**、**TCP 443**（以及 **22** 便于 SSH）。勿对公网开放 3000 / 8080。
2. **DNS**：在域名解析处添加 **A 记录**，主机记录 `@`（或你使用的子域）指向 CVM 公网 IP（例如 `119.28.129.147`）。证书申请前需已生效。

## 在 Mac 上一键执行（密码登录）

在项目根目录（含 `deploy/tencent-cvm/bootstrap.sh`）执行：

```bash
cd "/Users/wuyuantong/Library/Containers/com.tencent.xinWeChat/Data/Documents/xwechat_files/wxid_g203yqczqy1i22_8dc8/msg/file/2026-03/model-billing"

ssh root@119.28.129.147 'bash -s' < deploy/tencent-cvm/bootstrap.sh
```

按提示输入 root 密码。脚本会安装 Node 20、Nginx、Certbot、PM2，拉取/更新代码，写入 `web/.env` / `gateway/.env`，执行 `prisma db push` 与 `next build`，启动 PM2，配置 Nginx，并尝试申请 Let’s Encrypt 证书。

### 环境变量（可选）

在 **本机** 通过 SSH 传入，例如：

```bash
MB_LETSENCRYPT_EMAIL='你的邮箱@example.com' \
MB_DOMAIN=modelbillingbridge.com \
ssh root@119.28.129.147 'bash -s' < deploy/tencent-cvm/bootstrap.sh
```

若仓库为 **私有**，需使用带凭据的克隆地址（勿把 token 写进仓库）：

```bash
MB_GIT_CLONE_URL='https://TOKEN@github.com/yym64212243-design/model-billing.git' \
ssh root@119.28.129.147 'bash -s' < deploy/tencent-cvm/bootstrap.sh
```

暂不申请证书（仅 HTTP 调试）：

```bash
MB_SKIP_CERTBOT=1 ssh root@119.28.129.147 'bash -s' < deploy/tencent-cvm/bootstrap.sh
```

## 部署后

- 在服务器上编辑 `/opt/model-billing/web/.env`，填入 **ZPAY_PID**、**ZPAY_KEY**、**OPENAI_API_KEY** 等；改完后执行：
  - `cd /opt/model-billing/web && npm run build && pm2 restart mb-web`
- OpenAI 兼容网关（经 Nginx）：`https://modelbillingbridge.com/gateway/v1/chat/completions`
- 健康检查：`https://modelbillingbridge.com/gateway/healthz`

## 更新版本

再次执行同一条 `ssh ... bootstrap.sh` 即可（会 `git reset --hard origin/main` 并重建前端；`web/.env` 不会被 Git 覆盖）。
