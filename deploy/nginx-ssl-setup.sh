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

cp "${SCRIPT_DIR}/${NGINX_CONF}" "/etc/nginx/sites-available/${DOMAIN}"
ok "Config copied to /etc/nginx/sites-available/${DOMAIN}"

# ── Step 2: Create symlink ──
info "Creating symlink in sites-enabled..."

# Remove old symlink if exists
rm -f "/etc/nginx/sites-enabled/${DOMAIN}"
ln -s "/etc/nginx/sites-available/${DOMAIN}" "/etc/nginx/sites-enabled/${DOMAIN}"

# Remove default site if still present
rm -f /etc/nginx/sites-enabled/default

ok "Symlink created"

# ── Step 3: Create certbot webroot ──
info "Creating certbot webroot..."
mkdir -p /var/www/certbot
ok "Webroot at /var/www/certbot"

# ── Step 4: Create webhook log ──
touch /var/log/nginx/webhook.access.log
chown www-data:www-data /var/log/nginx/webhook.access.log

# ── Step 5: Test Nginx config ──
info "Testing Nginx config..."

if nginx -t 2>&1; then
    ok "Nginx config test passed"
else
    fail "Nginx config test FAILED. Check syntax."
fi

# Start/reload Nginx in HTTP mode
systemctl enable nginx
systemctl restart nginx
ok "Nginx started (HTTP mode)"

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
warn "IMPORTANT: DNS A record for ${DOMAIN} must point to this server's IP"
warn "If using Cloudflare proxy (orange cloud), PAUSE it temporarily for cert issuance"
echo ""

# Check if cert already exists
if [[ -d "/etc/letsencrypt/live/${DOMAIN}" ]]; then
    warn "Certificate already exists for ${DOMAIN}"
    read -rp "Renew/replace it? (y/N): " RENEW
    if [[ "${RENEW,,}" != "y" ]]; then
        info "Skipping cert issuance, using existing cert"
    else
        certbot certonly --nginx -d "${DOMAIN}" --non-interactive --agree-tos --email admin@orashop.in --force-renewal
        ok "Certificate renewed"
    fi
else
    # First-time cert issuance
    read -rp "Ready to obtain SSL cert? DNS must be pointing here. (y/N): " PROCEED
    if [[ "${PROCEED,,}" != "y" ]]; then
        warn "Skipping SSL cert issuance. Run certbot manually later:"
        echo "  sudo certbot --nginx -d ${DOMAIN}"
        echo ""
    else
        certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos --email admin@orashop.in
        ok "SSL certificate obtained and Nginx config updated by Certbot"
    fi
fi

# ── Step 8: Uncomment SSL lines in config ──
# Certbot's --nginx plugin handles this automatically, but verify
if [[ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]]; then
    info "SSL cert found. Verifying Nginx SSL config..."
    
    # Certbot modifies the config directly when using --nginx plugin
    # Verify the cert paths are in the config
    if grep -q "ssl_certificate" "/etc/nginx/sites-available/${DOMAIN}"; then
        ok "SSL directives present in Nginx config"
    else
        warn "SSL directives may need manual addition. Certbot should have added them."
    fi
fi

# ── Step 9: Final Nginx test and reload ──
info "Final Nginx config test..."
if nginx -t 2>&1; then
    ok "Nginx config valid"
    systemctl reload nginx
    ok "Nginx reloaded with SSL"
else
    fail "Nginx config test failed after SSL setup"
fi

# ── Step 10: Verify auto-renewal ──
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
