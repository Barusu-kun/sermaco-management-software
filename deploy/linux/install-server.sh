#!/usr/bin/env bash
# ============================================================
# Installation du serveur (Linux) — Planning Transport API
# Installe les dépendances, synchronise la base et enregistre
# un service systemd « planning-api ».
#
# Usage :
#   sudo ./install-server.sh [--seed]
#
# Prérequis : Node.js 20+, PostgreSQL accessible via DATABASE_URL.
# ============================================================
set -euo pipefail

SEED=0
[[ "${1:-}" == "--seed" ]] && SEED=1

# Répertoires
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$(cd "$SCRIPT_DIR/../../api" && pwd)"
SERVICE_NAME="planning-api"
RUN_USER="${SUDO_USER:-$(whoami)}"

echo "▶ Répertoire API : $API_DIR"
echo "▶ Utilisateur    : $RUN_USER"

# 1. Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js introuvable. Installez Node.js 20+ puis relancez." >&2
  exit 1
fi
echo "▶ Node : $(node -v)"

# 2. Fichier .env
if [[ ! -f "$API_DIR/.env" ]]; then
  echo "⚠ Aucun .env — copie depuis .env.example."
  cp "$API_DIR/.env.example" "$API_DIR/.env"
  echo "  ➜ ÉDITEZ $API_DIR/.env (DATABASE_URL, JWT_SECRET) avant de continuer."
  read -r -p "Appuyez sur Entrée une fois le .env configuré…" _
fi

# 3. Dépendances + client Prisma
echo "▶ Installation des dépendances…"
( cd "$API_DIR" && npm ci --omit=dev && npx prisma generate )

# 4. Schéma de base + seed optionnel
echo "▶ Synchronisation du schéma (prisma db push)…"
( cd "$API_DIR" && npx prisma db push )
if [[ "$SEED" == "1" ]]; then
  echo "▶ Chargement des données de démonstration…"
  ( cd "$API_DIR" && npm run db:seed )
fi

# 5. Service systemd
NODE_BIN="$(command -v node)"
UNIT_PATH="/etc/systemd/system/${SERVICE_NAME}.service"
echo "▶ Création du service systemd : $UNIT_PATH"

sudo tee "$UNIT_PATH" >/dev/null <<UNIT
[Unit]
Description=Planning Transport API
After=network.target postgresql.service

[Service]
Type=simple
User=$RUN_USER
WorkingDirectory=$API_DIR
EnvironmentFile=$API_DIR/.env
Environment=NODE_ENV=production
ExecStart=$NODE_BIN src/app.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

# 6. Démarrage
sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME"
sudo systemctl restart "$SERVICE_NAME"

echo ""
echo "✅ Service installé et démarré."
echo "   Statut : sudo systemctl status $SERVICE_NAME"
echo "   Logs   : sudo journalctl -u $SERVICE_NAME -f"
echo "   Santé  : curl http://localhost:3000/health"
