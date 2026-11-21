# PrepSphere Transactional Email Templates & Domain Authentication Guide

This document defines the branded HTML templates, accessible plain-text alternates, SMTP configuration, and DNS records (SPF, DKIM, DMARC) required for PrepSphere production auth flows.

---

## 1. Domain Authentication & DNS Configuration (SPF, DKIM, DMARC)

To guarantee high inbox placement and prevent email spoofing for candidate password resets, magic links, and email confirmations, the following DNS records must be configured on the root domain (`prepsphere.io`) and mail sending subdomain (`mail.prepsphere.io`).

### 1.1 SPF (Sender Policy Framework)
Authorizes the transactional mail provider (e.g., Resend / AWS SES / Postmark) to send emails on behalf of `@prepsphere.io`.

- **Type**: `TXT`
- **Host**: `@` (or `mail.prepsphere.io`)
- **TTL**: `3600`
- **Value**:
  ```text
  v=spf1 include:resend.net include:amazonses.com ~all
  ```

### 1.2 DKIM (DomainKeys Identified Mail)
Cryptographically signs every outbound message to verify integrity in transit.

- **Type**: `CNAME` (Dual key rotation)
- **Host 1**: `resend1._domainkey.prepsphere.io`
  - **Value**: `resend1.domainkey.resend.net`
- **Host 2**: `resend2._domainkey.prepsphere.io`
  - **Value**: `resend2.domainkey.resend.net`
- **TTL**: `3600`

### 1.3 DMARC (Domain-based Message Authentication, Reporting & Conformance)
Enforces quarantine or rejection policies for unaligned messages and receives aggregate delivery reports.

- **Type**: `TXT`
- **Host**: `_dmarc.prepsphere.io`
- **TTL**: `3600`
- **Value**:
  ```text
  v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc-reports@prepsphere.io; ruf=mailto:dmarc-forensics@prepsphere.io; fo=1;
  ```

---

## 2. SMTP & Transactional Provider Settings

### Supabase Auth Custom SMTP Configuration
In the Supabase Management Console under **Project Settings > Authentication > SMTP**:
- **Sender Email**: `auth@mail.prepsphere.io`
- **Sender Name**: `PrepSphere Security`
- **Host**: `smtp.resend.com` (or `smtp.mailgun.org` / `email-smtp.us-east-1.amazonaws.com`)
- **Port**: `587` (TLS encryption enabled)
- **Username**: `resend` (or IAM SMTP User)
- **Password / Key**: `{{env.SMTP_SECRET_API_KEY}}`

---

## 3. Email Templates

### 3.1 Email Verification (Confirm Signup)

