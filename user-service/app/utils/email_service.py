import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "no-reply@shopmate.com")


def send_otp_email(to_email: str, otp: int) -> bool:
    """
    Background task to send OTP verification email.
    If SMTP credentials are not provided, it logs the OTP for local development.
    """
    subject = f"Your ShopMate Verification Code is {otp}"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; }}
            .container {{ max-width: 500px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }}
            .header {{ text-align: center; border-bottom: 1px solid #eeeeee; padding-bottom: 20px; }}
            .logo {{ font-size: 24px; font-weight: bold; color: #2563eb; }}
            .content {{ padding: 20px 0; text-align: center; }}
            .otp-box {{ display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e293b; background: #f1f5f9; padding: 15px 30px; border-radius: 8px; margin: 20px 0; }}
            .footer {{ text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">ShopMate</div>
                <p style="color: #64748b; margin: 5px 0 0;">Good Products. Better You.</p>
            </div>
            <div class="content">
                <h2 style="color: #0f172a;">Verify Your Email Address</h2>
                <p style="color: #475569;">Use the following One-Time Password (OTP) to sign in to your ShopMate account. This code is valid for <strong>5 minutes</strong>.</p>
                <div class="otp-box">{otp}</div>
                <p style="color: #64748b; font-size: 14px;">If you did not request this code, please ignore this email.</p>
            </div>
            <div class="footer">
                &copy; ShopMate Microservices. All rights reserved.
            </div>
        </div>
    </body>
    </html>
    """

    logger.info(f"[OTP Background Worker] Dispatching OTP {otp} to {to_email}")
    print(f"\n>>> [BACKGROUND EMAIL TASK] Sent OTP [{otp}] to email: {to_email} <<<")

    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("SMTP credentials not configured. OTP logged to console fallback.")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = FROM_EMAIL
        msg["To"] = to_email

        part = MIMEText(html_content, "html")
        msg.attach(part)

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(FROM_EMAIL, to_email, msg.as_string())
        
        logger.info(f"OTP email successfully sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send OTP email to {to_email}: {e}")
        return False
