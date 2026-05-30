# Deployment Guide

The GiftTalk backend can be deployed to any Node.js environment.

## Environment Variables

Ensure the following variables are set in your production environment:

| Variable | Description | Required |
| --- | --- | --- |
| `NODE_ENV` | Environment (set to `production`) | Yes |
| `PORT` | Port to run the server on | No (default: 3000) |
| `JWT_SECRET` | Long, random string for JWT security | Yes |
| `PAYPAL_CLIENT_ID` | PayPal API Client ID | Yes |
| `PAYPAL_CLIENT_SECRET` | PayPal API Client Secret | Yes |
| `DB_PATH` | Path to persistent SQLite DB file | No |
| `CORS_ORIGIN` | Allowed origin (e.g., `https://gifttalk.com`) | Yes |

## Deployment Options

### Docker (Recommended)

1. Build the image:
   ```bash
   docker build -t gifttalk-backend .
   ```

2. Run the container:
   ```bash
   docker run -d -p 3000:3000 \
     -e JWT_SECRET=your_secret \
     -e PAYPAL_CLIENT_ID=your_paypal_id \
     -e PAYPAL_CLIENT_SECRET=your_paypal_secret \
     -v $(pwd)/data:/app/data \
     gifttalk-backend
   ```

### Manual Deployment (Ubuntu/Linux)

1. Install Node.js and npm.
2. Clone and install dependencies: `npm install --production`.
3. Set environment variables.
4. Use a process manager like **PM2** to keep the app running:
   ```bash
   npm install -g pm2
   pm2 start src/index.js --name gifttalk-backend
   ```

## Database Migration

The application automatically initializes the database schema on startup. For the first-time setup, you may want to run:
```bash
npm run seed-demo
```
*Note: Do not run seed-demo on an existing production database unless you want to reset it.*

## Health Checks

Monitor the service status at `/health`. It returns JSON indicating the status of the server and database connection.
