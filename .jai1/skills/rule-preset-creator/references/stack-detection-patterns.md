# Stack Detection Patterns

Detailed patterns for detecting tech stacks in codebases.

## Config File Detection

### JavaScript/TypeScript Projects

| File | Framework | Version Detection |
|------|-----------|-------------------|
| `next.config.js/mjs/ts` | Next.js | `package.json` → `next` |
| `nuxt.config.js/ts` | Nuxt | `package.json` → `nuxt` |
| `vite.config.js/ts` | Vite | `package.json` → `vite` |
| `angular.json` | Angular | `package.json` → `@angular/core` |
| `svelte.config.js` | SvelteKit | `package.json` → `@sveltejs/kit` |
| `astro.config.mjs` | Astro | `package.json` → `astro` |
| `remix.config.js` | Remix | `package.json` → `@remix-run/react` |

### PHP Projects

| File | Framework | Version Detection |
|------|-----------|-------------------|
| `artisan` | Laravel | `composer.json` → `laravel/framework` |
| `config/packages/*.yaml` | Symfony | `composer.json` → `symfony/framework-bundle` |
| `wp-config.php` | WordPress | Check `$wp_version` |

### Python Projects

| File | Framework | Version Detection |
|------|-----------|-------------------|
| `manage.py` + `settings.py` | Django | `requirements.txt` → `django` |
| `main.py` + FastAPI import | FastAPI | `pyproject.toml` → `fastapi` |
| `app.py` + Flask import | Flask | `requirements.txt` → `flask` |

### Go Projects

| File | Indicator | Framework |
|------|-----------|-----------|
| `go.mod` + `gin-gonic/gin` | Gin | Check import |
| `go.mod` + `gofiber/fiber` | Fiber | Check import |
| `go.mod` + `labstack/echo` | Echo | Check import |

### Rust Projects

| File | Indicator | Framework |
|------|-----------|-----------|
| `Cargo.toml` + `actix-web` | Actix | Check dependencies |
| `Cargo.toml` + `axum` | Axum | Check dependencies |
| `Cargo.toml` + `rocket` | Rocket | Check dependencies |

---

## Monorepo Detection

### Indicators (any = monorepo)

| File/Pattern | Tool |
|--------------|------|
| `pnpm-workspace.yaml` | pnpm workspaces |
| `turbo.json` | Turborepo |
| `nx.json` | Nx |
| `lerna.json` | Lerna |
| `rush.json` | Rush |
| `package.json` → `workspaces` | npm/yarn workspaces |

### Structure Patterns

```
# Typical monorepo
apps/
  web/          # Frontend app
  api/          # Backend app
packages/
  shared/       # Shared code
  ui/           # Shared UI components
```

---

## UI/CSS Detection

### CSS Frameworks

| Indicator | Framework |
|-----------|-----------|
| `tailwind.config.*` | Tailwind CSS |
| `postcss.config.*` + tailwind | Tailwind CSS |
| `bootstrap` in deps | Bootstrap |
| `@emotion/*` in deps | Emotion |
| `styled-components` in deps | styled-components |

### Component Libraries

| Indicator | Library |
|-----------|---------|
| `components/ui/` + shadcn structure | shadcn/ui |
| `components.json` (shadcn) | shadcn/ui |
| `@radix-ui/*` in deps | Radix UI |
| `@chakra-ui/*` in deps | Chakra UI |
| `@mui/*` in deps | Material UI |
| `antd` in deps | Ant Design |
| `vuetify` in deps | Vuetify |
| `@headlessui/*` in deps | Headless UI |

---

## State Management Detection

| Indicator | Library |
|-----------|---------|
| `zustand` in deps | Zustand |
| `@reduxjs/toolkit` in deps | Redux Toolkit |
| `jotai` in deps | Jotai |
| `recoil` in deps | Recoil |
| `pinia` in deps | Pinia (Vue) |
| `vuex` in deps | Vuex (Vue) |
| `mobx` in deps | MobX |

---

## Database Detection

### ORM/Query Builder

| Indicator | ORM | Database Type |
|-----------|-----|---------------|
| `prisma/schema.prisma` | Prisma | Check datasource |
| `drizzle.config.*` | Drizzle | Check in config |
| `typeorm` in deps | TypeORM | Check ormconfig |
| `knex` in deps | Knex | Check knexfile |
| `eloquent` (Laravel) | Eloquent | Check .env |
| `sqlalchemy` in deps | SQLAlchemy | Check config |
| `django.db` | Django ORM | Check settings |

### Database Indicators in .env

| Pattern | Database |
|---------|----------|
| `DATABASE_URL=postgres` | PostgreSQL |
| `DATABASE_URL=mysql` | MySQL |
| `DB_CONNECTION=pgsql` | PostgreSQL |
| `DB_CONNECTION=mysql` | MySQL |
| `MONGODB_URI` | MongoDB |

---

## Testing Detection

| Indicator | Framework |
|-----------|-----------|
| `jest.config.*` | Jest |
| `vitest.config.*` | Vitest |
| `playwright.config.*` | Playwright |
| `cypress.config.*` | Cypress |
| `phpunit.xml` | PHPUnit |
| `pest.php` | Pest (PHP) |
| `pytest.ini` / `pyproject.toml` [pytest] | Pytest |

---

## Routing Detection

### File-based Routing

| Framework | Router Dir | Pattern |
|-----------|------------|---------|
| Next.js App | `app/` or `src/app/` | `page.tsx`, `route.ts` |
| Next.js Pages | `pages/` or `src/pages/` | `index.tsx`, `[param].tsx` |
| Nuxt | `pages/` | `index.vue`, `[id].vue` |
| SvelteKit | `src/routes/` | `+page.svelte` |
| Astro | `src/pages/` | `*.astro` |

### Config-based Routing

| Framework | Routing Location |
|-----------|-----------------|
| React Router | `router.tsx`, `routes.tsx`, App.tsx |
| Vue Router | `router/index.ts` |
| Angular | `app-routing.module.ts` |
| Laravel | `routes/api.php`, `routes/web.php` |
| Express | `routes/*.ts`, `app.ts` |
| NestJS | `*.controller.ts` |
| FastAPI | `routers/*.py`, `main.py` |

---

## Special Stack Types

### Mobile

| Indicator | Platform |
|-----------|----------|
| `pubspec.yaml` | Flutter |
| `android/` + `ios/` + `app.json` | React Native |
| `capacitor.config.*` | Capacitor |
| `ionic.config.json` | Ionic |

### Desktop

| Indicator | Platform |
|-----------|----------|
| `tauri.conf.json` | Tauri |
| `electron-builder.*` | Electron |
| `electron` in deps | Electron |

### CLI

| Indicator | Type |
|-----------|------|
| `bin/` directory | CLI tool |
| `commander` in deps | Node CLI |
| `yargs` in deps | Node CLI |
| `argparse` in Python deps | Python CLI |
| `cobra` in Go deps | Go CLI |

### Docs

| Indicator | Platform |
|-----------|----------|
| `vitepress` in deps | VitePress |
| `@docusaurus/core` in deps | Docusaurus |
| `mkdocs.yml` | MkDocs |
| `docusaurus.config.js` | Docusaurus |
| `.vitepress/` directory | VitePress |

### Bot

| Indicator | Platform |
|-----------|----------|
| `discord.js` in deps | Discord |
| `@sapphire/framework` in deps | Discord (Sapphire) |
| `telegraf` in deps | Telegram |
| `@slack/bolt` in deps | Slack |
