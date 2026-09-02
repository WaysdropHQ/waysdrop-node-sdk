export type OAuthScope = "openid" | "profile" | "email" | "store" | "courier";

export type OAuthClientType = "CONFIDENTIAL" | "PUBLIC";

export type DiscoveryDocument = {
    issuer: string;
    authorization_endpoint: string;
    token_endpoint: string;
    userinfo_endpoint: string;
    revocation_endpoint: string;
    response_types_supported: string[];
    grant_types_supported: string[];
    subject_types_supported: string[];
    id_token_signing_alg_values_supported?: string[];
    token_endpoint_auth_methods_supported: string[];
    code_challenge_methods_supported: ("S256" | "plain")[];
    scopes_supported: OAuthScope[];
};

export type TokenResponse = {
    access_token: string;
    token_type: "Bearer";
    expires_in: number;
    refresh_token: string;
    scope: string;
};

export type RevokeResponse = {
    revoked: true;
};

export type ProfileSummary = {
    id: string;
    name?: string | null;
    tag?: string | null;
    description?: string | null;
    profile_photo?: string | null;
};

export type UserInfo = {
    sub: string;
    email?: string | null;
    email_verified?: boolean;
    name?: string | null;
    picture?: string | null;
    phone?: string | null;
    phone_verified?: boolean;
    personal_profile?: ProfileSummary | null;
    store_profiles?: ProfileSummary[];
    courier_profiles?: ProfileSummary[];
};

export type PkcePair = {
    codeVerifier: string;
    codeChallenge: string;
    codeChallengeMethod: "S256";
};

export type OAuthClientOptions = {
    clientId: string;
    clientSecret?: string;
    redirectUri: string;
    issuer?: string;
    fetch?: typeof fetch;
    timeout?: number;
};

export type BuildAuthorizeUrlParams = {
    scope?: string | OAuthScope[];
    state?: string;
    pkce?: PkcePair;
};

export type ExchangeCodeParams = {
    code: string;
    codeVerifier?: string;
};

export type OAuthErrorBody = {
    error?: string;
    error_description?: string;
    statusCode?: number;
    message?: string | Record<string, unknown>;
};
