# WDP-Web

A Turborepo and pnpm-powered monorepo configured for a Next.js App Router microfrontend architecture.

---

## Architecture Overview

This monorepo manages multiple microfrontends orchestrated through Turborepo:

### Applications (`apps/`)

- **`web`** (`apps/web`): Main shell/host application.
- **`dashboard`** (`apps/dashboard`): Dashboard microfrontend, routed at `/dashboard/*`.
- **`admin`** (`apps/admin`): Administration portal microfrontend, routed at `/admin/*`.

### Shared Packages (`packages/`)

- **`@repo/ui`**: Shared React components consumed across applications.
- **`@repo/typescript-config`**: Shared TypeScript configuration (`base.json`, `nextjs.json`, `react-library.json`).
- **`@repo/eslint-config`**: Shared ESLint configurations.

---

## Prerequisites

- **Node.js**: `>= 18`
- **pnpm**: `^10.0.0` (ensure pnpm is installed: `corepack enable` or `npm install -g pnpm`)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/WDP-FA26/WDP-Web.git
cd WDP-Web
```

### 2. Install dependencies

> **Note**: This project strictly uses `pnpm`. Do not use `npm` or `yarn`.

```bash
pnpm install
```

### 3. Start development server

Start all microfrontends concurrently:

```bash
pnpm dev
```

### 4. Access the applications

Once running, interact with the unified microfrontend gateway at:

| Application               | Routed URL                                                         | Direct Local Port |
| :------------------------ | :----------------------------------------------------------------- | :---------------- |
| **Microfrontend Gateway** | [http://localhost:3024](http://localhost:3024)                     | —                 |
| **Web Shell**             | [http://localhost:3024/](http://localhost:3024/)                   | `3000`            |
| **Dashboard**             | [http://localhost:3024/dashboard](http://localhost:3024/dashboard) | `3001`            |
| **Admin**                 | [http://localhost:3024/admin](http://localhost:3024/admin)         | `3002`            |

> Routing is configured via `apps/web/microfrontends.json`. Ports are assigned dynamically by Turborepo via `turbo get-mfe-port`.

---

## Available Scripts

Run commands from the repository root:

- **`pnpm dev`**: Start all apps in development mode with Turborepo microfrontend proxying.
- **`pnpm build`**: Build all apps and packages for production.
- **`pnpm lint`**: Run ESLint across all packages.
- **`pnpm check-types`**: Run TypeScript type-checking (`tsc --noEmit`) across all packages.
- **`pnpm format`**: Format code and markdown files with Prettier.

### Running a single package

Use Turborepo filters to run commands for a specific app:

```bash
# Develop only a single app
pnpm turbo dev --filter=web
pnpm turbo dev --filter=dashboard
pnpm turbo dev --filter=admin

# Build a single app
pnpm turbo build --filter=web
pnpm turbo build --filter=dashboard
pnpm turbo build --filter=admin
```

---

## Git Hooks

This repository uses [Husky](https://typicode.github.io/husky/) to ensure code quality:

- **`pre-commit`**: Automatically runs `pnpm lint` and `pnpm check-types` before every commit.
