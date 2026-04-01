#!/usr/bin/env bash
# Model Billing Bridge — one-shot CVM (Ubuntu) setup.
# Run on the server as root, or pipe from your Mac:
#   ssh root@YOUR_IP 'bash -s' < deploy/tencent-cvm/bootstrap.sh
#
# Optional env (override defaults):
#   MB_ROOT=/opt/model-billing
#   MB_DOMAIN=modelbillingbridge.com
#   MB_GIT_CLONE_URL=https://github.com/OWNER/model-billing.git
#   MB_LETSENCRYPT_EMAIL=you@example.com   (for certbot)
#   MB_SKIP_CERTBOT=1                        (skip TLS; HTTP only)

set -euo pipefail

MB_ROOT="${MB_ROOT:-/opt/model-billing}"
MB_DOMAIN="${MB_DOMAIN:-modelbillingbridge.com}"
MB_GIT_CLONE_URL="${MB_GIT_CLONE_URL:-https://github.com/yym64212243-design/model-billing.git}"
MB_LETSENCRYPT_EMAIL="${MB_LETSENCRYPT_EMAIL:-admin@${MB_DOMAIN}}"

export DEBIAN_FRONTEND=noninteractive

log() { echo "[bootstrap] $*"; }

require_root() {
  if [[ "${EUID:-0}" -ne 0 ]]; then
    echo "Run as root on the CVM (e.g. ssh root@...)." >&2
    exit 1
  fi
}

install_packages() {
  apt-get update -y
  apt-get install -y ca-certificates curl git nginx certbot python3-certbot-nginx sqlite3

  if ! command -v node >/dev/null 2>&1 || [[ "$(node -v 2>/dev/null || true)" != v20* ]]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
  fi

  command -v pm2 >/dev/null 2>&1 || npm install -g pm2
}

sync_repo() {
  if [[ -d "${MB_ROOT}/.git" ]]; then
    log "Updating ${MB_ROOT}"
    git -C "${MB_ROOT}" fetch origin
    git -C "${MB_ROOT}" reset --hard "origin/main"
  else
    log "Cloning into ${MB_ROOT}"
    mkdir -p "$(dirname "${MB_ROOT}")"
    rm -rf "${MB_ROOT}"
    git clone "${MB_GIT_CLONE_URL}" "${MB_ROOT}"
  fi
}

write_web_env() {
  local web_env="${MB_ROOT}/web/.env"
  local example="${MB_ROOT}/web/.env.example"
  if [[ ! -f "${example}" ]]; then
    echo "Missing ${example}" >&2
    exit 1
  fi
  if [[ ! -f "${web_env}" ]]; then
    cp "${example}" "${web_env}"
    log "Created web/.env from .env.example"
  fi

  python3 - "${web_env}" "${MB_DOMAIN}" <<'PY'
import pathlib, re, secrets, sys
path = pathlib.Path(sys.argv[1])
domain = sys.argv[2]
base = f"https://{domain}"
text = path.read_text(encoding="utf-8")

def set_or_append(key: str, value: str) -> None:
    global text
    line = f'{key}="{value}"'
    pat = re.compile(rf"^{re.escape(key)}=.*$", re.M)
    if pat.search(text):
        text = pat.sub(line, text)
    else:
        text = text.rstrip() + "\n" + line + "\n"

set_or_append("DATABASE_URL", "file:./prisma/prod.db")
set_or_append("NEXTAUTH_URL", base)
set_or_append("BILLING_BASE_URL", base)
set_or_append("ALIPAY_NOTIFY_URL", f"{base}/api/webhooks/alipay")
set_or_append("ZPAY_NOTIFY_URL", f"{base}/api/webhooks/zpay")
set_or_append("ZPAY_RETURN_URL", f"{base}/pay/zpay-return")

def ensure_random(key: str, placeholder_substr: str, nbytes: int = 32) -> None:
    global text
    m = re.search(rf"^{re.escape(key)}=\"(.*)\"$", text, re.M)
    if not m:
        return
    val = m.group(1)
    if placeholder_substr.lower() in val.lower() or val.strip() in ("", '""'):
        set_or_append(key, secrets.token_urlsafe(nbytes))

ensure_random("NEXTAUTH_SECRET", "generate", 32)
ensure_random("BILLING_API_KEY", "replace", 32)
ensure_random("USER_API_KEY_PEPPER", "replace", 48)

path.write_text(text, encoding="utf-8")
PY
  log "Patched web/.env for ${MB_DOMAIN} (secrets generated if still placeholders)"
}

write_gateway_env() {
  local g="${MB_ROOT}/gateway/.env"
  cat >"${g}" <<EOF
PORT=8080
BILLING_PROXY_BASE_URL=http://127.0.0.1:3000
EOF
  chmod 600 "${g}" || true
  log "Wrote gateway/.env"
}

build_and_pm2() {
  pushd "${MB_ROOT}/web" >/dev/null
  npm ci
  export DATABASE_URL="file:./prisma/prod.db"
  npx prisma generate
  npx prisma db push
  npm run build
  popd >/dev/null

  pushd "${MB_ROOT}/gateway" >/dev/null
  npm ci
  popd >/dev/null

  pm2 delete mb-web 2>/dev/null || true
  pm2 delete mb-gateway 2>/dev/null || true
  pm2 start "${MB_ROOT}/deploy/tencent-cvm/ecosystem.config.cjs"
  pm2 save
  log "PM2 apps started (mb-web, mb-gateway). For boot persistence run: pm2 startup systemd -u root --hp /root && pm2 save"
}

write_nginx() {
  local conf="/etc/nginx/sites-available/model-billing"
  cat >"${conf}" <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${MB_DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /gateway/ {
        rewrite ^/gateway/(.*) /\$1 break;
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX
  rm -f /etc/nginx/sites-enabled/default
  ln -sf "${conf}" /etc/nginx/sites-enabled/model-billing
  nginx -t
  systemctl reload nginx
  log "Nginx configured for ${MB_DOMAIN} (HTTP)"
}

run_certbot() {
  if [[ "${MB_SKIP_CERTBOT:-0}" == "1" ]]; then
    log "Skipping certbot (MB_SKIP_CERTBOT=1)"
    return 0
  fi
  if certbot certificates 2>/dev/null | grep -q "${MB_DOMAIN}"; then
    certbot renew --dry-run || true
    log "Certificate for ${MB_DOMAIN} already present"
    return 0
  fi
  certbot --nginx -d "${MB_DOMAIN}" --non-interactive --agree-tos \
    -m "${MB_LETSENCRYPT_EMAIL}" --redirect || {
    log "certbot failed — ensure DNS A record for ${MB_DOMAIN} points to this host and ports 80/443 are open."
    return 0
  }
  log "HTTPS enabled via Let's Encrypt"
}

main() {
  require_root
  install_packages
  sync_repo
  write_web_env
  write_gateway_env
  build_and_pm2
  write_nginx
  run_certbot
  log "Done. Open https://${MB_DOMAIN} (or http:// if certbot was skipped / failed)."
  log "Edit ${MB_ROOT}/web/.env to add ZPAY_PID, ZPAY_KEY, OPENAI_API_KEY, etc."
}

main "$@"
