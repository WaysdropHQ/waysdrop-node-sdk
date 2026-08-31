import type {
    DisplayMoney,
    DeliveryStatus,
    WebhookEventName,
} from "./types.js";
import type { DeliveryType, GeoLocation, RouteType } from "./responses.js";

export type DeliveryWebhookBase = {
    deliveryId: string;
    trackingId: string;
    type?: DeliveryType;
    status?: DeliveryStatus | string;
    routeType?: RouteType;
    courierProfileId?: string;
    courierUserId?: string;
    origin?: GeoLocation | Record<string, unknown>;
    destination?: GeoLocation | Record<string, unknown>;
    p2pDeliveryId?: string;
    profileId?: string;
};

export type P2pDeliveryCreatedData = DeliveryWebhookBase & {
    status: string;
    userId?: string;
    totalWeight?: string | number;
    totalValue?: string | number;
    totalValueDisplay?: DisplayMoney;
    costs?: Record<string, unknown>;
    paymentMethodType?: string;
    courierSelection?: string;
    urgencyType?: string;
    createdAt?: string;
};

export type P2pDeliveryCancelledData = DeliveryWebhookBase & {
    status: "CANCELLED";
    canceledAt?: string;
    refundAmount?: string | number;
    refundAmountDisplay?: DisplayMoney;
    refundInputAmount?: string;
    refundCurrencyCode?: string;
    fxRateUsdToLocal?: number;
};

export type DeliveryLifecycleData = DeliveryWebhookBase & {
    proofCode?: string;
    deliveryCode?: string;
    collectedAt?: string;
    inTransitAt?: string;
    deliveredAt?: string;
    updatedAt?: string;
};

export type PaymentReceivedData = {
    amount?: string | number;
    amountDisplay?: DisplayMoney;
    currencyCode?: string;
    merchantReference?: string;
    reference?: string;
    customerEmail?: string;
    receivedAt?: string;
};

export type OrderWebhookData = {
    orderId?: string;
    orderNumber?: string;
    status?: string;
    storeProfileId?: string;
    deliveryId?: string;
    trackingId?: string;
    [key: string]: unknown;
};

export type ErrandDeliveryWebhookData = DeliveryWebhookBase & {
    errandDeliveryId?: string;
    createdAt?: string;
    canceledAt?: string;
};

export type ReassignmentWebhookData = DeliveryWebhookBase & {
    reassignmentId?: string;
    previousCourierProfileId?: string;
    newCourierProfileId?: string;
};

export type WebhookEventMap = {
    "p2p.delivery.created": P2pDeliveryCreatedData;
    "p2p.delivery.cancelled": P2pDeliveryCancelledData;
    "errand.delivery.created": ErrandDeliveryWebhookData;
    "errand.delivery.cancelled": ErrandDeliveryWebhookData;
    "delivery.request.accepted": DeliveryLifecycleData;
    "delivery.request.declined": DeliveryLifecycleData;
    "delivery.awaiting.collection": DeliveryLifecycleData;
    "delivery.collected": DeliveryLifecycleData;
    "delivery.in.transit": DeliveryLifecycleData;
    "delivery.delivered": DeliveryLifecycleData;
    "delivery.reassignment.created": ReassignmentWebhookData;
    "delivery.reassignment.direct_assigned": ReassignmentWebhookData;
    "delivery.reassignment.requested": ReassignmentWebhookData;
    "delivery.reassignment.collected": ReassignmentWebhookData;
    "payment.received": PaymentReceivedData;
    "order.created": OrderWebhookData;
    "order.cancelled": OrderWebhookData;
    "order.confirmed": OrderWebhookData;
    "order.declined": OrderWebhookData;
    "order.requested": OrderWebhookData;
};

export type WebhookEvent = {
    [K in WebhookEventName]: { event: K; data: WebhookEventMap[K] };
}[WebhookEventName];

export function parseWebhookEvent(
    rawBody: Buffer | Uint8Array | string,
): WebhookEvent {
    const text =
        typeof rawBody === "string"
            ? rawBody
            : Buffer.from(rawBody).toString("utf8");
    const payload = JSON.parse(text) as { event?: string; data?: unknown };
    if (!payload.event || payload.data === undefined) {
        throw new Error("Invalid webhook payload: expected { event, data }");
    }
    return payload as WebhookEvent;
}

export function isWebhookEvent<E extends WebhookEventName>(
    webhook: WebhookEvent,
    event: E,
): webhook is Extract<WebhookEvent, { event: E }> {
    return webhook.event === event;
}
