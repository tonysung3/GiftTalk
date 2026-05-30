# Security Policy

## Checklist
- [x] Parameterized SQL queries
- [x] Bcrypt hashing (cost 12)
- [x] JWT authentication for protected routes
- [x] Input validation with Joi
- [x] Rate limiting (Auth, Payments, Gifts, General)
- [x] Secure Helmet configuration (CSP, HSTS, etc.)
- [x] Production logging (Morgan combined)
- [x] Restricted CORS origins
- [x] SQLite WAL mode enabled
- [x] Global error handling (no stack traces in prod)
- [x] Request body size limits
- [x] No hardcoded secrets

## Database Backups
To perform a manual backup of the database:
```bash
sqlite3 data/gifttalk.db ".backup 'data/gifttalk.db.bak'"
```
In production, a cron job should be scheduled to run this daily.

## Security Audit
Run `npm audit` regularly to check for package vulnerabilities.
Current status: 0 vulnerabilities.
