#!/bin/bash
# DUODRIVEN Hostinger Setup Script
# Run this after SSH'ing into your Hostinger server
# Usage: bash setup-hostinger.sh

set -e

echo "============================================"
echo "DUODRIVEN Hostinger Setup Script"
echo "============================================"

# Configuration
USERNAME="duodriven"  # Change if using different user
APP_DIR="/home/$USERNAME/public_html/duodrivenwebsite"
DOMAIN="your-domain.com"  # Change to your domain

echo ""
echo "1️⃣  Creating directory structure..."
mkdir -p $APP_DIR/logs
mkdir -p /var/log/duodriven

echo ""
echo "2️⃣  Creating logs directory with proper permissions..."
sudo touch $APP_DIR/logs/access.log
sudo touch $APP_DIR/logs/error.log
sudo chown -R $USERNAME:$USERNAME $APP_DIR/logs
sudo chmod 755 $APP_DIR/logs

echo ""
echo "3️⃣  Installing Python3 and dependencies (if not already installed)..."
sudo apt-get update
sudo apt-get install -y python3 python3-venv python3-pip nginx certbot python3-certbot-nginx

echo ""
echo "4️⃣  Setting up Python virtual environment..."
cd $APP_DIR
python3 -m venv venv
source venv/bin/activate

echo ""
echo "5️⃣  Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo ""
echo "6️⃣  Creating .env file from example..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Please edit .env with your actual values:"
    echo "   nano $APP_DIR/.env"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "7️⃣  Installing systemd service..."
sudo cp duodriven.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable duodriven
sudo systemctl start duodriven

echo ""
echo "8️⃣  Checking service status..."
sudo systemctl status duodriven --no-pager

echo ""
echo "9️⃣  Configuring Nginx..."
sudo cp nginx.conf /etc/nginx/sites-available/$DOMAIN
sudo sed -i "s/your-domain.com/$DOMAIN/g" /etc/nginx/sites-available/$DOMAIN

# Enable the site
if [ ! -f /etc/nginx/sites-enabled/$DOMAIN ]; then
    sudo ln -s /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
fi

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

echo ""
echo "🔟 Setting up SSL certificate with Let's Encrypt..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN

echo ""
echo "1️⃣1️⃣  Setting up auto-renewal for SSL certificate..."
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

echo ""
echo "============================================"
echo "✅ Setup Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Edit the .env file with your webhook URLs:"
echo "   nano $APP_DIR/.env"
echo ""
echo "2. Verify the application is running:"
echo "   curl http://127.0.0.1:8000"
echo ""
echo "3. Check application logs:"
echo "   tail -f $APP_DIR/logs/error.log"
echo ""
echo "4. View systemd service status:"
echo "   sudo systemctl status duodriven"
echo ""
echo "5. Your site is now live at:"
echo "   https://$DOMAIN"
echo ""
echo "Useful commands:"
echo "  • Restart app:    sudo systemctl restart duodriven"
echo "  • View logs:      journalctl -u duodriven -f"
echo "  • Stop app:       sudo systemctl stop duodriven"
echo "  • Enable SSL auto-renew: sudo certbot renew --dry-run"
echo "============================================"
