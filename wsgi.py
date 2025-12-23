"""
WSGI entry point for production deployment
"""
import os
from dotenv import load_dotenv
from app import create_app

load_dotenv()

app = create_app(os.getenv('FLASK_ENV', 'production'))

if __name__ == "__main__":
    app.run()
