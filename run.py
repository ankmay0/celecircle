"""
Development server runner
"""
import uvicorn
from database import init_db

if __name__ == "__main__":
    # Initialize database on startup
    init_db()
    
    # Run development server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

