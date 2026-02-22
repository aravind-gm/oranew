#!/usr/bin/env bash
# ============================================================================
# ORA JEWELLERY — VPS HARDENING SCRIPT (Phase 1)
# ============================================================================
# Run as ROOT on a fresh Ubuntu 22.04 VPS (Hostinger)
#
# What this does:
#   1. System update
#   2. Create deploy user with sudo
#   3. SSH hardening (key-only, no root login)
#   4. UFW firewall (22, 80, 443 only)
#   5. Fail2ban
#   6. Automatic security updates
#
# Usage:
#   scp vps-setup-phase1.sh root@YOUR_VPS_IP:/root/
#   ssh root@YOUR_VPS_IP
#   chmod +x /root/vps-setup-phase1.sh
#   bash /root/vps-setup-phase1.sh
#
# IMPORTANT: Before running, upload your SSH public key:
#   ssh-copy-id -i ~/.ssh/id_rsa.pub root@YOUR_VPS_IP
# ============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[PHASE 1]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ── Preflight ──
if [ "$(id -u)" -ne 0 ]; then
  err "This script must be run as root"
fi

DEPLOY_USER="deploy"
SSH_PORT=22

echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║  ORA Jewellery — VPS Hardening (Phase 1)         ║"
echo "║  Target: Ubuntu 22.04 on Hostinger VPS           ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# 1. SYSTEM UPDATE
# ============================================================================
log "Updating system packages..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get dist-upgrade -y
apt-get autoremove -y
log "✅ System updated"

# ============================================================================
# 2. CREATE DEPLOY USER
# ============================================================================
log "Creating deploy user..."
if id "$DEPLOY_USER" &>/dev/null; then
  warn "User '$DEPLOY_USER' already exists — skipping creation"
else
  adduser --disabled-password --gecos "ORA Deploy" "$DEPLOY_USER"
  usermod -aG sudo "$DEPLOY_USER"
  # Allow sudo without password for deploy user
  echo "$DEPLOY_USER ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/$DEPLOY_USER
  chmod 440 /etc/sudoers.d/$DEPLOY_USER
  log "✅ User '$DEPLOY_USER' created with sudo access"
fi

# Copy SSH keys from root to deploy user
log "Copying SSH authorized keys to $DEPLOY_USER..."
mkdir -p /home/$DEPLOY_USER/.ssh
cp /root/.ssh/authorized_keys /home/$DEPLOY_USER/.ssh/authorized_keys 2>/dev/null || warn "No root authorized_keys found — add manually"
chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/.ssh
chmod 700 /home/$DEPLOY_USER/.ssh
chmod 600 /home/$DEPLOY_USER/.ssh/authorized_keys 2>/dev/null || true
log "✅ SSH keys copied"

# ============================================================================
# 3. SSH HARDENING
# ============================================================================
log "Hardening SSH configuration..."
SSHD_CONFIG="/etc/ssh/sshd_config"

# Backup original
cp $SSHD_CONFIG ${SSHD_CONFIG}.backup.$(date +%Y%m%d%H%M%S)

# Apply SSH hardening
cat > /etc/ssh/sshd_config.d/ora-hardening.conf << 'SSHEOF'
# ORA Jewellery — SSH Hardening
# Applied by vps-setup-phase1.sh

# Disable root login
PermitRootLogin no

# Disable password authentication (key-only)
PasswordAuthentication no
ChallengeResponseAuthentication no
UsePAM yes

# Disable empty passwords
PermitEmptyPasswords no

# Limit login attempts
MaxAuthTries 3
MaxSessions 3

# Timeout idle sessions (5 minutes)
ClientAliveInterval 300
ClientAliveCountMax 2

# Disable X11 forwarding
X11Forwarding no

# Only allow deploy user
AllowUsers deploy
SSHEOF

# Validate SSH config before restarting
sshd -t && log "✅ SSH config validated" || err "SSH config invalid — aborting"

# ============================================================================
# 4. UFW FIREWALL
# ============================================================================
log "Configuring UFW firewall..."
apt-get install -y ufw

# Reset to defaults
ufw --force reset

# Default deny incoming, allow outgoing
ufw default deny incoming
ufw default allow outgoing

# Allow SSH
ufw allow $SSH_PORT/tcp comment 'SSH'

# Allow HTTP and HTTPS
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

# Enable firewall
ufw --force enable
log "✅ UFW enabled — only ports 22, 80, 443 open"

# Show status
ufw status verbose

# ============================================================================
# 5. FAIL2BAN
# ============================================================================
log "Installing and configuring Fail2ban..."
apt-get install -y fail2ban

cat > /etc/fail2ban/jail.local << 'F2BEOF'
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5
backend  = systemd

[sshd]
enabled  = true
port     = ssh
filter   = sshd
logpath  = /var/log/auth.log
maxretry = 3
bantime  = 7200
F2BEOF

systemctl enable fail2ban
systemctl restart fail2ban
log "✅ Fail2ban installed — SSH brute force protection active"

# ============================================================================
# 6. AUTOMATIC SECURITY UPDATES
# ============================================================================
log "Enabling automatic security updates..."
apt-get install -y unattended-upgrades apt-listchanges

cat > /etc/apt/apt.conf.d/20auto-upgrades << 'AUTOEOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
AUTOEOF

cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'UUEOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
UUEOF

systemctl enable unattended-upgrades
log "✅ Automatic security updates enabled"

# ============================================================================
# 7. MISC HARDENING
# ============================================================================
log "Applying misc hardening..."

# Disable core dumps
echo "* hard core 0" >> /etc/security/limits.conf

# Harden shared memory
if ! grep -q "tmpfs /run/shm" /etc/fstab; then
  echo "tmpfs /run/shm tmpfs defaults,noexec,nosuid 0 0" >> /etc/fstab
fi

# Set timezone
timedatectl set-timezone Asia/Kolkata
log "✅ Timezone set to Asia/Kolkata (IST)"

# ============================================================================
# DONE
# ============================================================================
echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║  ✅ PHASE 1 COMPLETE — VPS Hardened              ║"
echo "╠═══════════════════════════════════════════════════╣"
echo "║                                                   ║"
echo "║  NEXT STEPS:                                      ║"
echo "║  1. Open a NEW terminal (keep this one open)      ║"
echo "║  2. Test SSH: ssh deploy@YOUR_VPS_IP              ║"
echo "║  3. If SSH works → restart sshd in this terminal  ║"
echo "║  4. Run Phase 2 script as deploy user             ║"
echo "║                                                   ║"
echo "║  ⚠️  DO NOT close this terminal until you verify  ║"
echo "║     SSH access with the deploy user!              ║"
echo "║                                                   ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

# Restart SSH AFTER user confirms access
read -p "Have you verified SSH access as 'deploy'? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  systemctl restart sshd
  log "✅ SSH restarted with hardened config"
  log "Root login is now DISABLED"
else
  warn "SSH NOT restarted — root login still active"
  warn "Run 'systemctl restart sshd' manually after verifying deploy access"
fi
