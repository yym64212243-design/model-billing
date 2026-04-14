# 腾讯云部署指南

这套部署方案把仓库整理成适合腾讯云 `轻量应用服务器 Lighthouse` 或 `CVM` 的 `web + gateway` 双服务结构。

推荐默认拓扑：

- `billing.example.com` -> Next.js 门户站
- `gateway.example.com` -> Go 网关
- 同一台云主机上运行 Docker Compose
- 宿主机 Nginx 负责 HTTPS 和反向代理
- 容器只监听 `127.0.0.1:3000` / `127.0.0.1:8080`

## 1. 先选机器

默认建议：

- 优先选腾讯云 Lighthouse
- 系统选 Ubuntu 22.04 或 24.04
- 最少 `2 vCPU / 4 GB RAM`
- 安全组放行 `22`、`80`、`443`

如果你后面准备拆分数据库、挂负载均衡、做多机扩容，再考虑 CVM。

## 2. 拉代码并初始化服务器

```bash
cd /opt
git clone <your-repo-url> ghost-cloner
cd ghost-cloner

chmod +x deploy/tencentcloud/bootstrap-ubuntu.sh
./deploy/tencentcloud/bootstrap-ubuntu.sh
```

这个脚本会安装：

- `git`
- `nginx`
- `docker engine`
- `docker compose plugin`

如果提示当前用户刚加入 `docker` 组，重新登录一次再继续。

## 3. 准备生产环境变量

```bash
cd /opt/ghost-cloner/deploy/tencentcloud
cp web.env.example web.env
cp gateway.env.example gateway.env
```

至少要填这些值：

- `web.env`
  - `NEXTAUTH_URL=https://billing.example.com`
  - `NEXTAUTH_SECRET`
  - `BILLING_API_KEY`
  - `GATEWAY_INTERNAL_API_KEY`
  - `ZPAY_PID`
  - `ZPAY_KEY`
  - `ZPAY_NOTIFY_URL=https://billing.example.com/api/webhooks/zpay`
  - `ZPAY_RETURN_URL=https://billing.example.com/pay/zpay-return`
- `gateway.env`
  - `UPSTREAM_OPENAI_API_KEY` 或 `CHANNELS_JSON`
  - 与 `web.env` 完全一致的 `BILLING_API_KEY`
  - 与 `web.env` 完全一致的 `GATEWAY_INTERNAL_API_KEY`

这两个值默认不要改：

- `web.env` 里的 `GATEWAY_INTERNAL_URL=http://gateway:8080`
- `gateway.env` 里的 `BILLING_BASE_URL=http://web:3000`

它们是容器之间互相访问的内部地址。

## 4. 启动应用

在仓库根目录执行：

```bash
cd /opt/ghost-cloner
docker compose -f deploy/tencentcloud/docker-compose.yml up -d --build
docker compose -f deploy/tencentcloud/docker-compose.yml ps
```

第一次启动后建议立刻检查：

```bash
curl -I http://127.0.0.1:3000
curl http://127.0.0.1:8080/healthz
docker compose -f deploy/tencentcloud/docker-compose.yml logs --tail=100 web
docker compose -f deploy/tencentcloud/docker-compose.yml logs --tail=100 gateway
```

如果 `gateway` 启动失败，优先检查：

- 是否设置了 `UPSTREAM_OPENAI_API_KEY` 或 `CHANNELS_JSON`
- 密钥是否写错
- `DATABASE_URL` 是否被改坏

支付相关再额外检查：

- 是否已经配置 `ZPAY_PID / ZPAY_KEY`
- `ZPAY_NOTIFY_URL` 和 `ZPAY_RETURN_URL` 是否是公网 HTTPS 地址
- `ZPAY_NOTIFY_URL / ZPAY_RETURN_URL` 不要带 query string
- 如果暂时不用支付宝，可以先不填 `ALIPAY_*`

## 5. 配置域名解析

把两个子域名都解析到同一台服务器公网 IP：

- `billing.example.com` -> 云主机公网 IP
- `gateway.example.com` -> 云主机公网 IP

等解析生效后再做证书配置。

## 6. 配置 Nginx 反向代理

复制模板：

```bash
sudo mkdir -p /etc/nginx/ssl
sudo cp deploy/tencentcloud/nginx.openclaw.conf /etc/nginx/conf.d/openclaw.conf
```

然后把模板里的这些占位符改成真实值：

- `billing.example.com`
- `gateway.example.com`
- `/etc/nginx/ssl/` 下对应证书文件名

测试并重载：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 7. 安装腾讯云 SSL 证书

把证书下载成 Nginx 格式并上传到服务器，例如：

- `/etc/nginx/ssl/billing.example.com_bundle.crt`
- `/etc/nginx/ssl/billing.example.com.key`
- `/etc/nginx/ssl/gateway.example.com_bundle.crt`
- `/etc/nginx/ssl/gateway.example.com.key`

然后再次执行：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 8. 上线后检查

建议按这个顺序检查：

1. `https://billing.example.com` 能否正常打开首页和登录页
2. `https://gateway.example.com/healthz` 是否返回 `ok`
3. 在门户创建 API Key 是否成功
4. 用新 Key 请求一次 `https://gateway.example.com/v1/models`
5. 打开积分页发起一次 `ZPAY` 支付，确认能跳转收银台
6. 支付完成后检查 `https://billing.example.com/pay/zpay-return` 和余额变动

## 9. 日常运维

更新发布：

```bash
cd /opt/ghost-cloner
git pull
docker compose -f deploy/tencentcloud/docker-compose.yml up -d --build
```

查看日志：

```bash
docker compose -f deploy/tencentcloud/docker-compose.yml logs -f web
docker compose -f deploy/tencentcloud/docker-compose.yml logs -f gateway
```

停止服务：

```bash
docker compose -f deploy/tencentcloud/docker-compose.yml down
```

## 10. 数据持久化

Compose 使用了两个 Docker volume：

- `web_data`：保存 web 侧 Prisma SQLite 数据
- `gateway_data`：保存 gateway 侧 SQLite 数据

除非你明确要清空数据，否则不要删除这两个 volume。
