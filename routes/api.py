"""
API Routes for n8n Integration and Blog Management
"""

from flask import Blueprint, request, jsonify
from functools import wraps
from datetime import datetime
import os

api_bp = Blueprint('api', __name__, url_prefix='/api/v1')

# API Key from environment
API_KEY = os.environ.get('DUODRIVEN_API_KEY', 'change-this-to-secure-key-min-32-chars')


def require_api_key(f):
    """Decorator to require API key for protected endpoints"""
    @wraps(f)
    def decorated(*args, **kwargs):
        key = request.headers.get('X-API-Key') or request.args.get('api_key')
        if key != API_KEY:
            return jsonify({'error': 'Invalid or missing API key'}), 401
        return f(*args, **kwargs)
    return decorated


# ============================================
# BLOG POST ENDPOINTS
# ============================================

@api_bp.route('/posts', methods=['POST'])
@require_api_key
def create_post():
    """
    Create a new blog post - n8n webhook endpoint
    
    Expected JSON:
    {
        "title": "Post Title",
        "content": "Markdown or HTML content",
        "excerpt": "Short description",
        "category": "digital-marketing",
        "tags": ["seo", "ppc"],
        "featured_image": "https://...",
        "status": "draft|published|scheduled",
        "author": "Author Name",
        "meta_title": "SEO Title",
        "meta_description": "SEO Description",
        "external_id": "unique-id-from-source"
    }
    """
    from models import db, BlogPost
    from slugify import slugify
    
    data = request.get_json()
    
    if not data or 'title' not in data or 'content' not in data:
        return jsonify({'error': 'title and content are required'}), 400
    
    try:
        # Generate slug from title
        slug = slugify(data['title'])
        
        # Check if slug already exists, append number if needed
        existing = BlogPost.query.filter_by(slug=slug).first()
        if existing:
            count = BlogPost.query.filter(BlogPost.slug.like(f'{slug}%')).count()
            slug = f'{slug}-{count + 1}'
        
        # Create excerpt if not provided
        excerpt = data.get('excerpt')
        if not excerpt:
            content_text = data['content'][:300].replace('#', '').replace('*', '').strip()
            excerpt = content_text + '...' if len(data['content']) > 300 else content_text
        
        # Calculate read time
        word_count = len(data['content'].split())
        read_time = max(1, word_count // 200)
        
        post = BlogPost(
            title=data['title'],
            slug=slug,
            content=data['content'],
            excerpt=excerpt,
            category=data.get('category', 'digital-marketing'),
            tags=data.get('tags', []),
            featured_image=data.get('featured_image'),
            status=data.get('status', 'draft'),
            author=data.get('author', 'DUODRIVEN Team'),
            meta_title=data.get('meta_title', data['title'][:70]),
            meta_description=data.get('meta_description', excerpt[:160]),
            source='n8n' if request.headers.get('X-N8N-Workflow') else 'api',
            external_id=data.get('external_id'),
            read_time=read_time
        )
        
        # Set published_at if status is published
        if data.get('status') == 'published':
            post.published_at = datetime.utcnow()
        elif data.get('status') == 'scheduled' and data.get('scheduled_for'):
            post.scheduled_for = datetime.fromisoformat(data['scheduled_for'].replace('Z', '+00:00'))
        
        db.session.add(post)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'id': post.id,
            'slug': post.slug,
            'url': f'/blog/{post.slug}',
            'status': post.status
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api_bp.route('/posts', methods=['GET'])
@require_api_key
def list_posts():
    """
    List all blog posts with filtering
    
    Query params:
    - status: filter by status (draft, published, scheduled, all)
    - category: filter by category
    - limit: number of posts to return (default 50)
    - offset: pagination offset
    """
    from models import BlogPost
    
    status = request.args.get('status', 'all')
    category = request.args.get('category')
    limit = request.args.get('limit', 50, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    query = BlogPost.query
    
    if status != 'all':
        query = query.filter_by(status=status)
    if category:
        query = query.filter_by(category=category)
    
    total = query.count()
    posts = query.order_by(BlogPost.created_at.desc()).offset(offset).limit(limit).all()
    
    return jsonify({
        'total': total,
        'limit': limit,
        'offset': offset,
        'posts': [p.to_dict() for p in posts]
    })


@api_bp.route('/posts/<int:post_id>', methods=['GET'])
@require_api_key
def get_post(post_id):
    """Get a single post by ID"""
    from models import BlogPost
    
    post = BlogPost.query.get_or_404(post_id)
    return jsonify(post.to_dict())


@api_bp.route('/posts/<int:post_id>', methods=['PUT', 'PATCH'])
@require_api_key
def update_post(post_id):
    """
    Update an existing blog post
    
    All fields are optional - only provided fields will be updated
    """
    from models import db, BlogPost
    from slugify import slugify
    
    post = BlogPost.query.get_or_404(post_id)
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        # Update allowed fields
        updatable_fields = [
            'title', 'content', 'excerpt', 'category', 'tags', 
            'featured_image', 'status', 'author', 'meta_title', 
            'meta_description', 'scheduled_for'
        ]
        
        for field in updatable_fields:
            if field in data:
                if field == 'scheduled_for' and data[field]:
                    setattr(post, field, datetime.fromisoformat(data[field].replace('Z', '+00:00')))
                else:
                    setattr(post, field, data[field])
        
        # Regenerate slug if title changed
        if 'title' in data:
            new_slug = slugify(data['title'])
            if new_slug != post.slug:
                existing = BlogPost.query.filter(BlogPost.slug == new_slug, BlogPost.id != post_id).first()
                if not existing:
                    post.slug = new_slug
        
        # Update read time if content changed
        if 'content' in data:
            word_count = len(data['content'].split())
            post.read_time = max(1, word_count // 200)
        
        # Set published_at if status changed to published
        if data.get('status') == 'published' and not post.published_at:
            post.published_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'id': post.id,
            'slug': post.slug,
            'url': f'/blog/{post.slug}'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api_bp.route('/posts/<int:post_id>', methods=['DELETE'])
@require_api_key
def delete_post(post_id):
    """Delete a blog post"""
    from models import db, BlogPost
    
    post = BlogPost.query.get_or_404(post_id)
    
    try:
        db.session.delete(post)
        db.session.commit()
        return jsonify({'success': True, 'message': f'Post {post_id} deleted'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api_bp.route('/posts/publish-scheduled', methods=['POST'])
@require_api_key
def publish_scheduled():
    """
    Publish all scheduled posts that are due
    Call this via n8n on a schedule (e.g., every hour)
    """
    from models import db, BlogPost
    
    now = datetime.utcnow()
    posts = BlogPost.query.filter(
        BlogPost.status == 'scheduled',
        BlogPost.scheduled_for <= now
    ).all()
    
    published_ids = []
    for post in posts:
        post.status = 'published'
        post.published_at = now
        published_ids.append(post.id)
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'published_count': len(published_ids),
        'published_ids': published_ids
    })


@api_bp.route('/posts/by-slug/<slug>', methods=['GET'])
@require_api_key
def get_post_by_slug(slug):
    """Get a post by its slug"""
    from models import BlogPost
    
    post = BlogPost.query.filter_by(slug=slug).first_or_404()
    return jsonify(post.to_dict())


# ============================================
# NEWSLETTER ENDPOINTS
# ============================================

@api_bp.route('/newsletter/subscribe', methods=['POST'])
def newsletter_subscribe():
    """
    Subscribe to newsletter - public endpoint (no API key required)
    """
    from models import db, NewsletterSubscriber
    
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    
    if not email or '@' not in email:
        return jsonify({'error': 'Valid email required'}), 400
    
    try:
        # Check if already subscribed
        existing = NewsletterSubscriber.query.filter_by(email=email).first()
        if existing:
            if existing.status == 'active':
                return jsonify({'success': True, 'message': 'Already subscribed'})
            else:
                existing.status = 'active'
                existing.unsubscribed_at = None
                db.session.commit()
                return jsonify({'success': True, 'message': 'Subscription reactivated'})
        
        subscriber = NewsletterSubscriber(
            email=email,
            name=data.get('name'),
            source=data.get('source', 'website')
        )
        
        db.session.add(subscriber)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Successfully subscribed!'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api_bp.route('/newsletter/subscribers', methods=['GET'])
@require_api_key
def list_subscribers():
    """List all newsletter subscribers"""
    from models import NewsletterSubscriber
    
    status = request.args.get('status', 'active')
    subscribers = NewsletterSubscriber.query.filter_by(status=status).all()
    
    return jsonify({
        'total': len(subscribers),
        'subscribers': [{
            'id': s.id,
            'email': s.email,
            'name': s.name,
            'subscribed_at': s.subscribed_at.isoformat() if s.subscribed_at else None
        } for s in subscribers]
    })


# ============================================
# STATS ENDPOINTS
# ============================================

@api_bp.route('/stats', methods=['GET'])
@require_api_key
def get_stats():
    """Get blog and newsletter statistics"""
    from models import db, BlogPost, NewsletterSubscriber, ContactSubmission
    
    stats = {
        'blog': {
            'total_posts': BlogPost.query.count(),
            'published': BlogPost.query.filter_by(status='published').count(),
            'drafts': BlogPost.query.filter_by(status='draft').count(),
            'scheduled': BlogPost.query.filter_by(status='scheduled').count(),
            'total_views': db.session.query(db.func.sum(BlogPost.views)).scalar() or 0
        },
        'newsletter': {
            'total_subscribers': NewsletterSubscriber.query.filter_by(status='active').count()
        },
        'contacts': {
            'total': ContactSubmission.query.count(),
            'new': ContactSubmission.query.filter_by(status='new').count()
        }
    }
    
    return jsonify(stats)
