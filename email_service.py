"""
Email service for sending OTP and notifications
Supports both SMTP and console output for development
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

# Email configuration
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@celecircle.com")
USE_EMAIL = os.getenv("USE_EMAIL", "false").lower() == "true"

def send_otp_email(email: str, otp: str) -> bool:
    """
    Send OTP email to user.
    Returns True if sent successfully, False otherwise.
    """
    subject = "Your CeleCircle Verification Code"
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #0077b5;">CeleCircle Verification Code</h2>
        <p>Hello,</p>
        <p>Your verification code is:</p>
        <div style="background: #f3f2ef; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #0077b5; font-size: 32px; letter-spacing: 8px; margin: 0;">{otp}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">CeleCircle - Entertainment Industry Marketplace</p>
    </body>
    </html>
    """
    
    if USE_EMAIL and SMTP_USERNAME and SMTP_PASSWORD:
        try:
            return send_email_smtp(email, subject, body)
        except Exception as e:
            print(f"Error sending email via SMTP: {e}")
            print(f"Falling back to console output. OTP for {email}: {otp}")
            return False
    else:
        # Development mode - print to console
        print("\n" + "="*50)
        print("EMAIL (Development Mode)")
        print(f"To: {email}")
        print(f"Subject: {subject}")
        print(f"OTP: {otp}")
        print("="*50 + "\n")
        return True

def send_email_smtp(to_email: str, subject: str, html_body: str) -> bool:
    """Send email using SMTP"""
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = FROM_EMAIL
        msg['To'] = to_email
        
        text_part = MIMEText(html_body, 'html')
        msg.attach(text_part)
        
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        
        return True
    except Exception as e:
        print(f"SMTP Error: {e}")
        return False

def send_notification_email(email: str, title: str, message: str) -> bool:
    """Send notification email"""
    subject = f"CeleCircle: {title}"
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #0077b5;">{title}</h2>
        <p>{message}</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">CeleCircle - Entertainment Industry Marketplace</p>
    </body>
    </html>
    """
    
    if USE_EMAIL and SMTP_USERNAME and SMTP_PASSWORD:
        try:
            return send_email_smtp(email, subject, body)
        except Exception as e:
            print(f"Error sending notification email: {e}")
            return False
    else:
        print(f"\nNotification to {email}: {title} - {message}\n")
        return True

