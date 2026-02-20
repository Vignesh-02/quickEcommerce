# Quick Ecommerce Application

A Next.js ecommerce application built with TypeScript, Tailwind CSS, Better Auth, Neon PostgreSQL, Drizzle ORM, and Zustand.

## Tech Stack

-   **Next.js 15** - React framework with App Router
-   **TypeScript** - Type safety
-   **Tailwind CSS** - Styling
-   **Better Auth** - Authentication
-   **Neon PostgreSQL** - Serverless PostgreSQL database
-   **Drizzle ORM** - Type-safe SQL ORM
-   **Zustand** - State management

## Setup

1. **Install dependencies:**

    ```bash
    npm install
    ```

2. **Set up environment variables:**
   Copy `.env.local.example` to `.env.local` and fill in your values:

    ```bash
    cp .env.local.example .env.local
    ```

    You'll need:

    - `DATABASE_URL` - Your Neon PostgreSQL connection string
    - `BETTER_AUTH_SECRET` - A random secret key for Better Auth
    - `BETTER_AUTH_URL` - Your app URL (default: http://localhost:3000)

3. **Generate and run database migrations:**

    ```bash
    npm run db:generate
    npm run db:push
    ```

4. **Seed the database with sample Nike products:**

    ```bash
    npm run db:seed
    ```

5. **Run the development server:**

    ```bash
    npm run dev
    ```

6. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

## Deploy to Vercel

See **[DEPLOY.md](./DEPLOY.md)** for step-by-step deployment. In short: push to GitHub, import the repo in Vercel, add env vars (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`), and deploy. Auth base URL can use Vercel’s URL automatically.

## Frontend testing (E2E)

[Playwright](https://playwright.dev/) is used to test the frontend in a real browser.

1. **Install Playwright browsers** (once):

    ```bash
    npx playwright install chromium
    ```

2. **Run E2E tests** (starts the app automatically):

    ```bash
    npm run test:e2e
    ```

3. **Run tests with UI** (visual trace and debugging):

    ```bash
    npm run test:e2e:ui
    ```

Tests live in `e2e/` and cover: homepage, products listing, product detail, cart, and auth pages.

## Database Commands

-   `npm run db:generate` - Generate migration files
-   `npm run db:push` - Push schema changes to database
-   `npm run db:migrate` - Run migrations
-   `npm run db:seed` - Seed database with sample products

## Project Structure

```
src/
  app/              # Next.js App Router pages
  db/               # Database schema and connection
    schema.ts       # Drizzle schema definitions
    drizzle.ts      # Database connection
    seed.ts         # Database seeding script
  lib/              # Utility libraries
    auth.ts         # Better Auth configuration
  store/            # Zustand stores
    useStore.ts     # Global state management
```
