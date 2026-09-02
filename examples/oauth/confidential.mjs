import { OAuthClient, generatePkcePair } from "@waysdrop/sdk/oauth";

const client = new OAuthClient({
    clientId: process.env.WAYSDROP_OAUTH_CLIENT_ID,
    clientSecret: process.env.WAYSDROP_OAUTH_CLIENT_SECRET,
    redirectUri: "https://example.com/oauth/callback",
});

const pkce = generatePkcePair();
const authorizeUrl = client.buildAuthorizeUrl({
    scope: "openid profile email",
    state: "csrf-token",
    pkce,
});

console.log("Redirect user to:", authorizeUrl);

// After callback ?code=...&state=...
async function handleCallback(code) {
    const tokens = await client.exchangeCode({
        code,
        codeVerifier: pkce.codeVerifier,
    });
    const user = await client.getUserInfo(tokens.access_token);
    console.log(user.sub, user.email);
}
