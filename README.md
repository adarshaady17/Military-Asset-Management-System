# Military Asset Management System

MAMS is split into `Frontend` (React, Vite, Tailwind CSS) and `Backend` (Express, PostgreSQL). PostgreSQL is the system of record. Its foreign keys connect bases, users, equipment and transactions; check constraints protect quantities and transfer endpoints; each inventory transaction and audit record is written within a SQL transaction.

## Run locally

1. Start the local database from the project root: `docker compose up -d postgres`.
2. Copy `Backend/.env.example` to `Backend/.env`. Set a long random `JWT_SECRET` and the initial `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.
3. In `Backend`, run `npm install`, `npm run db:setup`, and `npm run seed:admin`.
4. Start the API from `Backend` with `npm run dev`.
5. In `Frontend`, run `npm install` and `npm run dev`.

## ADMIN EMAIL=adarsh@unit.mil
## ADMIN PASSWORD=Adarsh@12

For a hosted PostgreSQL database, set `DATABASE_URL` to its connection string and `PG_SSL=true` when TLS is required. The demo seed creates the three sample bases and equipment records that populate the selectors. Existing MongoDB records are not copied automatically; seed the SQL database or migrate any records you need before switching users over.

## Modules

- Secure login, administrator-managed user accounts, and role-based navigation
- Dashboard balances and movement reporting
- Purchases, transfers, assignments, expenditures, and audit history
- PostgreSQL schema with relational integrity constraints and audited transactions
