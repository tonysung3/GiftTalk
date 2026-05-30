# Contributing to GiftTalk Backend

We welcome contributions! Please follow these guidelines:

## Getting Started

1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Install dependencies: `npm install`.
4. Create a `.env` file from `.env.example`.

## Coding Standards

- Use clean, readable code.
- Follow existing patterns for controllers, routes, and middlewares.
- Keep logic in controllers and data access in models (schema).
- Use `better-sqlite3` for database operations.

## Pull Request Process

1. Ensure all tests pass: `npm test`.
2. Update the README or documentation if you added new features or changed existing ones.
3. Submit a PR with a clear description of your changes.

## Testing

New features should include corresponding tests in the `tests/` directory. We use Jest and Supertest.

## Commit Messages

Use descriptive commit messages, preferably following [Conventional Commits](https://www.conventionalcommits.org/).

Example:
- `feat: add read receipts for messages`
- `fix: correct balance calculation in gifts controller`
- `docs: update deployment instructions`
