import {
    OAuthError,
    OAuthClient,
    generatePkcePair,
    inferOAuthIssuer,
    validateClientId,
    buildAuthorizeUrl,
    generateCodeChallenge,
} from "../dist/oauth.js";
import test from "node:test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(
    readFileSync(join(__dirname, "fixtures", "oauth.json"), "utf8"),
);

test("validates OAuth client ID format", () => {
    assert.throws(() => validateClientId("bad"), /Invalid OAuth client ID/);
    assert.doesNotThrow(() => validateClientId(fixture.clientId));
});

test("infers issuer from client ID prefix", () => {
    assert.equal(
        inferOAuthIssuer(fixture.clientId),
        "https://staging-api.waysdrop.com",
    );
    assert.equal(
        inferOAuthIssuer("wdo_live_" + "a".repeat(32)),
        "https://api.waysdrop.com",
    );
});

test("PKCE S256 matches shared fixture vector", () => {
    assert.equal(
        generateCodeChallenge(fixture.code_verifier, "S256"),
        fixture.code_challenge,
    );
});

test("generatePkcePair produces S256 challenge", () => {
    const pair = generatePkcePair();
    assert.equal(pair.codeChallengeMethod, "S256");
    assert.equal(
        generateCodeChallenge(pair.codeVerifier, "S256"),
        pair.codeChallenge,
    );
});

test("buildAuthorizeUrl includes PKCE and state", () => {
    const pkce = generatePkcePair();
    const url = buildAuthorizeUrl(
        fixture.discovery.authorization_endpoint,
        fixture.clientId,
        fixture.redirectUri,
        { scope: "openid profile", state: "xyz", pkce },
    );
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get("client_id"), fixture.clientId);
    assert.equal(parsed.searchParams.get("response_type"), "code");
    assert.equal(parsed.searchParams.get("state"), "xyz");
    assert.equal(parsed.searchParams.get("code_challenge"), pkce.codeChallenge);
    assert.equal(parsed.searchParams.get("code_challenge_method"), "S256");
});

test("OAuthClient exchanges code and fetches userinfo", async () => {
    const calls = [];
    const fetchFn = async (url, init) => {
        calls.push({ url: String(url), init });
        if (String(url).includes("/oauth/token")) {
            return new Response(JSON.stringify(fixture.tokenResponse), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }
        if (String(url).includes("/oauth/userinfo")) {
            return new Response(JSON.stringify(fixture.userInfo), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }
        if (String(url).includes("/oauth/revoke")) {
            return new Response(JSON.stringify({ revoked: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }
        if (String(url).includes("/.well-known/openid-configuration")) {
            return new Response(JSON.stringify(fixture.discovery), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }
        return new Response("not found", { status: 404 });
    };

    const client = new OAuthClient({
        clientId: fixture.clientId,
        clientSecret: "wdos_secret",
        redirectUri: fixture.redirectUri,
        fetch: fetchFn,
    });

    const discovery = await client.getDiscovery();
    assert.equal(discovery.issuer, fixture.discovery.issuer);

    const tokens = await client.exchangeCode({
        code: "auth_code_123",
        codeVerifier: fixture.code_verifier,
    });
    assert.equal(tokens.access_token, fixture.tokenResponse.access_token);

    const user = await client.getUserInfo(tokens.access_token);
    assert.equal(user.sub, fixture.userInfo.sub);

    await client.revokeToken(tokens.refresh_token);
    assert.equal(
        calls.some((c) => c.url.includes("/oauth/revoke")),
        true,
    );
});

test("OAuthClient maps token errors", async () => {
    const client = new OAuthClient({
        clientId: fixture.clientId,
        redirectUri: fixture.redirectUri,
        fetch: async () =>
            new Response(
                JSON.stringify({
                    error: "invalid_grant",
                    error_description: "Code expired",
                }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                },
            ),
    });

    await assert.rejects(
        () => client.exchangeCode({ code: "bad" }),
        (err) => {
            assert.ok(err instanceof OAuthError);
            assert.equal(err.statusCode, 400);
            assert.equal(err.error, "invalid_grant");
            return true;
        },
    );
});
