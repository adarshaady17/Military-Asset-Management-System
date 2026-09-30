# Backend

## Technologies

- Node.js 24
- Express 5
- PostgreSQL 17 with `pg`
- `bcrypt` for password hashing
- JSON Web Tokens for authentication
- `dotenv` for environment configuration

## Setup

1. From the project root, start PostgreSQL:

   ```sh
   docker compose up -d postgres
   ```

2. Create `Backend/.env` with your local settings. For the supplied Compose database:

   ```env
   PORT=5000
   DATABASE_URL=postgresql://mams:mams_dev_password@localhost:5432/mams
   JWT_SECRET=replace-with-a-random-secret-at-least-32-characters
   CLIENT_URL=http://localhost:5173
   JWT_EXPIRES_IN=8h
   ADMIN_NAME="System Admin"
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=replace-with-a-strong-password
   PG_SSL=false
   ```

   For a hosted PostgreSQL database, set `DATABASE_URL` to its PostgreSQL connection string and configure its TLS certificate as required by the provider.

3. Install dependencies and initialize the database:

   ```sh
   cd Backend
   npm install
   npm run db:setup
   npm run seed:admin
   ```

4. Start the API:

   ```sh
   npm run dev
   ```

   The API runs at `http://localhost:5000`. Its health endpoint is `http://localhost:5000/api/health`.
