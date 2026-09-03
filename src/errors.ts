export type WaysdropErrorBody = {
    statusCode: number;
    message: string | Record<string, unknown>;
    path?: string;
    details?: Record<string, unknown>;
    quota?: Record<string, unknown>;
};

export type ApiKeyType = "secret" | "public";

const SECRET_KEY_REGEX = /^wsp_(live|staging)_[a-f0-9]{64}$/;
const PUBLIC_KEY_REGEX = /^wsp_pub_(live|staging)_[a-f0-9]{64}$/;

export class WaysdropError extends Error {
    readonly statusCode: number;
    readonly details?: Record<string, unknown>;
    readonly quota?: Record<string, unknown>;
    readonly path?: string;

    constructor(body: WaysdropErrorBody) {
        const message =
            typeof body.message === "string"
                ? body.message
                : JSON.stringify(body.message);
        super(message);
        this.name = "WaysdropError";
        this.statusCode = body.statusCode;
        this.details = body.details;
        this.quota = body.quota;
        this.path = body.path;
    }
}

export function inferKeyType(apiKey: string): ApiKeyType {
    if (PUBLIC_KEY_REGEX.test(apiKey)) return "public";
    if (SECRET_KEY_REGEX.test(apiKey)) return "secret";
    throw new Error(
        "Invalid API key format. Expected secret (wsp_live_/wsp_staging_) or public (wsp_pub_live_/wsp_pub_staging_) with 64 hex chars.",
    );
}

export function inferBaseUrl(apiKey: string): string {
    if (apiKey.includes("_staging_")) {
        return "https://staging-api.waysdrop.com";
    }
    if (apiKey.includes("_live_")) {
        return "https://api.waysdrop.com";
    }
    return "https://staging-api.waysdrop.com";
}

export function validateApiKey(apiKey: string): void {
    if (!SECRET_KEY_REGEX.test(apiKey) && !PUBLIC_KEY_REGEX.test(apiKey)) {
        throw new Error(
            "Invalid API key format. Expected wsp_live_/wsp_staging_ or wsp_pub_live_/wsp_pub_staging_ with 64 hex chars.",
        );
    }
}
