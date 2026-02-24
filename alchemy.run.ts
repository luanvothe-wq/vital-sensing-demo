import alchemy from "alchemy";
import { D1Database, Nextjs } from "alchemy/cloudflare";
import { config } from "dotenv";

// Load local env vars (for alchemy.env.* / alchemy.secret.env.*)
config({ path: ".env.local" });

// =============================================================================
// INITIALIZE ALCHEMY APP
// =============================================================================
const app = await alchemy("vital-sensing");

// =============================================================================
// DATABASE
// =============================================================================
const db = await D1Database("db", {
    migrationsDir: "./migrations",
});

// =============================================================================
// NEXT.JS APP (Cloudflare Workers via OpenNext)
// =============================================================================
export const website = await Nextjs("web", {
    adopt: true, // adopt existing worker if already deployed

    bindings: {
        // D1 Database
        DB: db,

        // External Vital API — plain string
        API_BASE_URL: alchemy.env.API_BASE_URL!,

        // External Vital API — secrets (encrypted in Alchemy state)
        LOGIN_EMAIL: alchemy.secret.env.LOGIN_EMAIL!,
        LOGIN_PASSWORD: alchemy.secret.env.LOGIN_PASSWORD!,
        // BASIC_AUTH_ID: alchemy.secret.env.BASIC_AUTH_ID!,
        // BASIC_AUTH_PW: alchemy.secret.env.BASIC_AUTH_PW!,
    },
});

// =============================================================================
// DEPLOYMENT SUMMARY
// =============================================================================
console.log("\n✅ Deployment configured");
console.log(`   Website → ${website.url}`);

await app.finalize();
