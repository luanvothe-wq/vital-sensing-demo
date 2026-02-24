// Cloudflare Worker environment bindings type declarations
// @see https://alchemy.run/concepts/bindings/#type-safe-bindings

export interface CloudflareEnv {
    // D1 Database binding
    DB: D1Database;

    // External Vital API credentials
    API_BASE_URL: string;
    LOGIN_EMAIL: string;
    LOGIN_PASSWORD: string;
    BASIC_AUTH_ID: string;
    BASIC_AUTH_PW: string;
}

declare global {
    type Env = CloudflareEnv;
}

declare module "cloudflare:workers" {
    namespace Cloudflare {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        export interface Env extends CloudflareEnv { }
    }
}
