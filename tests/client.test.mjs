import test from "node:test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { verifySignature, parseWebhook } from "../dist/client.js";
import { WaysdropError, inferBaseUrl, validateApiKey } from "../dist/errors.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, "../../waysdrop-api-spec/fixtures");
const signatureFixture = JSON.parse(
    readFileSync(join(fixturesDir, "signature.json"), "utf8"),
);

test("validates API key format", () => {
    assert.throws(() => validateApiKey("bad-key"), /Invalid API key/);
    assert.doesNotThrow(() => validateApiKey(signatureFixture.apiKey));
});

test("infers base URL from key prefix", () => {
    assert.equal(
        inferBaseUrl(signatureFixture.apiKey),
        "https://staging-api.waysdrop.com",
    );
    assert.equal(
        inferBaseUrl("wsp_live_" + "a".repeat(64)),
        "https://api.waysdrop.com",
    );
});

test("verifies webhook signature", () => {
    assert.equal(
        verifySignature(
            signatureFixture.rawBody,
            signatureFixture.signature,
            signatureFixture.apiKey,
        ),
        true,
    );
    assert.equal(
        verifySignature(
            signatureFixture.rawBody,
            "deadbeef",
            signatureFixture.apiKey,
        ),
        false,
    );
});

test("parses webhook payload", () => {
    const parsed = parseWebhook(signatureFixture.rawBody);
    assert.equal(parsed.event, "p2p.delivery.created");
    assert.equal(parsed.data.trackingId, "P2P-TEST-001");
});

test("WaysdropError includes quota", () => {
    const err = new WaysdropError({
        statusCode: 429,
        message: "API quota exceeded",
        quota: { limit: 1000 },
    });
    assert.equal(err.statusCode, 429);
    assert.deepEqual(err.quota, { limit: 1000 });
});
