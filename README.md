# GiftTalk Backend

This is the central API and WebSocket service for GiftTalk. It handles authentication, real-time messaging, gift catalog management, and payment processing.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Real-time Events (WebSockets)](#real-time-events-websockets)
- [Testing](#testing)
- [Deployment](#deployment)
- [License](#license)

## Features
- **User System**: JWT authentication, profile management, and user search.
- **Messaging**: Real-time 1-on-1 and Group chats with typing indicators and read receipts.
- **Gifting**: Integrated catalog with coin-based transactions.
- **Payments**: PayPal integration for purchasing virtual coin packs.
- **Admin**: Gift catalog management endpoints.

## Tech Stack
- **Node.js** & **Express**
- **SQLite** (via `better-sqlite3`)
- **Socket.io** (WebSockets)
- **Bcrypt** & **JWT** (Security)
- **Swagger/OpenAPI** (Documentation)
- **Jest** & **Supertest** (Testing)

## Getting Started

### Installation
```bash
npm install
```

### Database Setup
To initialize the database and seed it with demo users (Alice, Bob, Charlie) and a sample gift catalog:
```bash
npm run seed-demo
```

### Running the App
- **Development**: `npm run dev`
- **Production**: `npm start`

The server listens on `http://localhost:3000`.

## Environment Variables

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | Server port | `3000` |
| `JWT_SECRET` | Secret for token signing | Required |
| `PAYPAL_CLIENT_ID` | PayPal Sandbox Client ID | Required |
| `PAYPAL_CLIENT_SECRET` | PayPal Sandbox Secret | Required |
| `DB_PATH` | Path to SQLite file | `./data/gifttalk.db` |
| `CORS_ORIGIN` | Allowed origins | `*` |

## API Documentation
Once the server is running, you can access the interactive API documentation at:
[http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## Real-time Events (WebSockets)
The backend uses Socket.io. Clients should connect and emit `authenticate` with their JWT.
- **Incoming**: `send_message`, `typing`, `mark_read`.
- **Outgoing**: `new_message`, `user_typing`, `messages_read`, `conversation_added`.

## Testing
Run the automated test suite:
```bash
npm test
```

## Deployment

### Docker
```bash
docker build -t gifttalk-backend .
docker run -p 3000:3000 gifttalk-backend
```

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
