import type { DiscoveryDocument } from "./types.js";

export async function fetchOpenIdConfiguration(
    issuer: string,
    fetchFn: typeof fetch = fetch,
): Promise<DiscoveryDocument> {
    const base = issuer.replace(/\/$/, "");
    const res = await fetchFn(`${base}/oauth/.well-known/openid-configuration`);
    if (!res.ok) {
        throw new Error(`Discovery failed (${res.status})`);
    }
    return (await res.json()) as DiscoveryDocument;
}
