import type {
    UserInfo,
    TokenResponse,
    DiscoveryDocument,
    OAuthClientOptions,
    ExchangeCodeParams,
    BuildAuthorizeUrlParams,
} from "./types.js";
import { buildAuthorizeUrl } from "./authorize.js";
import { fetchOpenIdConfiguration } from "./discovery.js";
import { OAuthError, inferOAuthIssuer, validateClientId } from "./errors.js";

export class OAuthClient {
    private readonly clientId: string;
    private readonly clientSecret?: string;
    private readonly redirectUri: string;
    private readonly issuer: string;
    private readonly timeout: number;
    private readonly fetchFn: typeof fetch;
    private discoveryCache?: DiscoveryDocument;

    constructor(options: OAuthClientOptions) {
        validateClientId(options.clientId);
        this.clientId = options.clientId;
        this.clientSecret = options.clientSecret;
        this.redirectUri = options.redirectUri;
        this.issuer = (
            options.issuer ?? inferOAuthIssuer(options.clientId)
        ).replace(/\/$/, "");
        this.timeout = options.timeout ?? 30_000;
        this.fetchFn = options.fetch ?? fetch;
    }

    async getDiscovery(): Promise<DiscoveryDocument> {
        if (this.discoveryCache) return this.discoveryCache;
        this.discoveryCache = await fetchOpenIdConfiguration(
            this.issuer,
            this.fetchFn,
        );
        return this.discoveryCache;
    }

    buildAuthorizeUrl(params: BuildAuthorizeUrlParams = {}): string {
        const endpoint = `${this.issuer}/oauth/authorize`;
        return buildAuthorizeUrl(
            endpoint,
            this.clientId,
            this.redirectUri,
            params,
        );
    }

    async exchangeCode(params: ExchangeCodeParams): Promise<TokenResponse> {
        return this.tokenRequest({
            grant_type: "authorization_code",
            code: params.code,
            redirect_uri: this.redirectUri,
            client_id: this.clientId,
            ...(this.clientSecret ? { client_secret: this.clientSecret } : {}),
            ...(params.codeVerifier
                ? { code_verifier: params.codeVerifier }
                : {}),
        });
    }

    async refreshToken(refreshToken: string): Promise<TokenResponse> {
        return this.tokenRequest({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
            client_id: this.clientId,
            ...(this.clientSecret ? { client_secret: this.clientSecret } : {}),
        });
    }

    async revokeToken(token: string): Promise<void> {
        await this.request("POST", "/oauth/revoke", {
            token,
            client_id: this.clientId,
            ...(this.clientSecret ? { client_secret: this.clientSecret } : {}),
        });
    }

    async getUserInfo(accessToken: string): Promise<UserInfo> {
        return this.request<UserInfo>("GET", "/oauth/userinfo", undefined, {
            Authorization: `Bearer ${accessToken}`,
        });
    }

    private async tokenRequest(
        body: Record<string, string>,
    ): Promise<TokenResponse> {
        return this.request<TokenResponse>("POST", "/oauth/token", body);
    }

    private async request<T>(
        method: string,
        path: string,
        body?: Record<string, string>,
        extraHeaders: Record<string, string> = {},
    ): Promise<T> {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeout);

        try {
            const res = await this.fetchFn(`${this.issuer}${path}`, {
                method,
                headers: {
                    Accept: "application/json",
                    ...(body ? { "Content-Type": "application/json" } : {}),
                    ...extraHeaders,
                },
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal,
            });

            const text = await res.text();
            const parsed = text ? JSON.parse(text) : {};

            if (!res.ok) {
                throw new OAuthError(res.status, parsed);
            }

            return parsed as T;
        } finally {
            clearTimeout(timer);
        }
    }
}
