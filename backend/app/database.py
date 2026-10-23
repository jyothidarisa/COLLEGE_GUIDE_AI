import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()

def get_engine():
    db_url = settings.DATABASE_URL
    # Render and Heroku often provide postgres:// URLs which SQLAlchemy requires as postgresql://
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    try:
        if db_url.startswith("sqlite"):
            engine = create_engine(
                db_url,
                connect_args={"check_same_thread": False}
            )
        else:
            engine = create_engine(
                db_url,
                pool_pre_ping=True,
                pool_recycle=3600
            )
        # Test connection
        with engine.connect() as conn:
            pass
        return engine
    except Exception as e:
        logger.warning(
            f"Could not connect using configured DATABASE_URL ({db_url}): {e}. "
            "Falling back to local SQLite database (sqlite:///./college_guide.db)."
        )
        fallback_url = "sqlite:///./college_guide.db"
        return create_engine(
            fallback_url,
            connect_args={"check_same_thread": False}
        )

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from sqlalchemy import text, inspect

def init_db():
    """Initializes tables in database."""
    Base.metadata.create_all(bind=engine)
    try:
        inspector = inspect(engine)
        if inspector.has_table("colleges"):
            existing_cols = [col["name"] for col in inspector.get_columns("colleges")]
            with engine.connect() as conn:
                if "image_url" not in existing_cols:
                    conn.execute(text("ALTER TABLE colleges ADD COLUMN image_url VARCHAR(500);"))
                if "image_source" not in existing_cols:
                    conn.execute(text("ALTER TABLE colleges ADD COLUMN image_source VARCHAR(255);"))
                conn.commit()
    except Exception as e:
        logger.debug(f"Column migration note: {e}")
