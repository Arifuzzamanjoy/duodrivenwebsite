"""
DUODRIVEN Database Models
"""

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from slugify import slugify

db = SQLAlchemy()


class BlogPost(db.Model):
    """Blog post model for dynamic content management"""
    __tablename__ = 'blog_posts'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    slug = db.Column(db.String(255), unique=True, nullable=False)
    excerpt = db.Column(db.Text)
    content = db.Column(db.Text, nullable=False)
    featured_image = db.Column(db.String(500))
    
    # SEO
    meta_title = db.Column(db.String(70))
    meta_description = db.Column(db.String(160))
    
    # Categorization
    category = db.Column(db.String(100), default='digital-marketing')
    tags = db.Column(db.JSON, default=list)
    
    # Publishing
    status = db.Column(db.String(20), default='draft')  # draft, published, scheduled
    published_at = db.Column(db.DateTime)
    scheduled_for = db.Column(db.DateTime)
    
    # Meta
    author = db.Column(db.String(100), default='DUODRIVEN Team')
    read_time = db.Column(db.Integer, default=5)
    views = db.Column(db.Integer, default=0)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # n8n tracking
    source = db.Column(db.String(50), default='manual')  # manual, n8n, api
    external_id = db.Column(db.String(100))
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.slug and self.title:
            self.slug = slugify(self.title)
        if self.content:
            word_count = len(self.content.split())
            self.read_time = max(1, word_count // 200)
    
    def to_dict(self):
        """Convert model to dictionary for API responses"""
        return {
            'id': self.id,
            'title': self.title,
            'slug': self.slug,
            'excerpt': self.excerpt,
            'content': self.content,
            'featured_image': self.featured_image,
            'meta_title': self.meta_title,
            'meta_description': self.meta_description,
            'category': self.category,
            'tags': self.tags or [],
            'status': self.status,
            'published_at': self.published_at.isoformat() if self.published_at else None,
            'scheduled_for': self.scheduled_for.isoformat() if self.scheduled_for else None,
            'author': self.author,
            'read_time': self.read_time,
            'views': self.views,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'source': self.source,
            'url': f'/blog/{self.slug}'
        }


class ContactSubmission(db.Model):
    """Store contact form submissions"""
    __tablename__ = 'contact_submissions'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    company = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    message = db.Column(db.Text, nullable=False)
    service_interest = db.Column(db.String(100))
    budget_range = db.Column(db.String(50))
    
    # Status tracking
    status = db.Column(db.String(20), default='new')  # new, contacted, qualified, closed
    notes = db.Column(db.Text)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Source tracking
    source = db.Column(db.String(50), default='website')
    utm_source = db.Column(db.String(100))
    utm_medium = db.Column(db.String(100))
    utm_campaign = db.Column(db.String(100))


class NewsletterSubscriber(db.Model):
    """Newsletter subscribers"""
    __tablename__ = 'newsletter_subscribers'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(100))
    
    # Status
    status = db.Column(db.String(20), default='active')  # active, unsubscribed
    
    # Timestamps
    subscribed_at = db.Column(db.DateTime, default=datetime.utcnow)
    unsubscribed_at = db.Column(db.DateTime)
    
    # Source
    source = db.Column(db.String(50), default='website')
