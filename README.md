# @waysdrop/sdk

Official Waysdrop **Partner API** SDK for Node.js and TypeScript.

Covers all 18 `/api/*` endpoints, typed responses, and outbound webhook verification. OAuth (Sign in with Waysdrop) ships as a **separate import** — see [OAuth (v1.1)](#oauth-v11) below.

## Install

```bash
npm install @waysdrop/sdk
```

Requires **Node.js 18+** (uses native `fetch`).

## Authentication

Every request sends your API key in the `api-key` header. Keys look like `wsp_live_<64 hex>` or `wsp_staging_<64 hex>` and are created in the [API dashboard](https://api-dashboard.waysdrop.com).

| Key prefix     | Default base URL                   |
| -------------- | ---------------------------------- |
| `wsp_staging_` | `https://staging-api.waysdrop.com` |
| `wsp_live_`    | `https://api.waysdrop.com`         |

## Client

```typescript
import { WaysdropClient } from "@waysdrop/sdk";

const client = new WaysdropClient({
    apiKey: process.env.WAYSDROP_API_KEY!,
    displayCurrency: "NGN", // optional default for pricing / wallet / deliveries
    correlationId: "req-123", // optional X-Correlation-Id header
    baseUrl: "https://staging-api.waysdrop.com", // optional override
    timeout: 30_000, // ms, default 30s
});
```

Successful API responses are unwrapped from `{ success, data }` automatically. Errors throw `WaysdropError` with `statusCode`, `message`, `details`, and `quota`.

---

## API reference

### Account

| SDK method     | HTTP               | Returns          |
| -------------- | ------------------ | ---------------- |
| `getAccount()` | `GET /api/account` | `AccountSummary` |

```typescript
const account = await client.getAccount();
// { userId, countryCode, displayCurrency, merchantWalletCurrencyCode, storeProfile }
```

---

### Locations

| SDK method               | HTTP                 | Parameters          | Returns             |
| ------------------------ | -------------------- | ------------------- | ------------------- |
| `listCountries(params?)` | `GET /api/countries` | `search?`, `limit?` | `CountryLocation[]` |
| `listStates(params?)`    | `GET /api/states`    | `search?`, `limit?` | `StateLocation[]`   |
| `listCities(params?)`    | `GET /api/cities`    | `search?`, `limit?` | `CityLocation[]`    |

```typescript
const countries = await client.listCountries({ search: "nigeria", limit: 10 });
const states = await client.listStates({ search: "lagos" });
const cities = await client.listCities({ search: "ikeja", limit: 20 });
```

---

### Routing & pricing

| SDK method                    | HTTP                   | Returns             |
| ----------------------------- | ---------------------- | ------------------- |
| `getRoute(body)`              | `POST /api/route`      | `RouteDataResponse` |
| `listFleetTypes()`            | `GET /api/fleet-types` | `FleetType[]`       |
| `getPricing(body, currency?)` | `POST /api/pricing`    | `PricingResponse`   |

```typescript
const route = await client.getRoute({
    origin: { address: "Ikeja, Lagos" },
    destination: { address: "Lekki, Lagos" },
});

const fleets = await client.listFleetTypes();

const pricing = await client.getPricing(
    {
        origin: { address: "Ikeja, Lagos" },
        destination: { address: "Lekki, Lagos" },
        packagesId: ["package-uuid"],
        courierSelection: "ANYONE",
        urgencyType: "STANDARD",
    },
    "NGN",
);
// pricing.costs.totalDisplay, pricing.distance, pricing.deliveryFee, …
```

---

### Packages

| SDK method                               | HTTP                      | Returns             |
| ---------------------------------------- | ------------------------- | ------------------- |
| `createOrUpdatePackage(body, currency?)` | `POST /api/package`       | `DeliveryPackage`   |
| `deletePackage(packageId)`               | `DELETE /api/package/:id` | `void`              |
| `listPackages(currency?)`                | `GET /api/packages`       | `DeliveryPackage[]` |

```typescript
const pkg = await client.createOrUpdatePackage(
    {
        name: "Documents",
        quantity: 1,
        weight: 1.5,
        value: 5000,
        size: "SMALL",
    },
    "NGN",
);

await client.deletePackage(pkg.id);

const packages = await client.listPackages("NGN");
```

---

### Deliveries

| SDK method                               | HTTP                           | Returns                  |
| ---------------------------------------- | ------------------------------ | ------------------------ |
| `createDeliveryRequest(body, currency?)` | `POST /api/request`            | `CreateDeliveryResponse` |
| `cancelDeliveryRequest(deliveryId)`      | `POST /api/request/:id/cancel` | `CancelDeliveryResponse` |
| `listDeliveries(params?)`                | `GET /api/deliveries`          | `ListDeliveriesResponse` |
| `getDelivery(deliveryId, currency?)`     | `GET /api/deliveries/:id`      | `DeliveryDetail`         |

```typescript
const created = await client.createDeliveryRequest(
    {
        origin: { address: "Ikeja, Lagos" },
        destination: { address: "Lekki, Lagos" },
        packagesId: [pkg.id],
        type: "PICKUP",
        courierSelection: "ANYONE",
        destinationContactName: "Jane Doe",
        destinationContactPhone: "+2348012345678",
        destinationContactEmail: "jane@example.com",
        paymentMethodType: "WALLET",
    },
    "NGN",
);
// created.trackingId via created.delivery, checkout fields if CHECKOUT

const cancelled = await client.cancelDeliveryRequest(created.delivery!.id);

const list = await client.listDeliveries({
    status: "IN_TRANSIT",
    page: 1,
    limit: 20,
});
const detail = await client.getDelivery(list.data[0].id, "NGN");
```

---

### Wallet & payments

| SDK method                               | HTTP                          | Returns                   |
| ---------------------------------------- | ----------------------------- | ------------------------- |
| `getWallet(currency?)`                   | `GET /api/wallet`             | `MerchantWallet`          |
| `createPaymentCheckout(body, currency?)` | `POST /api/payments/checkout` | `PaymentCheckoutResponse` |

```typescript
const wallet = await client.getWallet("NGN");

const checkout = await client.createPaymentCheckout(
    { amount: 10000, email: "customer@example.com" },
    "NGN",
);
// checkout.authorization_url or checkout.checkout_url
```

---

### FX

| SDK method                          | HTTP                     | Returns                   |
| ----------------------------------- | ------------------------ | ------------------------- |
| `getExchangeRate(from, to)`         | `GET /api/exchange-rate` | `ExchangeRateResponse`    |
| `convertCurrency(amount, from, to)` | `GET /api/convert`       | `ConvertCurrencyResponse` |

```typescript
const rate = await client.getExchangeRate("USD", "NGN");
const converted = await client.convertCurrency(100, "USD", "NGN");
```

---

## Webhooks

Import from `@waysdrop/sdk/webhooks` (or the main package). **Always verify the raw request body** — re-serializing JSON breaks HMAC validation.

| Function                                            | Description                                    |
| --------------------------------------------------- | ---------------------------------------------- |
| `verifySignature(rawBody, signatureHeader, apiKey)` | Constant-time HMAC-SHA256 check                |
| `parseWebhook(rawBody)`                             | Parse `{ event, data }` envelope               |
| `parseWebhookEvent(rawBody)`                        | Typed discriminated union (see `WebhookEvent`) |
| `isWebhookEvent(webhook, eventName)`                | Narrow webhook type by event name              |

Signature header: `x-waysdrop-signature` (hex digest of `HMAC-SHA256(rawBody, apiKey)`).

```typescript
import { verifySignature, parseWebhook } from "@waysdrop/sdk/webhooks";
import express from "express";

app.post(
    "/webhooks/waysdrop",
    express.raw({ type: "application/json" }),
    (req, res) => {
        const sig = req.header("x-waysdrop-signature");
        if (!verifySignature(req.body, sig, process.env.WAYSDROP_API_KEY!)) {
            return res.status(401).send("Invalid signature");
        }
        const { event, data } = parseWebhook(req.body);
        switch (event) {
            case "p2p.delivery.created":
            case "delivery.delivered":
            case "payment.received":
                // handle
                break;
        }
        res.status(200).json({ received: true });
    },
);
```

Supported events include `p2p.delivery.created`, `p2p.delivery.cancelled`, `delivery.*` lifecycle events, `payment.received`, and `order.*` — see [Waysdrop webhook docs](https://docs.waysdrop.com/get-started/webhooks).

---

## Error handling

```typescript
import { WaysdropError } from "@waysdrop/sdk";

try {
    await client.getPricing({
        /* … */
    });
} catch (err) {
    if (err instanceof WaysdropError) {
        console.error(err.statusCode, err.message, err.quota);
    }
}
```

---

## Types

All response types are exported from `@waysdrop/sdk`: `AccountSummary`, `PricingResponse`, `DeliveryDetail`, `WebhookEvent`, etc. Request body shapes live in `ApiCreateDeliveryRequest`, `ApiCalculateRouteCost`, and related types.

---

## OAuth (v1.1)

Sign in with Waysdrop — separate from the Partner API client:

```typescript
import { OAuthClient, generatePkcePair } from "@waysdrop/sdk/oauth";

const oauth = new OAuthClient({
    clientId: "wdo_staging_…",
    clientSecret: "wdos_…", // confidential apps only
    redirectUri: "https://example.com/oauth/callback",
});

const pkce = generatePkcePair();
const url = oauth.buildAuthorizeUrl({
    scope: "openid profile email",
    pkce,
    state: "csrf",
});
// Redirect browser → after callback, exchange code:
const tokens = await oauth.exchangeCode({
    code,
    codeVerifier: pkce.codeVerifier,
});
const user = await oauth.getUserInfo(tokens.access_token);
```

See `examples/oauth/` and [OAuth docs](https://docs.waysdrop.com/get-started/oauth).

---

## License

MIT
