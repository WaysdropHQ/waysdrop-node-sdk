import type { BuildAuthorizeUrlParams, OAuthScope } from "./types.js";

const DEFAULT_SCOPES: OAuthScope[] = ["openid", "profile", "email"];

function normalizeScope(scope?: string | OAuthScope[]): string {
    if (!scope) return DEFAULT_SCOPES.join(" ");
    if (Array.isArray(scope)) return scope.join(" ");
    return scope.trim();
}

export function buildAuthorizeUrl(
    authorizationEndpoint: string,
    clientId: string,
    redirectUri: string,
    params: BuildAuthorizeUrlParams = {},
): string {
    const url = new URL(authorizationEndpoint);
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", normalizeScope(params.scope));

    if (params.state) url.searchParams.set("state", params.state);
    if (params.pkce) {
        url.searchParams.set("code_challenge", params.pkce.codeChallenge);
        url.searchParams.set(
            "code_challenge_method",
            params.pkce.codeChallengeMethod,
        );
    }

    return url.toString();
}
