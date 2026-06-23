#!/bin/bash
# LibrePiano Setup für Raspberry Pi
# Ausführen mit: bash setup-pi.sh

set -e

echo "=== LibrePiano Pi Setup ==="

# Docker installieren (falls nicht vorhanden)
if ! command -v docker &> /dev/null; then
    echo "Installiere Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo "Docker installiert. Bitte neu einloggen und Skript erneut starten."
    exit 0
fi

# Docker Compose Plugin prüfen
if ! docker compose version &> /dev/null; then
    echo "Installiere Docker Compose Plugin..."
    sudo apt-get update
    sudo apt-get install -y docker-compose-plugin
fi

# Benutzer zur audio-Gruppe hinzufügen (für MIDI)
sudo usermod -aG audio $USER

echo ""
echo "=== Starte LibrePiano ==="
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "=== Fertig! ==="
echo "LibrePiano läuft auf: http://$(hostname -I | awk '{print $1}')"
echo "                  oder: http://$(hostname).local"
echo ""
echo "Piano anschließen (USB) — das Backend erkennt es automatisch."
echo "Logs anzeigen: docker compose -f docker-compose.prod.yml logs -f"
