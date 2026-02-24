#!/usr/bin/env bash
# ============================================================================
# ORA JEWELLERY — NGINX + SSL SETUP (Phase 5)
# ============================================================================
#
# Run as: deploy user with sudo
# Usage:  sudo bash nginx-ssl-setup.sh
#
# What this does:
#   1. Copies Nginx config to sites-available
#   2. Creates symlink in sites-enabled
#   3. Tests Nginx config
#   4. Installs Certbot
#   5. Obtains SSL cert for api.orashop.in
#   6. Verifies HTTPS works
#   7. Ensures auto-renewal is configured
#
# PREREQUISITE:
#   - DNS A record for api.orashop.in must point to THIS server's IP
#   - OR use Cloudflare DNS proxy temporarily paused for cert issuance
#   - Phase 2 (Nginx installed) must be complete
# ============================================================================

set -euo pipefail

DOMAIN="api.orashop.in"
DEPLOY_DIR="/var/www/ora-backend"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NGINX_CONF="nginx-api.orashop.in.conf"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC} $1"; }
ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail()  { echo -e "${RED}[FAIL]${NC} $1"; exit 1; }

# ── Check root ──
if [[ $EUID -ne 0 ]]; then
    fail "This script must be run as root (use sudo)"
fi

echo ""
echo "============================================"
echo "  ORA JEWELLERY — NGINX + SSL SETUP"
echo "============================================"
echo ""

# ── Step 1: Copy Nginx config ──
info "Copying Nginx config for ${DOMAIN}..."

if [[ ! -f "${SCRIPT_DIR}/${NGINX_CONF}" ]]; then
    fail "Nginx config not found: ${SCRIPT_DIR}/${NGINX_CONF}"
fi

# ── Step 2: Create certbot webroot and logs ──
info "Creating certbot webroot and log files..."
mkdir -p /var/www/certbot
touch /var/log/nginx/webhook.access.log 2>/dev/null || true
chown www-data:adm /var/log/nginx/webhook.access.log 2>/dev/null || true
ok "Webroot and logs ready"

# ── Step 3: Deploy HTTP-only config first (cert doesn't exist yet) ──
info "Deploying HTTP-only Nginx config (stage 1 — pre-cert)..."

cat > "/etc/nginx/sites-available/${DOMAIN}" << 'HTTPCONF'
# Rate limit zones
limit_req_zone $binary_remote_addr zone=api_general:10m rate=20r/s;
limit_req_zone $binary_remote_addr zone=api_auth:10m rate=5r/s;
limit_req_zone $binary_remote_addr zone=api_checkout:10m rate=2r/s;

upstream ora_backend {
    server 127.0.0.1:5000;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name api.orashop.in;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Pass all traffic to backend (HTTP mode — until cert is obtained)
    location /api/payments/webhook {
        proxy_pass http://ora_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
    }

    location / {
        proxy_pass http://ora_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
    }
}
HTTPCONF

# Remove old symlink and default site
rm -f "/etc/nginx/sites-enabled/${DOMAIN}"
rm -f /etc/nginx/sites-enabled/default
ln -s "/etc/nginx/sites-available/${DOMAIN}" "/etc/nginx/sites-enabled/${DOMAIN}"

if nginx -t 2>&1; then
    ok "HTTP-only Nginx config test passed"
else
    fail "Nginx config test FAILED."
fi

systemctl enable nginx
systemctl restart nginx
ok "Nginx started in HTTP mode"

# ── Step 6: Install Certbot ──
info "Installing Certbot..."

if command -v certbot &>/dev/null; then
    ok "Certbot already installed"
else
    apt-get update -qq
    apt-get install -y certbot python3-certbot-nginx
    ok "Certbot installed"
fi

# ── Step 7: Obtain SSL Certificate ──
info "Obtaining SSL certificate for ${DOMAIN}..."
echo ""
warn "IMPORTANT: DNS A record for ${DOMAIN} must point to this server's IP (76.13.247.61)"
warn "If using Cloudflare proxy (orange cloud), PAUSE it temporarily for cert issuance"
echo ""

CERT_OBTAINED=false

if [[ -d "/etc/letsencrypt/live/${DOMAIN}" ]]; then
    warn "Certificate already exists for ${DOMAIN} — using it"
    CERT_OBTAINED=true
else
    read -rp "Is DNS pointing to this server? Ready to get SSL cert? (y/N): " PROCEED
    if [[ "${PROCEED,,}" != "y" ]]; then
        warn "Skipping SSL cert for now. Run later with:"
        echo "  sudo certbot --nginx -d ${DOMAIN}"
        echo "  sudo bash ${SCRIPT_DIR}/nginx-ssl-setup.sh  # re-run to install full HTTPS config"
        echo ""
        warn "Backend is still running on HTTP — functional but not HTTPS yet."
        exit 0
    else
        certbot certonly --webroot -w /var/www/certbot -d "${DOMAIN}" \
            --non-interactive --agree-tos --email admin@orashop.in
        ok "SSL certificate obtained"
        CERT_OBTAINED=true
    fi
