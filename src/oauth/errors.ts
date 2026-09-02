import type { OAuthErrorBody } from "./types.js";

export class OAuthError extends Error {
    readonly statusCode: number;
    readonly error?: string;
    readonly errorDescription?: string;

    constructor(statusCode: number, body: OAuthErrorBody) {
        const message =
            body.error_description ??
            (typeof body.message === "string" ? body.message : body.error) ??
            "OAuth request failed";
        super(message);
        this.name = "OAuthError";
        this.statusCode = statusCode;
        this.error = body.error;
        this.errorDescription = body.error_description;
    }
}

export function inferOAuthIssuer(clientId: string): string {
    if (clientId.startsWith("wdo_staging_")) {
        return "https://staging-api.waysdrop.com";
    }
    if (clientId.startsWith("wdo_live_")) {
        return "https://api.waysdrop.com";
    }
    return "https://staging-api.waysdrop.com";
}

export function validateClientId(clientId: string): void {
    if (!/^wdo_(live|staging)_[a-f0-9]{32}$/.test(clientId)) {
        throw new Error(
            "Invalid OAuth client ID format. Expected wdo_live_… or wdo_staging_… with 32 hex chars.",
        );
    }
}
