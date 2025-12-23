#!/bin/bash

# ============================================
# DUODRIVEN Website Installation Script
# One-command deployment with SSL
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════╗"
echo "║       DUODRIVEN Website Installation Script       ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (sudo ./install.sh)${NC}"
    exit 1
fi

# Check for required commands
command -v docker >/dev/null 2>&1 || { echo -e "${RED}Docker is required but not installed. Installing...${NC}"; curl -fsSL https://get.docker.com | sh; }
command -v docker-compose >/dev/null 2>&1 || command -v "docker compose" >/dev/null 2>&1 || { echo -e "${RED}Docker Compose is required but not installed.${NC}"; exit 1; }

# Get domain and email
echo -e "${YELLOW}Enter your domain (e.g., duodriven.com):${NC}"
read -r DOMAIN
echo -e "${YELLOW}Enter your email for SSL certificate:${NC}"
read -r EMAIL

# Validate inputs
if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo -e "${RED}Domain and email are required!${NC}"
    exit 1
fi

echo -e "${GREEN}Setting up DUODRIVEN for ${DOMAIN}...${NC}"

# Create .env file
cat > .env << EOF
FLASK_ENV=production
DOMAIN=${DOMAIN}
EMAIL=${EMAIL}
N8N_WEBHOOK_URL=
CONTACT_WEBHOOK_URL=
EOF

# Update nginx config with domain
echo -e "${BLUE}Configuring nginx...${NC}"
sed -i "s/YOUR_DOMAIN/${DOMAIN}/g" nginx/nginx.conf
sed -i "s/YOUR_DOMAIN/${DOMAIN}/g" nginx/nginx-initial.conf

# Use initial config (HTTP only) for SSL certificate acquisition
cp nginx/nginx-initial.conf nginx/active.conf

# Create docker-compose override for initial setup
cat > docker-compose.override.yml << EOF
version: '3.8'
services:
  nginx:
    volumes:
      - ./nginx/active.conf:/etc/nginx/conf.d/default.conf:ro
      - certbot_conf:/etc/letsencrypt
      - certbot_www:/var/www/certbot
EOF

# Start services
echo -e "${BLUE}Starting services...${NC}"
docker compose up -d --build

# Wait for nginx to start
echo -e "${BLUE}Waiting for services to start...${NC}"
sleep 10

# Obtain SSL certificate
echo -e "${BLUE}Obtaining SSL certificate from Let's Encrypt...${NC}"
docker compose exec -T certbot certbot certonly \
    --webroot \
    -w /var/www/certbot \
    -d ${DOMAIN} \
    -d www.${DOMAIN} \
    --email ${EMAIL} \
    --agree-tos \
    --non-interactive

# Check if certificate was obtained
if [ -f "/var/lib/docker/volumes/$(basename $(pwd))_certbot_conf/_data/live/${DOMAIN}/fullchain.pem" ] || docker compose exec -T certbot test -f /etc/letsencrypt/live/${DOMAIN}/fullchain.pem 2>/dev/null; then
    echo -e "${GREEN}SSL certificate obtained successfully!${NC}"
    
    # Switch to full nginx config with SSL
    cp nginx/nginx.conf nginx/active.conf
    
    # Reload nginx
    docker compose exec -T nginx nginx -s reload
    
    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════════════╗"
    echo "║           Installation Complete! 🎉               ║"
    echo "╠═══════════════════════════════════════════════════╣"
    echo "║  Your site is now live at:                        ║"
    echo "║  https://${DOMAIN}                                "
    echo "║                                                   ║"
    echo "║  SSL certificate will auto-renew                  ║"
    echo "╚═══════════════════════════════════════════════════╝"
    echo -e "${NC}"
else
    echo -e "${YELLOW}"
    echo "SSL certificate could not be obtained."
    echo "Your site is running at http://${DOMAIN}"
    echo ""
    echo "To manually obtain SSL later, run:"
    echo "  docker compose exec certbot certbot certonly --webroot -w /var/www/certbot -d ${DOMAIN} -d www.${DOMAIN} --email ${EMAIL} --agree-tos"
    echo -e "${NC}"
fi

echo -e "${BLUE}Useful commands:${NC}"
echo "  View logs:     docker compose logs -f"
echo "  Stop:          docker compose down"
echo "  Restart:       docker compose restart"
echo "  Renew SSL:     docker compose exec certbot certbot renew"
