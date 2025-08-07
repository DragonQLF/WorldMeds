# Security Setup Guide

## Environment Variables

This project uses environment variables to store sensitive configuration data. **Never commit real environment variables to version control.**

### Backend Environment Variables

1. Copy the example file:
   ```bash
   cp backend/env.example backend/.env
   ```

2. Update `backend/.env` with your actual values:
   ```env
   # Google OAuth2 Configuration
   GOOGLE_CLIENT_ID=your_actual_google_client_id
   
   # JWT Configuration
   JWT_SECRET=your_strong_jwt_secret_key
   
   # Database Configuration
   DB_HOST=localhost
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=your_db_name
   
   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_email_password
   
   # Frontend URL
   FRONTEND_URL=http://localhost:8080
   
   # Node Environment
   NODE_ENV=development
   ```

### Frontend Environment Variables

1. Copy the example file:
   ```bash
   cp frontend/env.example frontend/.env
   ```

2. Update `frontend/.env` with your actual values:
   ```env
   # API Configuration
   VITE_API_URL=http://localhost:3001/api
   
   # Google OAuth2 Configuration (if needed)
   VITE_GOOGLE_CLIENT_ID=your_actual_google_client_id
   
   # Environment
   VITE_NODE_ENV=development
   ```

## Security Best Practices

### 1. Environment Variables
- ✅ Use `.env` files for local development
- ✅ Add `.env` to `.gitignore`
- ✅ Use environment variables in production
- ❌ Never commit real secrets to version control
- ❌ Never hardcode secrets in source code

### 2. Google OAuth2 Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs
6. Copy the Client ID to your `.env` file

### 3. JWT Secret
- Use a strong, random string for JWT_SECRET
- At least 32 characters recommended
- You can generate one using:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

### 4. Database Security
- Use strong passwords for database users
- Limit database user permissions
- Use SSL connections in production
- Regularly update database credentials

### 5. Email Configuration
- Use app-specific passwords for Gmail
- Enable 2-factor authentication on email accounts
- Consider using dedicated email services for production

## Production Deployment

### Environment Variables in Production
- Use your hosting platform's environment variable system
- Never commit production secrets to version control
- Use different secrets for each environment (dev, staging, prod)

### Security Headers
- Enable HTTPS in production
- Set appropriate security headers
- Use CORS properly
- Implement rate limiting

## Monitoring and Maintenance

### Regular Security Checks
- Run security audits: `npm audit`
- Update dependencies regularly
- Monitor for security vulnerabilities
- Review access logs

### Incident Response
- Rotate secrets immediately if compromised
- Monitor for unusual activity
- Have a plan for security incidents
- Keep backups of critical data

## Common Security Issues to Avoid

1. **Exposed API Keys**: Never commit API keys to version control
2. **Weak Passwords**: Use strong, unique passwords
3. **Missing HTTPS**: Always use HTTPS in production
4. **Insecure Dependencies**: Keep dependencies updated
5. **Hardcoded Secrets**: Use environment variables instead

## Getting Help

If you encounter security issues:
1. Check this guide first
2. Review the error messages carefully
3. Ensure all environment variables are set correctly
4. Check that `.env` files are in `.gitignore`
5. Verify your Google OAuth2 configuration
