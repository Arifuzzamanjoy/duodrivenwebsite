# DUODRIVEN Website

Full-Stack Growth Engineering Website - Marketing + Automation + AI

![DUODRIVEN](meta_image/hero.jfif)

## 🚀 Quick Start (One-Command Install)

```bash
# Clone the repository
git clone https://github.com/Arifuzzamanjoy/duodrivenwebsite.git
cd duodrivenwebsite

# Make install script executable and run
chmod +x install.sh
sudo ./install.sh
```

The script will:
1. Install Docker if not present
2. Ask for your domain and email
3. Start all services
4. Automatically obtain SSL certificate from Let's Encrypt
5. Configure HTTPS with auto-renewal

## 📋 Requirements

- Linux server (Ubuntu 20.04+ recommended)
- Docker & Docker Compose
- Domain pointed to your server's IP
- Ports 80 and 443 available

## 🛠️ Manual Installation

### Step 1: Clone and Configure

```bash
git clone https://github.com/Arifuzzamanjoy/duodrivenwebsite.git
cd duodrivenwebsite

# Copy environment file
cp .env.example .env
# Edit with your values
nano .env
```

### Step 2: Configure Nginx

```bash
# Replace YOUR_DOMAIN with your actual domain
sed -i 's/YOUR_DOMAIN/yourdomain.com/g' nginx/nginx.conf
sed -i 's/YOUR_DOMAIN/yourdomain.com/g' nginx/nginx-initial.conf
```

### Step 3: Start Services (HTTP First)

```bash
# Use initial config without SSL
cp nginx/nginx-initial.conf nginx/active.conf

# Create override file
cat > docker-compose.override.yml << EOF
version: '3.8'
services:
  nginx:
    volumes:
      - ./nginx/active.conf:/etc/nginx/conf.d/default.conf:ro
EOF

# Start services
docker compose up -d --build
```

### Step 4: Obtain SSL Certificate

```bash
# Get certificate from Let's Encrypt
docker compose exec certbot certbot certonly \
    --webroot \
    -w /var/www/certbot \
    -d yourdomain.com \
    -d www.yourdomain.com \
    --email your-email@example.com \
    --agree-tos \
    --non-interactive
```

### Step 5: Enable HTTPS

```bash
# Switch to full SSL config
cp nginx/nginx.conf nginx/active.conf

# Reload nginx
docker compose exec nginx nginx -s reload
```

## 🔧 Existing Server Integration

If you already have nginx running (e.g., with n8n or other services):

### Add to Existing nginx config

```nginx
# Add this server block to your existing nginx config

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    http2 on;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://172.17.0.1:8000;  # Or your Flask app address
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Run Flask App Standalone

```bash
# Install dependencies
pip install -r requirements.txt

# Run with Gunicorn
gunicorn --bind 0.0.0.0:8000 --workers 4 wsgi:app
```

## ⚠️ Common SSL Issues & Solutions

### Issue: "404 on ACME Challenge" 

**Problem:** Let's Encrypt can't verify domain ownership.

**Solution:**
1. **Don't include HTTPS block before getting certificate!**
2. Start with HTTP-only config:

```nginx
# WRONG - Don't use this before getting certificate
server {
    listen 443 ssl;  # ❌ This will fail without certificate
    ssl_certificate /path/to/cert;
}

# CORRECT - Use this first
server {
    listen 80;
    server_name yourdomain.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        proxy_pass http://your-app:8000;  # Serve HTTP temporarily
    }
}
```

3. Get certificate, then add HTTPS block
4. Reload nginx

### Issue: "Cannot load certificate - No such file"

**Problem:** nginx config references certificate that doesn't exist yet.

**Solution:** 
1. Comment out or remove the `server { listen 443 ... }` block
2. Get the certificate first
3. Then add back the HTTPS server block

### Issue: Certificate renewal fails

**Solution:**
```bash
# Test renewal
docker compose exec certbot certbot renew --dry-run

# Force renewal
docker compose exec certbot certbot renew --force-renewal
```

## 📁 Project Structure

```
duodrivenwebsite/
├── app.py              # Flask application
├── config.py           # Configuration settings
├── wsgi.py             # WSGI entry point
├── requirements.txt    # Python dependencies
├── Dockerfile          # Docker build file
├── docker-compose.yml  # Docker services
├── install.sh          # One-command installer
├── nginx/
│   ├── nginx.conf          # Full SSL config
│   └── nginx-initial.conf  # HTTP-only (for initial SSL)
├── static/
│   ├── css/            # Stylesheets
│   ├── js/             # JavaScript
│   └── images/         # Static images
├── templates/          # Jinja2 HTML templates
└── meta_image/         # Meta/social images
```

## 🔄 Updates

```bash
cd duodrivenwebsite
git pull
docker compose up -d --build
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `FLASK_ENV` | Environment (production/development) | Yes |
| `DOMAIN` | Your domain name | Yes |
| `EMAIL` | Email for SSL certificate | Yes |
| `N8N_WEBHOOK_URL` | n8n webhook for chat | No |
| `CONTACT_WEBHOOK_URL` | Webhook for contact form | No |

## 🛡️ Security Features

- HTTPS with Let's Encrypt (auto-renewal)
- Security headers (HSTS, X-Frame-Options, etc.)
- Non-root Docker user
- Rate limiting ready

## 📞 Support

- Issues: [GitHub Issues](https://github.com/Arifuzzamanjoy/duodrivenwebsite/issues)
- Website: [duodriven.com](https://duodriven.com)

## 📄 License

MIT License - see [LICENSE](LICENSE) file
