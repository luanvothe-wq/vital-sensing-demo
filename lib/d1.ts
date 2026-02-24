import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Lấy D1 binding từ Cloudflare context.
 * Chỉ dùng được trong server context (Route Handlers).
 */
export function getD1(): D1Database {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { env } = getCloudflareContext() as any;
    const db = env?.DB as D1Database | undefined;
    if (!db) {
        throw new Error("D1 binding 'DB' not configured in Cloudflare Worker");
    }
    return db;
}
