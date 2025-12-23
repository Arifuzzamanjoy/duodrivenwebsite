# GUNICORN & SSL SETUP GUIDE

## Testing Gunicorn Locally ✅

Your Gunicorn is already running successfully on `127.0.0.1:8000`!

```bash
# Start Gunicorn (4 workers)
gunicorn -w 4 -b 127.0.0.1:8000 wsgi:app

# Start with access logs
gunicorn -w 4 -b 127.0.0.1:8000 --access-logfile - wsgi:app

# Start in background
gunicorn -w 4 -b 127.0.0.1:8000 wsgi:app &
```

---

## On Hostinger: Automated Setup

We've created an automated setup script that does everything for you:

### Step 1: Upload Files to Hostinger
```bash
# After SSH'ing into your Hostinger server
cd ~/public_html
git clone https://github.com/Arifuzzamanjoy/duodrivenwebsite.git
cd duodrivenwebsite
```

### Step 2: Run the Setup Script
```bash
# Make script executable
chmod +x setup-hostinger.sh

# Run the script (will prompt for sudo password)
bash setup-hostinger.sh
```

This script automatically:
- ✅ Creates Python virtual environment
- ✅ Installs all dependencies
- ✅ Sets up Gunicorn service
- ✅ Configures Nginx
- ✅ Installs SSL certificate (Let's Encrypt)
- ✅ Enables auto-renewal for SSL

---

## Manual Setup (If Preferred)

### 1. Create Virtual Environment
```bash
cd ~/public_html/duodrivenwebsite
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Create .env File
```bash
cp .env.example .env
nano .env
# Add your N8N webhooks and secret key
```

### 3. Install Systemd Service
```bash
sudo cp duodriven.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable duodriven
sudo systemctl start duodriven
```

### 4. Verify Service is Running
```bash
sudo systemctl status duodriven
# Should show: Active: active (running)
```

### 5. Configure Nginx
```bash
# Copy Nginx config
sudo cp nginx.conf /etc/nginx/sites-available/your-domain.com

# Edit domain name in config
sudo nano /etc/nginx/sites-available/your-domain.com
# Replace "your-domain.com" with your actual domain

# Enable the site
sudo ln -s /etc/nginx/sites-available/your-domain.com /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 6. Install SSL Certificate (Free from Let's Encrypt)
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
# Follow the prompts
```

### 7. Enable Auto-Renewal
```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## Useful Commands

### Check Application Status
```bash
sudo systemctl status duodriven
sudo systemctl is-active duodriven
```

### View Application Logs
```bash
# Real-time logs
journalctl -u duodriven -f

# Last 100 lines
journalctl -u duodriven -n 100

# Today's logs
journalctl -u duodriven --since today
```

### Manage Gunicorn Service
```bash
# Start
sudo systemctl start duodriven

# Stop
sudo systemctl stop duodriven

# Restart (after code changes)
sudo systemctl restart duodriven

# Disable auto-start
sudo systemctl disable duodriven
```

### View Access & Error Logs
```bash
# Access logs
tail -f ~/public_html/duodrivenwebsite/logs/access.log

# Error logs
tail -f ~/public_html/duodrivenwebsite/logs/error.log
```

### Check Nginx Status
```bash
sudo systemctl status nginx
sudo nginx -t  # Test configuration
```

### Manage SSL Certificate
```bash
# View certificate info
sudo certbot certificates

# Renew manually
sudo certbot renew

# Test auto-renewal (dry run)
sudo certbot renew --dry-run
```

---

## Deployment Checklist

- [ ] SSH access to Hostinger server
- [ ] Domain connected to Hostinger
- [ ] Repository cloned to `~/public_html/duodrivenwebsite`
- [ ] Virtual environment created
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] `.env` file created and configured with webhook URLs
- [ ] Gunicorn service installed and running
- [ ] Nginx configured and running
- [ ] SSL certificate installed and auto-renewing
- [ ] Site accessible at `https://your-domain.com`

---

## Troubleshooting

### Site shows 502 Bad Gateway
```bash
# Check if Gunicorn is running
sudo systemctl status duodriven

# Restart it
sudo systemctl restart duodriven

# Check logs
journalctl -u duodriven -f
```

### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal

# Fix permissions
sudo chown -R root:root /etc/letsencrypt/
```

### Static Files Not Loading
```bash
# Check Nginx config has correct paths
sudo nano /etc/nginx/sites-available/your-domain.com

# Should have:
# alias /home/username/public_html/duodrivenwebsite/static/;
```

### High Memory Usage
```bash
# Reduce workers in duodriven.service
sudo nano /etc/systemd/system/duodriven.service
# Change: --workers 4 to --workers 2

# Restart
sudo systemctl daemon-reload
sudo systemctl restart duodriven
```

### Logs Say Permission Denied
```bash
# Fix permissions
sudo chown -R duodriven:duodriven ~/public_html/duodrivenwebsite
sudo chmod -R 755 ~/public_html/duodrivenwebsite
```

---

## Security Best Practices

✅ **Already Configured:**
- HTTPS/SSL enabled
- Security headers configured
- Static file caching enabled
- Sensitive files blocked

📋 **Additional Steps:**
1. Change default SECRET_KEY in `.env`
2. Use strong passwords for webhooks
3. Regularly update dependencies: `pip install -r requirements.txt --upgrade`
4. Monitor logs for suspicious activity
5. Enable firewall rules for your server

---

## Performance Optimization

Current setup uses:
- 4 Gunicorn workers (good for small-medium traffic)
- Nginx reverse proxy
- Static file caching (30 days)
- Gzip compression

If experiencing slow performance:
1. Increase workers: `--workers 6` or `--workers 8`
2. Add caching headers for more files
3. Enable CDN for static files
4. Monitor server resources

---

## What's Included

Files created for Hostinger deployment:

1. **duodriven.service** - Systemd service configuration
2. **nginx.conf** - Nginx reverse proxy configuration
3. **.htaccess** - Apache configuration (alternative)
4. **setup-hostinger.sh** - Automated setup script
5. **wsgi.py** - WSGI entry point for production
6. **.env.example** - Environment variables template

---

## Support & Documentation

- Gunicorn: https://gunicorn.org/
- Nginx: https://nginx.org/
- Let's Encrypt: https://letsencrypt.org/
- Certbot: https://certbot.eff.org/
- Systemd: https://systemd.io/
