import { WaysdropClient } from "@waysdrop/sdk";

const apiKey = process.env.WAYSDROP_API_KEY;
if (!apiKey) {
    throw new Error("Set WAYSDROP_API_KEY");
}

const client = new WaysdropClient({
    apiKey,
    displayCurrency: "NGN",
});

const [account, fleetTypes] = await Promise.all([
    client.getAccount(),
    client.listFleetTypes(),
]);

console.log({ account, fleetTypes });
