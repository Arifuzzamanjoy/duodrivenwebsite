# Subdomain Setup Guide for DUODRIVEN

## DNS Configuration Required

Add these DNS records in your domain registrar (Hostinger, Cloudflare, etc.):

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | marketing | 134.199.230.98 | 3600 |
| A | automation | 134.199.230.98 | 3600 |
| A | ai | 134.199.230.98 | 3600 |

Or use CNAME records pointing to your main domain:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | marketing | duodriven.com | 3600 |
| CNAME | automation | duodriven.com | 3600 |
| CNAME | ai | duodriven.com | 3600 |

## After DNS Propagation (5-30 minutes)

### 1. Get SSL Certificates for Subdomains

```bash
# Option A: Add subdomains to existing certificate
docker exec certbot certbot certonly \
    --webroot \
    -w /var/www/certbot \
    -d duodriven.com \
    -d www.duodriven.com \
    -d marketing.duodriven.com \
    -d automation.duodriven.com \
    -d ai.duodriven.com \
    --email joy.apee@gmail.com \
    --agree-tos \
    --expand

# Option B: Wildcard certificate (requires DNS validation)
docker exec certbot certbot certonly \
    --manual \
    --preferred-challenges dns \
    -d duodriven.com \
    -d *.duodriven.com \
    --email joy.apee@gmail.com \
    --agree-tos
```

### 2. Reload Nginx
```bash
docker exec nginx nginx -s reload
```

## Testing

After setup, these URLs should work:

- https://marketing.duodriven.com - Digital Marketing Landing Page
- https://automation.duodriven.com - Marketing Automation Landing Page  
- https://ai.duodriven.com - AI Engineering Landing Page

## Alternative: Path-Based Access (Already Working!)

If you prefer not to set up subdomains, the pages are also accessible at:

- https://duodriven.com/pillar/marketing
- https://duodriven.com/pillar/automation
- https://duodriven.com/pillar/ai

## Files Created

```
templates/pillars/
├── base_pillar.html      # Base template for pillar pages
├── marketing.html        # Digital Marketing landing page
├── automation.html       # Marketing Automation landing page
└── ai.html               # AI Engineering landing page

nginx/
└── subdomains.conf       # Nginx config for subdomains
```

## SEO Benefits

Each pillar page is optimized for:
- Unique meta titles and descriptions
- Targeted keywords for 2025 trends
- Schema.org structured data
- FAQ rich snippets
- Open Graph social sharing
- Canonical URLs

### Target Keywords by Page:

**Marketing (marketing.duodriven.com)**
- digital marketing agency 2025
- SEO services
- Google Ads management
- social media marketing
- PPC agency

**Automation (automation.duodriven.com)**
- marketing automation agency
- HubSpot partner
- Zapier expert
- Make.com integrations
- workflow automation

**AI (ai.duodriven.com)**
- AI engineering agency
- ChatGPT integration
- LLM development
- custom AI solutions
- machine learning development
