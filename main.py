from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from jinja2 import Template
from database import init_db
import os
from pathlib import Path

init_db()

app = FastAPI(
    title="CeleLink API",
    description="Entertainment Industry Marketplace API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler to return JSON errors instead of HTML
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={
            "detail": f"Internal server error: {str(exc)}",
            "type": type(exc).__name__
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "detail": exc.errors(),
            "body": exc.body
        }
    )

os.makedirs("static", exist_ok=True)
os.makedirs("uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

TEMPLATES_DIR = Path("templates")

def render_template(template_name: str, context: dict = None) -> str:
    """Render HTML template"""
    try:
        template_path = TEMPLATES_DIR / template_name
        if not template_path.exists():
            raise FileNotFoundError(f"Template {template_name} not found at {template_path}")
        with open(template_path, "r", encoding="utf-8") as f:
            template = Template(f.read())
        return template.render(context or {})
    except Exception as e:
        return f"<html><body><h1>Error loading template</h1><p>{str(e)}</p></body></html>"

from routers import auth, users, gigs, payments, chat, reviews, admin, posts, connections, news, bookings

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(gigs.router)
app.include_router(payments.router)
app.include_router(chat.router)
app.include_router(reviews.router)
app.include_router(admin.router)
app.include_router(posts.router)
app.include_router(connections.router)
app.include_router(news.router)
app.include_router(bookings.router)

@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    """Serve main page"""
    return HTMLResponse(content=render_template("index.html"))

@app.get("/login.html", response_class=HTMLResponse)
async def login_page_html(request: Request):
    return HTMLResponse(content=render_template("login.html"))

@app.get("/register.html", response_class=HTMLResponse)
async def register_page_html(request: Request):
    return HTMLResponse(content=render_template("register.html"))

@app.get("/dashboard.html", response_class=HTMLResponse)
async def dashboard_page_html(request: Request):
    return HTMLResponse(content=render_template("dashboard.html"))

@app.get("/profile.html", response_class=HTMLResponse)
async def profile_page_html(request: Request):
    return HTMLResponse(content=render_template("profile.html"))

@app.get("/post-gig.html", response_class=HTMLResponse)
async def post_gig_page_html(request: Request):
    return HTMLResponse(content=render_template("post-gig.html"))

@app.get("/browse-gigs.html", response_class=HTMLResponse)
async def browse_gigs_page_html(request: Request):
    return HTMLResponse(content=render_template("browse-gigs.html"))

@app.get("/gig-detail.html", response_class=HTMLResponse)
async def gig_detail_page_html(request: Request):
    return HTMLResponse(content=render_template("gig-detail.html"))

@app.get("/chat.html", response_class=HTMLResponse)
async def chat_page_html(request: Request):
    return HTMLResponse(content=render_template("chat.html"))

@app.get("/feed.html", response_class=HTMLResponse)
async def feed_page_html(request: Request):
    return HTMLResponse(content=render_template("feed.html"))

@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return HTMLResponse(content=render_template("login.html"))

@app.get("/register", response_class=HTMLResponse)
async def register_page(request: Request):
    return HTMLResponse(content=render_template("register.html"))

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard_page(request: Request):
    return HTMLResponse(content=render_template("dashboard.html"))

@app.get("/profile", response_class=HTMLResponse)
async def profile_page(request: Request):
    return HTMLResponse(content=render_template("profile.html"))

@app.get("/view-profile", response_class=HTMLResponse)
async def view_profile_page(request: Request):
    return HTMLResponse(content=render_template("view-profile.html"))

@app.get("/post-gig", response_class=HTMLResponse)
async def post_gig_page(request: Request):
    return HTMLResponse(content=render_template("post-gig.html"))

@app.get("/browse-gigs", response_class=HTMLResponse)
async def browse_gigs_page(request: Request):
    return HTMLResponse(content=render_template("browse-gigs.html"))

@app.get("/gig-detail", response_class=HTMLResponse)
async def gig_detail_page(request: Request):
    return HTMLResponse(content=render_template("gig-detail.html"))

@app.get("/chat", response_class=HTMLResponse)
async def chat_page(request: Request):
    return HTMLResponse(content=render_template("chat.html"))

@app.get("/feed", response_class=HTMLResponse)
async def feed_page(request: Request):
    return HTMLResponse(content=render_template("feed.html"))

@app.get("/connections.html", response_class=HTMLResponse)
async def connections_page_html(request: Request):
    return HTMLResponse(content=render_template("connections.html"))

@app.get("/connections", response_class=HTMLResponse)
async def connections_page(request: Request):
    return HTMLResponse(content=render_template("connections.html"))

@app.get("/notifications.html", response_class=HTMLResponse)
async def notifications_page_html(request: Request):
    return HTMLResponse(content=render_template("notifications.html"))

@app.get("/notifications", response_class=HTMLResponse)
async def notifications_page(request: Request):
    return HTMLResponse(content=render_template("notifications.html"))

@app.get("/settings", response_class=HTMLResponse)
async def settings_page(request: Request):
    return HTMLResponse(content=render_template("settings.html"))

@app.get("/premium", response_class=HTMLResponse)
async def premium_page(request: Request):
    return HTMLResponse(content=render_template("premium.html"))

@app.get("/posts-activity", response_class=HTMLResponse)
async def posts_activity_page(request: Request):
    return HTMLResponse(content=render_template("posts-activity.html"))

@app.get("/help", response_class=HTMLResponse)
async def help_page(request: Request):
    return HTMLResponse(content=render_template("help.html"))

@app.get("/contact-sales", response_class=HTMLResponse)
async def contact_sales_page(request: Request):
    return HTMLResponse(content=render_template("help.html"))

@app.get("/secure-payments", response_class=HTMLResponse)
async def secure_payments_page(request: Request):
    return HTMLResponse(content=render_template("secure-payments.html"))

@app.get("/terms", response_class=HTMLResponse)
async def terms_page(request: Request):
    return HTMLResponse(content=render_template("terms.html"))

@app.get("/escrow", response_class=HTMLResponse)
async def escrow_page(request: Request):
    return HTMLResponse(content=render_template("escrow.html"))

@app.get("/payout", response_class=HTMLResponse)
async def payout_page(request: Request):
    return HTMLResponse(content=render_template("payout.html"))

@app.get("/language", response_class=HTMLResponse)
async def language_page(request: Request):
    return HTMLResponse(content=render_template("language.html"))

@app.get("/setup-profile", response_class=HTMLResponse)
async def setup_profile_page(request: Request):
    return HTMLResponse(content=render_template("setup-profile.html"))

@app.get("/bookings", response_class=HTMLResponse)
async def bookings_page(request: Request):
    return HTMLResponse(content=render_template("bookings.html"))

@app.get("/payment-history", response_class=HTMLResponse)
async def payment_history_page(request: Request):
    return HTMLResponse(content=render_template("payment-history.html"))

@app.get("/admin", response_class=HTMLResponse)
async def admin_panel_page(request: Request):
    return HTMLResponse(content=render_template("admin.html"))

@app.get("/admin/finance", response_class=HTMLResponse)
async def admin_finance_page(request: Request):
    return HTMLResponse(content=render_template("admin-finance.html"))

@app.get("/admin/disputes", response_class=HTMLResponse)
async def admin_disputes_page(request: Request):
    return HTMLResponse(content=render_template("admin-disputes.html"))

@app.get("/admin/settings", response_class=HTMLResponse)
async def admin_settings_page(request: Request):
    return HTMLResponse(content=render_template("admin-settings.html"))

@app.get("/admin/analytics", response_class=HTMLResponse)
async def admin_analytics_page(request: Request):
    return HTMLResponse(content=render_template("admin-analytics.html"))

@app.get("/admin/reports", response_class=HTMLResponse)
async def admin_reports_page(request: Request):
    return HTMLResponse(content=render_template("admin-reports.html"))

@app.get("/admin/audit-logs", response_class=HTMLResponse)
async def admin_audit_logs_page(request: Request):
    return HTMLResponse(content=render_template("admin-audit.html"))

@app.get("/admin/{subpage}", response_class=HTMLResponse)
async def admin_subpage(request: Request, subpage: str):
    return HTMLResponse(content=render_template("admin.html"))

@app.get("/bookings.html", response_class=HTMLResponse)
async def bookings_page_html(request: Request):
    return HTMLResponse(content=render_template("bookings.html"))

@app.get("/payment-history.html", response_class=HTMLResponse)
async def payment_history_page_html(request: Request):
    return HTMLResponse(content=render_template("payment-history.html"))

@app.get("/news", response_class=HTMLResponse)
async def news_page(request: Request):
    return HTMLResponse(content=render_template("news.html"))

@app.get("/eventnet", response_class=HTMLResponse)
async def eventnet_home_page(request: Request):
    return HTMLResponse(content=render_template("eventnet-home.html"))

@app.get("/eventnet/profile", response_class=HTMLResponse)
async def eventnet_profile_page(request: Request):
    return HTMLResponse(content=render_template("eventnet-profile.html"))

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "CeleLink API"}

# Serve React SPA build (frontend/dist) if available
REACT_DIST = Path("frontend/dist")
if REACT_DIST.exists() and (REACT_DIST / "index.html").exists():
    app.mount("/assets", StaticFiles(directory=str(REACT_DIST / "assets")), name="react-assets")

    @app.get("/react/{full_path:path}", response_class=HTMLResponse)
    async def serve_react(request: Request, full_path: str = ""):
        with open(REACT_DIST / "index.html", "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())

    @app.get("/react", response_class=HTMLResponse)
    async def serve_react_root(request: Request):
        with open(REACT_DIST / "index.html", "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