fi

# ── Step 8: Install full HTTPS Nginx config (now that cert exists) ──
if [[ "$CERT_OBTAINED" == "true" ]]; then
    info "Installing full HTTPS Nginx config (stage 2)..."
    cp "${SCRIPT_DIR}/${NGINX_CONF}" "/etc/nginx/sites-available/${DOMAIN}"

    # Certbot puts certs here — uncomment the SSL lines in the config
    sed -i \
        -e "s|# ssl_certificate |ssl_certificate |g" \
        -e "s|# ssl_certificate_key |ssl_certificate_key |g" \
        -e "s|# include /etc/letsencrypt|include /etc/letsencrypt|g" \
        -e "s|# ssl_dhparam|ssl_dhparam|g" \
        "/etc/nginx/sites-available/${DOMAIN}"

    if nginx -t 2>&1; then
        ok "HTTPS Nginx config test passed"
        systemctl reload nginx
        ok "Nginx reloaded with HTTPS"
    else
        warn "HTTPS config test failed — staying on HTTP config"
        cp /dev/stdin "/etc/nginx/sites-available/${DOMAIN}" << 'FALLBACK'
# Fallback: run certbot --nginx manually
# sudo certbot --nginx -d api.orashop.in
FALLBACK
    fi
fi

# ── Step 9: Verify auto-renewal ──
info "Verifying Certbot auto-renewal..."

# Check systemd timer
if systemctl is-active --quiet certbot.timer 2>/dev/null; then
    ok "Certbot renewal timer is active"
elif [[ -f /etc/cron.d/certbot ]]; then
    ok "Certbot renewal cron is configured"
else
    warn "No auto-renewal found. Adding cron job..."
    echo "0 3 * * * root certbot renew --quiet --post-hook 'systemctl reload nginx'" > /etc/cron.d/certbot-renew
    ok "Added daily renewal cron job (3 AM)"
fi

# Dry-run renewal test
info "Testing renewal (dry run)..."
if certbot renew --dry-run 2>&1 | grep -q "success"; then
    ok "Renewal dry run succeeded"
else
    warn "Renewal dry run had issues. Check manually: sudo certbot renew --dry-run"
fi

# ── Step 11: Connectivity Tests ──
echo ""
echo "============================================"
echo "  CONNECTIVITY VERIFICATION"
echo "============================================"
echo ""

# Test HTTP redirect
info "Testing HTTP → HTTPS redirect..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://${DOMAIN}/api/health" --max-time 5 2>/dev/null || echo "000")
if [[ "$HTTP_CODE" == "301" ]]; then
    ok "HTTP redirects to HTTPS (301)"
elif [[ "$HTTP_CODE" == "000" ]]; then
    warn "Could not reach http://${DOMAIN} — DNS may not be pointed here yet"
else
    warn "HTTP returned ${HTTP_CODE} (expected 301)"
fi

# Test HTTPS
info "Testing HTTPS endpoint..."
HTTPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://${DOMAIN}/api/health" --max-time 5 2>/dev/null || echo "000")
if [[ "$HTTPS_CODE" == "200" ]]; then
    ok "HTTPS health check: 200 OK ✓"
elif [[ "$HTTPS_CODE" == "000" ]]; then
    warn "Could not reach https://${DOMAIN} — backend may not be running yet"
else
    warn "HTTPS returned ${HTTPS_CODE}"
fi

# Test SSL certificate
info "Checking SSL certificate validity..."
if echo | openssl s_client -servername "${DOMAIN}" -connect "${DOMAIN}:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null; then
    ok "SSL certificate is valid"
else
    warn "Could not verify SSL cert — may not be issued yet"
fi

echo ""
echo "============================================"
echo "  NGINX + SSL SETUP COMPLETE"
echo "============================================"
echo ""
echo "  Domain:   https://${DOMAIN}"
echo "  Backend:  http://127.0.0.1:5000"
echo "  Config:   /etc/nginx/sites-available/${DOMAIN}"
echo "  Logs:     /var/log/nginx/api.orashop.in.*.log"
echo "  Webhook:  /var/log/nginx/webhook.access.log"
echo "  SSL:      /etc/letsencrypt/live/${DOMAIN}/"
echo ""
echo "  Useful commands:"
echo "    sudo nginx -t                          # Test config"
echo "    sudo systemctl reload nginx            # Reload"
echo "    sudo tail -f /var/log/nginx/api.orashop.in.error.log"
echo "    sudo certbot certificates              # View certs"
echo ""
