# Indigram backend monorepo

Modular TypeScript API with npm workspaces, Express, Prisma ORM, and PostgreSQL. The first domain is authentication.

## Requirements
- Node.js 22+
- npm 10+
- Docker / Docker Compose (or a local PostgreSQL instance)

## Quick start
```bash
cp .env.example .env
# Generate a real secret and set ACCESS_TOKEN_SECRET in .env:
# openssl rand -base64 48
docker compose up -d postgres
npm install
npm run db:generate
npm run db:migrate
npm run dev
```
The API listens on `http://localhost:4000`; health check: `GET /health`, API base: `/api/v1`.

## Workspace layout
- `apps/api`: HTTP server, auth routes/controllers/services, middleware.
- `packages/database`: Prisma schema, generated client wrapper, migrations/seed.
- Root: npm workspaces, shared TypeScript config, Docker Compose.

## Auth endpoints
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/logout-all` (authenticated)
- `GET /api/v1/auth/me` (authenticated)
- `PATCH /api/v1/auth/me` (authenticated)
- `POST /api/v1/auth/verify-email`
- `POST /api/v1/auth/resend-verification`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/change-password` (authenticated)
- `GET /api/v1/auth/sessions` (authenticated)
- `DELETE /api/v1/auth/sessions/:sessionId` (authenticated)
- `GET /api/v1/auth/availability/username?username=...`

## Security notes
- Access tokens are short-lived JWTs. Refresh tokens are random opaque values stored only as SHA-256 hashes in the database and rotated on refresh.
- Passwords are hashed with bcrypt.
- Email verification and password reset tokens are random, single-use, expiring tokens stored as hashes. In development, tokens are logged to the server console so the flow can be tested; replace this with a real email provider before deployment.
- Refresh tokens are sent in JSON in this starter to keep the API testable. For browser deployments, prefer an `HttpOnly`, `Secure`, `SameSite` cookie and CSRF protections where appropriate; never store long-lived refresh tokens in localStorage.
- Set a unique, long `ACCESS_TOKEN_SECRET`; do not use the example value in production. Add production rate limiting, monitoring, email delivery, account lockout policy, and security review before launch.
- CORS is restricted to `WEB_ORIGIN`. Configure it for your deployed frontend.
- Generic responses are used for password reset and email resend to reduce account enumeration.
- This is a starter, not a security audit. Review all policies and deployment configuration before production use.

## Prisma
Schema is in `packages/database/prisma/schema.prisma`. Migrations are created by `npm run db:migrate` in development. For production, use `npm run db:deploy`.
