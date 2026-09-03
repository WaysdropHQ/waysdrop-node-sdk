export type DisplayMoneyLocal = {
    currency: string;
    amount: number;
    symbol: string;
};

export type DisplayMoney = {
    usd: number;
    local?: DisplayMoneyLocal;
};

export type RoutePoint = {
    address?: string;
    lat?: number;
    lon?: number;
    googlePlaceId?: string;
};

export type UrgencyType = "PRIORITY" | "STANDARD" | "SCHEDULED";
export type CourierMatching =
    | "ANYONE"
    | "SPECIFIC"
    | "MERCHANT_SPECIAL_COURIERS";
export type P2pDeliveryType = "PICKUP" | "DROP_OFF";
export type DeliveryFeePayer = "CREATOR" | "RECIPIENT" | "SPLIT";
export type PodRemitTo = "MY_WALLET" | "COURIER_WALLET";
export type PaymentMethodType = "WALLET" | "CHECKOUT";
export type DeliveryStatus =
    | "REQUEST_CREATED"
    | "ASSIGNING"
    | "AWAITING_COLLECTION"
    | "PACKAGE_COLLECTED"
    | "IN_TRANSIT"
    | "DELIVERED"
    | "CANCELLED";

export type ApiGetRouteData = {
    origin: RoutePoint;
    destination: RoutePoint;
};

export type ApiCalculateRouteCost = ApiGetRouteData & {
    packagesId?: string[];
    totalWeight?: number;
    totalValue?: number;
    urgencyType?: UrgencyType;
    deliveryDate?: string;
    deliverySlot?: string;
    slot?: string;
    fleetTypeId?: string;
    courierSelection?: CourierMatching;
    courierId?: string;
    courierProfileId?: string;
    deliveryFeePayer?: DeliveryFeePayer;
    currency?: string;
};

export type ApiCreateDeliveryRequest = ApiCalculateRouteCost & {
    originContactEmail?: string;
    originContactPhone?: string;
    originContactName?: string;
    destinationContactEmail: string;
    destinationContactPhone: string;
    destinationContactName: string;
    note?: string;
    link3rdPartyByContactInfo?: boolean;
    packagesId: string[];
    type: P2pDeliveryType;
    requireCollectionProofCode?: boolean;
    requireDeliveryProofCode?: boolean;
    payPackageValue?: boolean;
    payOnDelivery?: boolean;
    podRemitTo?: PodRemitTo;
    podCourierProfileId?: string;
    paymentMethodType?: PaymentMethodType;
    notify3rdParty?: boolean;
    courierSelection: CourierMatching;
    courierId?: string;
    callbackUrl?: string;
    externalReference?: string;
};

export type ApiCreateOrEditPackage = {
    packageId?: string;
    packageType?: string;
    name?: string;
    description?: string;
    quantity?: number;
    value?: number;
    size?: "SMALL" | "MEDIUM" | "LARGE" | "EXTRA_LARGE";
    weight?: number;
    inputCurrency?: string;
    image?: string;
};

export type ApiCreatePaymentCheckout = {
    amount: number;
    customerEmail: string;
    merchantReference?: string;
    externalReference?: string;
    currencyCode?: string;
    inputCurrency?: string;
    callbackUrl?: string;
};

export type ListDeliveriesParams = {
    status?: DeliveryStatus;
    search?: string;
    page?: number;
    limit?: number;
    currency?: string;
    externalReference?: string;
};

export type ListLocationsParams = {
    search?: string;
    limit?: number;
};

export type WebhookEventName =
    | "p2p.delivery.created"
    | "p2p.delivery.cancelled"
    | "errand.delivery.created"
    | "errand.delivery.cancelled"
    | "delivery.request.accepted"
    | "delivery.request.declined"
    | "delivery.awaiting.collection"
    | "delivery.collected"
    | "delivery.in.transit"
    | "delivery.delivered"
    | "delivery.reassignment.created"
    | "delivery.reassignment.direct_assigned"
    | "delivery.reassignment.requested"
    | "delivery.reassignment.collected"
    | "payment.received"
    | "refund.processed"
    | "order.created"
    | "order.cancelled"
    | "order.confirmed"
    | "order.declined"
    | "order.requested";

export type WebhookEnvelope<
    T extends WebhookEventName = WebhookEventName,
    D = Record<string, unknown>,
> = {
    event: T;
    data: D;
};

export type WaysdropClientOptions = {
    apiKey: string;
    baseUrl?: string;
    timeout?: number;
    displayCurrency?: string;
    correlationId?: string;
    fetch?: typeof fetch;
};
