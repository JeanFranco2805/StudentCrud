import os

import psycopg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")


def get_db():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL no configurada")

    conn = psycopg.connect(DATABASE_URL, autocommit=False)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
