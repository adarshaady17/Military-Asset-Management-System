# MAMS Backend

The API uses Express with PostgreSQL through node-postgres (`pg`). PostgreSQL is a relational database suited to this workflow because base, equipment, user, movement, and audit records have explicit foreign-key relationships and integrity constraints. Parameterized SQL protects query inputs; stock-changing operations and their audit entries are committed in one database transaction.

## Local setup

1. Install Docker Desktop, then start PostgreSQL from the project root with `docker compose up -d postgres`.
2. Copy `Backend/.env.example` to `Backend/.env`. Set `JWT_SECRET` to a long random secret and fill in `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`. The local `DATABASE_URL` matches the provided Compose service. For local Supabase connections, copy the PostgreSQL URI from **Connect → Direct Connection string → Session pooler**. For the Vercel backend, use the **Transaction pooler** URI (port `6543`), which is intended for serverless functions. Replace `[YOUR-PASSWORD]` with the database password. Do not use the Supabase project URL (`https://…supabase.co`) or publishable/secret API key as `DATABASE_URL`; those are for Supabase HTTP APIs. The local backend uses encrypted Supabase connections; the Vercel runtime verifies the database certificate and accepts an optional `PG_SSL_CA` PEM if your provider requires a custom root CA. If the database password includes reserved URL characters such as `@`, `#`, `?`, or `/`, percent-encode them in the URI.
3. In `Backend`, run `npm install`, then `npm run db:setup` to create the relational schema and seed Alpha, Bravo, Charlie, and the sample vehicles, weapons, and ammunition used by the Base and Equipment selectors. To create only the tables, use `npm run db:migrate`.
4. Run `npm run seed:admin` to create or reset the initial administrator.
5. Start the API with `npm run dev` (or `npm start`).
6. In `Frontend`, run `npm install` and `npm run dev`.

## Main endpoints

- `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- `GET /api/dashboard`, `GET /api/dashboard/movement`
- `GET/POST /api/{bases,equipment,purchases,transfers,assignments,expenditures}`
- `GET/POST /api/users`, `GET/PATCH/DELETE /api/users/:id`, `PATCH /api/users/:id/status` (ADMIN only)
- `GET /api/audit-logs`

Passwords are bcrypt-hashed and never included in API responses. Base Commander and Logistics Officer accounts require an assigned base. The API scopes reads and writes by authenticated role; deactivated users are rejected on each protected request. Purchases, transfers, assignments, and expenditures are stock-checked and audited.