#### HTML Template
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your PrepSphere Account</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0b0d13; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e4e7ec; }
    .container { max-width: 560px; margin: 40px auto; background-color: #121620; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.08); overflow: hidden; }
    .header { padding: 32px 40px 20px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.06); }
    .logo { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff; text-decoration: none; }
    .logo-accent { color: #6366f1; }
    .content { padding: 36px 40px; }
    .h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 16px; line-height: 1.3; }
    .p { font-size: 14px; line-height: 1.6; color: #98a2b3; margin: 0 0 24px; }
    .btn-container { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35); }
    .subtext { font-size: 12px; color: #667085; line-height: 1.5; margin-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 20px; }
    .footer { padding: 24px 40px; text-align: center; font-size: 11px; color: #475467; background-color: #0d1017; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="logo">Prep<span class="logo-accent">Sphere</span></span>
    </div>
    <div class="content">
      <h1 class="h1">Confirm your email address</h1>
      <p class="p">Welcome to PrepSphere. To complete your candidate registration and begin practicing realistic voice mock interviews, please verify your email address below.</p>
      <div class="btn-container">
        <a href="{{ .ConfirmationURL }}" class="btn">Verify Candidate Email</a>
      </div>
      <p class="subtext">This verification link will expire in 24 hours. If you did not sign up for a PrepSphere account, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      &copy; 2026 PrepSphere Technologies Inc. All rights reserved.<br>
      Privacy Policy &bull; Terms of Service &bull; Candidate Security
    </div>
  </div>
</body>
</html>
```

#### Plain-Text Alternate
```text
Confirm your PrepSphere candidate account:

Welcome to PrepSphere. To complete your candidate registration and begin practicing realistic voice mock interviews, please verify your email address by visiting the link below:

{{ .ConfirmationURL }}

This link will expire in 24 hours. If you did not create a PrepSphere account, no action is needed.

--
PrepSphere Technologies Inc.
Candidate Security Team
```

---

### 3.2 Passwordless Magic Link (PKCE OTP)

#### HTML Template
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your PrepSphere Sign-In Link</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0b0d13; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e4e7ec; }
    .container { max-width: 560px; margin: 40px auto; background-color: #121620; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.08); overflow: hidden; }
    .header { padding: 32px 40px 20px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.06); }
    .logo { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff; text-decoration: none; }
    .logo-accent { color: #6366f1; }
    .content { padding: 36px 40px; }
    .h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 16px; line-height: 1.3; }
    .p { font-size: 14px; line-height: 1.6; color: #98a2b3; margin: 0 0 24px; }
    .btn-container { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px; }
    .subtext { font-size: 12px; color: #667085; line-height: 1.5; margin-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 20px; }
    .footer { padding: 24px 40px; text-align: center; font-size: 11px; color: #475467; background-color: #0d1017; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="logo">Prep<span class="logo-accent">Sphere</span></span>
    </div>
    <div class="content">
      <h1 class="h1">Sign in with Magic Link</h1>
      <p class="p">Click the button below to securely authenticate your candidate session. No password required.</p>
      <div class="btn-container">
        <a href="{{ .ConfirmationURL }}" class="btn">Sign In to PrepSphere</a>
      </div>
      <p class="subtext">This single-use link is protected with PKCE code exchange and expires in 15 minutes. For your security, never forward this email.</p>
    </div>
    <div class="footer">
      &copy; 2026 PrepSphere Technologies Inc. All rights reserved.
    </div>
  </div>
</body>
</html>
```

#### Plain-Text Alternate
```text
Sign in to PrepSphere:

Click or copy the link below to securely authenticate without a password:

{{ .ConfirmationURL }}

This single-use link is protected with PKCE and will expire in 15 minutes. Never share this email.

--
PrepSphere Technologies Inc.
```

---

### 3.3 Password Reset (Recovery)

#### HTML Template
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your PrepSphere Password</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0b0d13; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e4e7ec; }
    .container { max-width: 560px; margin: 40px auto; background-color: #121620; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.08); overflow: hidden; }
    .header { padding: 32px 40px 20px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.06); }
    .logo { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff; text-decoration: none; }
    .logo-accent { color: #6366f1; }
    .content { padding: 36px 40px; }
    .h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 16px; line-height: 1.3; }
    .p { font-size: 14px; line-height: 1.6; color: #98a2b3; margin: 0 0 24px; }
    .btn-container { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px; }
    .subtext { font-size: 12px; color: #667085; line-height: 1.5; margin-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 20px; }
    .footer { padding: 24px 40px; text-align: center; font-size: 11px; color: #475467; background-color: #0d1017; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="logo">Prep<span class="logo-accent">Sphere</span></span>
    </div>
    <div class="content">
      <h1 class="h1">Reset your password</h1>
      <p class="p">We received a request to reset the password for your PrepSphere account. Click the button below to choose a new password.</p>
      <div class="btn-container">
        <a href="{{ .ConfirmationURL }}" class="btn">Set New Password</a>
      </div>
      <p class="subtext">This password reset link expires in 60 minutes. If you did not request a password reset, you can disregard this email—your account remains safe and no changes were made.</p>
    </div>
    <div class="footer">
      &copy; 2026 PrepSphere Technologies Inc. All rights reserved.
    </div>
  </div>
</body>
</html>
```

#### Plain-Text Alternate
```text
Reset your PrepSphere password:

We received a request to reset your password. Use the link below to choose a new, secure password (minimum 10 characters):

{{ .ConfirmationURL }}

This link will expire in 60 minutes. If you did not make this request, your account is safe and you can ignore this message.

--
PrepSphere Technologies Inc.
```
