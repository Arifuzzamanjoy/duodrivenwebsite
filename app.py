"""
DUODRIVEN - Full-Stack Growth Engineering
Flask Application Entry Point
"""

from flask import Flask, render_template, request, jsonify
import requests
import os
import uuid
from datetime import datetime
from dotenv import load_dotenv
from config import config

load_dotenv()

def create_app(config_name='default'):
    """Application factory"""
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Store webhook URL
    app.config['N8N_WEBHOOK_URL'] = os.getenv('N8N_WEBHOOK_URL', '')
    app.config['CONTACT_WEBHOOK_URL'] = os.getenv('CONTACT_WEBHOOK_URL', '')
    
    # ============================================
    # ROUTES
    # ============================================
    
    @app.route('/')
    def index():
        """Homepage - Main landing page"""
        return render_template('index.html')
    
    @app.route('/services')
    def services():
        """Services page - detailed service information"""
        return render_template('services.html')
    
    @app.route('/case-studies')
    def case_studies():
        """Case studies page"""
        return render_template('case-studies.html')
    
    @app.route('/technology')
    def technology():
        """Technology stack page"""
        return render_template('technology.html')
    
    @app.route('/about')
    def about():
        """About page"""
        return render_template('about.html')
    
    @app.route('/contact')
    def contact():
        """Contact page"""
        return render_template('contact.html')
    
    # ============================================
    # API ENDPOINTS
    # ============================================
    
    @app.route('/api/chat', methods=['POST'])
    def chat():
        """
        Proxy endpoint for n8n webhook to handle AI chat.
        Avoids CORS issues by routing through backend.
        """
        data = request.json
        webhook_url = app.config.get('N8N_WEBHOOK_URL')
        
        if not webhook_url:
            return jsonify({
                'error': 'Chat service not configured',
                'reply': "I'm currently unavailable. Please email us at hello@duodriven.com"
            }), 503
        
        try:
            response = requests.post(
                webhook_url,
                json={
                    'chatInput': data.get('message', ''),
                    'sessionId': data.get('session_id', str(uuid.uuid4()))
                },
                timeout=60,
                headers={'Content-Type': 'application/json'}
            )
            
            # Log response for debugging
            print(f"Webhook Status: {response.status_code}")
            print(f"Webhook Response: {response.text[:500] if response.text else 'Empty'}")
            
            # Try to parse JSON response
            try:
                result = response.json()
                # Handle array response (n8n sometimes returns array)
                if isinstance(result, list) and len(result) > 0:
                    result = result[0]
                return jsonify(result)
            except Exception as e:
                print(f"JSON Parse Error: {e}")
                # If response isn't JSON, wrap it
                return jsonify({'response': response.text})
                
        except requests.exceptions.Timeout:
            return jsonify({
                'error': 'timeout',
                'reply': "I'm taking longer than expected. Please try again in a moment."
            }), 504
        except requests.exceptions.RequestException as e:
            return jsonify({
                'error': str(e),
                'reply': "I encountered a connection issue. Please try again."
            }), 500
        except Exception as e:
            return jsonify({
                'error': str(e),
                'reply': "Sorry, I encountered an error. Please try again or email us at hello@duodriven.com"
            }), 500
    
    @app.route('/api/contact', methods=['POST'])
    def submit_contact():
        """
        Handle contact form submissions.
        Can forward to n8n webhook or store locally.
        """
        data = request.json
        
        # Validate required fields
        required_fields = ['name', 'email', 'message']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Basic email validation
        email = data.get('email', '')
        if '@' not in email or '.' not in email:
            return jsonify({
                'success': False,
                'error': 'Please provide a valid email address'
            }), 400
        
        webhook_url = app.config.get('CONTACT_WEBHOOK_URL')
        
        contact_data = {
            'name': data.get('name'),
            'email': data.get('email'),
            'company': data.get('company', ''),
            'phone': data.get('phone', ''),
            'message': data.get('message'),
            'service_interest': data.get('service_interest', ''),
            'budget_range': data.get('budget_range', ''),
            'timestamp': datetime.utcnow().isoformat(),
            'source': 'website_contact_form'
        }
        
        if webhook_url:
            try:
                response = requests.post(
                    webhook_url,
                    json=contact_data,
                    timeout=10
                )
                response.raise_for_status()
            except Exception as e:
                # Log the error but don't fail - we can still store locally
                print(f"Webhook error: {e}")
        
        # Return success
        return jsonify({
            'success': True,
            'message': "Thank you for reaching out. Our engineering team will contact you within 24 hours."
        })
    
    @app.route('/api/health')
    def health_check():
        """Health check endpoint for monitoring"""
        return jsonify({
            'status': 'healthy',
            'service': 'duodriven-web',
            'timestamp': datetime.utcnow().isoformat()
        })
    
    # ============================================
    # ERROR HANDLERS
    # ============================================
    
    @app.errorhandler(404)
    def page_not_found(e):
        return render_template('errors/404.html'), 404
    
    @app.errorhandler(500)
    def server_error(e):
        return render_template('errors/500.html'), 500
    
    return app

# Create application instance
app = create_app(os.getenv('FLASK_ENV', 'development'))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
