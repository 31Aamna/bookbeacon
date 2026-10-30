import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'dev-jwt-secret-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'

    # SQLite DB stored in server/instance/
    basedir = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        f"sqlite:///{os.path.join(basedir, 'instance', 'bookbeacon.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Borrowing policy — configurable via env
    FINE_PER_DAY = float(os.environ.get('FINE_PER_DAY', '0.50'))
    LOAN_DAYS = int(os.environ.get('LOAN_DAYS', '14'))
    FINE_GRACE_PERIOD_DAYS = int(os.environ.get('FINE_GRACE_PERIOD_DAYS', '0'))

    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000')


class TestConfig(Config):
    TESTING = True
    basedir = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(basedir, 'instance', 'bookbeacon_test.db')}"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
