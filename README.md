# @waysdrop/sdk

Official Waysdrop Partner API SDK for Node.js (TypeScript).

## Install

```bash
npm install @waysdrop/sdk
```

## Quickstart

```typescript
import { WaysdropClient } from "@waysdrop/sdk";

const client = new WaysdropClient({
    apiKey: process.env.WAYSDROP_API_KEY!,
    displayCurrency: "NGN",
});

const account = await client.getAccount();
const pricing = await client.getPricing({
    origin: { address: "Ikeja, Lagos" },
    destination: { address: "Lekki, Lagos" },
    packagesId: ["your-package-uuid"],
    courierSelection: "ANYONE",
});
```

## Webhooks

Verify against **raw body bytes** — never re-serialize JSON.

```typescript
import { verifySignature, parseWebhook } from "@waysdrop/sdk/webhooks";

app.post(
    "/webhooks/waysdrop",
    express.raw({ type: "application/json" }),
    (req, res) => {
        const sig = req.header("x-waysdrop-signature");
        if (!verifySignature(req.body, sig, process.env.WAYSDROP_API_KEY!)) {
            return res.status(401).send("Invalid signature");
        }
        const { event, data } = parseWebhook(req.body);
        // handle event
        res.status(200).json({ received: true });
    },
);
```

## Environment

| Key prefix     | Default base URL                   |
| -------------- | ---------------------------------- |
| `wsp_staging_` | `https://staging-api.waysdrop.com` |
| `wsp_live_`    | `https://api.waysdrop.com`         |

## License

MIT
