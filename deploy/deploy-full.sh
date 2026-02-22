#!/usr/bin/env bash
# ============================================================================
# ORA JEWELLERY — FULL DEPLOYMENT RUNNER (Master Script)
# ============================================================================
#
# This script orchestrates the full VPS migration in order.
# Run each phase one at a time, verifying before proceeding.
#
# Usage:
#   bash deploy-full.sh <phase>
#
# Phases:
#   1  — VPS Hardening (SSH, UFW, Fail2ban)
#   2  — Core Stack (Node, PM2, Nginx, Redis)
#   3  — Deploy Backend (clone, build, migrate)
#   4  — PM2 Cluster Setup
#   5  — Nginx + SSL
#   6  — Redis Validation
#   7  — DNS Cutover (opens checklist)
#
# Example:
#   bash deploy-full.sh 1     # Run Phase 1 only
#   bash deploy-full.sh all   # Run Phases 1-6 sequentially
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

banner() {
    echo ""
    echo -e "${BOLD}${CYAN}════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}  ORA JEWELLERY — VPS MIGRATION: Phase $1${NC}"
    echo -e "${BOLD}${CYAN}════════════════════════════════════════════════════${NC}"
    echo ""
}

pause() {
    echo ""
    read -rp "Phase $1 complete. Press ENTER to continue or Ctrl+C to stop..."
    echo ""
}

if [[ $# -lt 1 ]]; then
    echo ""
    echo "Usage: bash deploy-full.sh <phase|all>"
    echo ""
    echo "  Phases:"
    echo "    1   VPS Hardening (SSH, UFW, Fail2ban)"
    echo "    2   Core Stack (Node 20, PM2, Nginx, Redis)"
    echo "    3   Deploy Backend (clone, build, migrate, test)"
    echo "    4   PM2 Cluster Setup (2 instances)"
    echo "    5   Nginx Reverse Proxy + SSL (Certbot)"
    echo "    6   Redis & Queue Validation"
    echo "    7   DNS Cutover Checklist (opens guide)"
    echo "    all Run Phases 1-6 sequentially"
    echo ""
    exit 1
fi

PHASE="$1"

run_phase() {
    case "$1" in
        1)
            banner "1: VPS Hardening"
            sudo bash "${SCRIPT_DIR}/vps-setup-phase1.sh"
            ;;
        2)
            banner "2: Core Stack Install"
            sudo bash "${SCRIPT_DIR}/vps-setup-phase2.sh"
            ;;
        3)
            banner "3: Backend Deployment"
            bash "${SCRIPT_DIR}/deploy-backend.sh"
            ;;
        4)
            banner "4: PM2 Cluster Setup"
            bash "${SCRIPT_DIR}/pm2-setup.sh"
            ;;
        5)
            banner "5: Nginx + SSL"
            sudo bash "${SCRIPT_DIR}/nginx-ssl-setup.sh"
            ;;
        6)
            banner "6: Redis Validation"
            bash "${SCRIPT_DIR}/validate-redis-queue.sh"
            ;;
        7)
            banner "7: DNS Cutover"
            echo -e "${YELLOW}Phase 7 is a manual process.${NC}"
            echo ""
            echo "  Open and follow: ${SCRIPT_DIR}/DNS_CUTOVER_CHECKLIST.md"
            echo ""
            echo "  Summary:"
            echo "    1. Verify all phases passed"
            echo "    2. Test backend via VPS IP directly"
            echo "    3. Update Cloudflare DNS A record for api.orashop.in"
            echo "    4. Wait for propagation (2-5 min)"
            echo "    5. Test HTTPS, webhooks, checkout"
            echo "    6. Monitor for 48 hours"
            echo "    7. Only then shut down Render"
            echo ""
            ;;
        *)
            echo "Unknown phase: $1"
            exit 1
            ;;
    esac
}

if [[ "$PHASE" == "all" ]]; then
    for P in 1 2 3 4 5 6; do
        run_phase "$P"
        if [[ "$P" -lt 6 ]]; then
            pause "$P"
        fi
    done
    echo ""
    echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}${BOLD}  ALL PHASES (1-6) COMPLETE${NC}"
    echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════════${NC}"
    echo ""
    echo "  Next: Follow DNS_CUTOVER_CHECKLIST.md for Phase 7"
    echo "  Run:  bash deploy-full.sh 7"
    echo ""
else
    run_phase "$PHASE"
fi
