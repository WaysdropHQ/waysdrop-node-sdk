export type WaysdropErrorBody = {
    statusCode: number;
    message: string | Record<string, unknown>;
    path?: string;
    details?: Record<string, unknown>;
    quota?: Record<string, unknown>;
};

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

export function inferBaseUrl(apiKey: string): string {
    if (apiKey.startsWith("wsp_staging_")) {
        return "https://staging-api.waysdrop.com";
    }
    if (apiKey.startsWith("wsp_live_")) {
        return "https://api.waysdrop.com";
    }
    return "https://staging-api.waysdrop.com";
}

export function validateApiKey(apiKey: string): void {
    if (!/^wsp_(live|staging)_[a-f0-9]{64}$/.test(apiKey)) {
        throw new Error(
            "Invalid API key format. Expected wsp_live_… or wsp_staging_… with 64 hex chars.",
        );
    }
}
