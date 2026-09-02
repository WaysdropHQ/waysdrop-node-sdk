import type { PkcePair } from "./types.js";
import { randomBytes, createHash } from "node:crypto";

export function generateCodeVerifier(length = 64): string {
    const bytes = randomBytes(length);
    return bytes
        .toString("base64url")
        .replace(/[^a-zA-Z0-9\-._~]/g, "")
        .slice(0, length);
}

export function generateCodeChallenge(
    codeVerifier: string,
    method: "S256" | "plain" = "S256",
): string {
    if (method === "plain") return codeVerifier;
    return createHash("sha256").update(codeVerifier).digest("base64url");
}

export function generatePkcePair(): PkcePair {
    const codeVerifier = generateCodeVerifier();
    return {
        codeVerifier,
        codeChallenge: generateCodeChallenge(codeVerifier, "S256"),
        codeChallengeMethod: "S256",
    };
}
