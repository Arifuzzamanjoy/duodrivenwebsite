"""
Blog Routes - Public blog pages
"""

from flask import Blueprint, render_template, request, abort
import markdown

blog_bp = Blueprint('blog', __name__, url_prefix='/blog')


@blog_bp.route('/')
def blog_index():
    """Blog listing page with pagination and filtering"""
    from models import BlogPost, db
    
    page = request.args.get('page', 1, type=int)
    category = request.args.get('category')
    tag = request.args.get('tag')
    per_page = 9
    
    # Base query - only published posts
    query = BlogPost.query.filter_by(status='published')
    
    # Filter by category
    if category:
        query = query.filter_by(category=category)
    
    # Filter by tag (JSON contains)
    if tag:
        query = query.filter(BlogPost.tags.contains([tag]))
    
    # Paginate results
    posts = query.order_by(BlogPost.published_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    # Get categories with counts for sidebar
    categories = db.session.query(
        BlogPost.category,
        db.func.count(BlogPost.id).label('count')
    ).filter_by(status='published').group_by(BlogPost.category).all()
    
    # Get popular tags
    all_posts = BlogPost.query.filter_by(status='published').all()
    tag_counts = {}
    for post in all_posts:
        if post.tags:
            for t in post.tags:
                tag_counts[t] = tag_counts.get(t, 0) + 1
    popular_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    
    return render_template(
        'blog/index.html',
        posts=posts,
        categories=categories,
        popular_tags=popular_tags,
        current_category=category,
        current_tag=tag
    )


@blog_bp.route('/<slug>')
def blog_post(slug):
    """Individual blog post page"""
    from models import db, BlogPost
    
    # Get the post
    post = BlogPost.query.filter_by(slug=slug, status='published').first()
    
    if not post:
        # Check if it's a draft (for preview with query param)
        if request.args.get('preview'):
            post = BlogPost.query.filter_by(slug=slug).first()
        
        if not post:
            abort(404)
    
    # Increment view count
    post.views += 1
    db.session.commit()
    
    # Convert markdown to HTML
    md_extensions = ['fenced_code', 'tables', 'toc', 'nl2br']
    post.html_content = markdown.markdown(post.content, extensions=md_extensions)
    
    # Get related posts (same category, excluding current)
    related = BlogPost.query.filter(
        BlogPost.category == post.category,
        BlogPost.id != post.id,
        BlogPost.status == 'published'
    ).order_by(BlogPost.published_at.desc()).limit(3).all()
    
    # Get next/prev posts
    prev_post = BlogPost.query.filter(
        BlogPost.published_at < post.published_at,
        BlogPost.status == 'published'
    ).order_by(BlogPost.published_at.desc()).first()
    
    next_post = BlogPost.query.filter(
        BlogPost.published_at > post.published_at,
        BlogPost.status == 'published'
    ).order_by(BlogPost.published_at.asc()).first()
    
    return render_template(
        'blog/post.html',
        post=post,
        related=related,
        prev_post=prev_post,
        next_post=next_post
    )


@blog_bp.route('/category/<category>')
def blog_category(category):
    """Redirect to blog with category filter"""
    from flask import redirect, url_for
    return redirect(url_for('blog.blog_index', category=category))


@blog_bp.route('/tag/<tag>')
def blog_tag(tag):
    """Redirect to blog with tag filter"""
    from flask import redirect, url_for
    return redirect(url_for('blog.blog_index', tag=tag))


@blog_bp.route('/feed.xml')
def rss_feed():
    """RSS feed for blog posts"""
    from models import BlogPost
    
    posts = BlogPost.query.filter_by(status='published').order_by(
        BlogPost.published_at.desc()
    ).limit(20).all()
    
    return render_template('blog/rss.xml', posts=posts), {
        'Content-Type': 'application/xml; charset=utf-8'
    }


@blog_bp.route('/sitemap.xml')
def blog_sitemap():
    """Sitemap for blog posts"""
    from models import BlogPost
    
    posts = BlogPost.query.filter_by(status='published').order_by(
        BlogPost.published_at.desc()
    ).all()
    
    return render_template('blog/sitemap.xml', posts=posts), {
        'Content-Type': 'application/xml; charset=utf-8'
    }
