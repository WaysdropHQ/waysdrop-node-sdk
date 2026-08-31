import type { DisplayMoney, DeliveryStatus } from "./types.js";

export type RouteType =
    | "INTRA_CITY"
    | "INTER_CITY"
    | "INTER_STATE"
    | "INTER_COUNTRY";

export type PackageSize = "SMALL" | "MEDIUM" | "LARGE" | "EXTRA_LARGE";

export type PaymentProcessor = "PAYSTACK" | "NOMBA" | "STRIPE";

export type DeliveryType = "P2P" | "ERRAND" | "STORE" | "PERSONAL";

export type DistanceInfo = {
    distanceKm: number;
    etaSeconds: number;
};

export type GeoLocation = {
    id?: string;
    addressLine1?: string;
    lgaOrCity?: string;
    state?: string;
    country?: string;
    countryCode?: string;
    lat?: number;
    lon?: number;
    googlePlaceId?: string;
    floor?: string;
    contactName?: string;
    contactPhone?: string;
};

export type CountryLocation = {
    value: string;
    name: string;
    type: "INTER_COUNTRY";
    country: string;
    countryCode: string;
    countryCodeAlpha3?: string;
    continentCode?: string;
    continentName?: string;
};

export type StateLocation = {
    value: string;
    name: string;
    type: "INTER_STATE";
    state: string;
    country: string;
    countryCode: string;
    admin1Id?: string;
    admin1Name?: string;
};

export type CityLocation = {
    locationId?: string;
    value: string;
    country: string;
    countryCode: string;
    lat?: number;
    lon?: number;
    lgaOrCity?: string;
    state?: string;
    adminUnitName?: string;
};

export type FleetType = {
    id: string;
    name: string;
    icon?: string | null;
    description?: string | null;
};

export type PricingCosts = {
    base?: string | number;
    weight?: string | number;
    fleet?: string | number;
    insurance?: string | number;
    surcharge?: string | number;
    serviceFee?: string | number;
    deliverySubtotal?: string | number;
    total?: string | number;
    totalDisplay?: DisplayMoney;
};

export type PricingBreakdown = {
    baseCharge?: string | null;
    weightCharge?: string | null;
    insuranceCharge?: string | null;
    fleetCharge?: string | null;
    surchargeCharge?: string | null;
    serviceFeeCharge?: string | null;
};

export type DeliveryFeeShare = {
    amount?: string | number;
    amountDisplay?: DisplayMoney;
    paymentRequired?: boolean;
    checkoutUrl?: string;
};

export type DeliveryFeeBlock = {
    payer?: "CREATOR" | "RECIPIENT" | "SPLIT";
    gross?: { delivery?: string | number };
    creator?: DeliveryFeeShare;
    recipient?: DeliveryFeeShare;
    matchingEligible?: boolean;
};

export type PricingResponse = {
    distance: DistanceInfo;
    routeType: RouteType;
    costs: PricingCosts;
    breakdown?: PricingBreakdown;
    courierPricingRule?: Record<string, unknown> | null;
    paymentOptions?: {
        payNowDeliveryOnly?: string;
        payNowWithPackage?: string;
    };
    deliveryFee?: DeliveryFeeBlock;
    deliveryCost?: {
        totalValue?: string | number;
        totalValueDisplay?: DisplayMoney;
    };
    payOnDelivery?: {
        collectAmount?: string | number;
        collectAmountDisplay?: DisplayMoney;
    };
};

export type RouteDataResponse = {
    distance: DistanceInfo;
    routeType: RouteType;
    origin: GeoLocation;
    destination: GeoLocation;
};

export type DeliveryPackage = {
    id: string;
    name: string;
    packageType?: string | null;
    image?: string | null;
    description?: string | null;
    quantity: number;
    weight: string | number;
    value: string | number;
    valueDisplay?: DisplayMoney;
    size: PackageSize;
    type?: string;
    p2pDeliveryId?: string | null;
    userId?: string;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
};

export type DeliverySummary = {
    id: string;
    trackingId: string;
    status: DeliveryStatus;
    type?: DeliveryType;
    routeType?: RouteType;
    deliveryFee?: string | number;
    deliveryFeeDisplay?: DisplayMoney;
    distanceKm?: number;
    etaSeconds?: number;
    courierMatching?: string;
    origin?: GeoLocation;
    destination?: GeoLocation;
    createdAt?: string;
    updatedAt?: string;
};

export type DeliveryStep = {
    id?: string;
    step: string;
    active: boolean;
    updatedAt?: string;
};

export type DeliveryProof = {
    id: string;
    type: string;
    code?: string | null;
    scannedAt?: string | null;
};

export type CourierFleet = {
    regNo?: string;
    make?: string;
    model?: string;
    colour?: string;
    typeId?: string;
};

export type CourierInfo = {
    name: string;
    phone: string;
    profilePhoto?: string;
    fleet?: CourierFleet | null;
    currentLocation?: GeoLocation | null;
    eta?: { from: string; to: string } | null;
};

export type P2pDeliverySummary = {
    id: string;
    status: string;
    type?: "PICKUP" | "DROP_OFF";
    totalWeight?: string | number;
    totalValue?: string | number;
    totalValueDisplay?: DisplayMoney;
    deliveryId?: string;
    userId?: string;
    profileId?: string;
};

export type DeliveryDetail = DeliverySummary & {
    deliverySteps?: DeliveryStep[];
    proofs?: DeliveryProof[];
    fleetType?: FleetType;
    p2pDelivery?: P2pDeliverySummary;
    courier?: CourierInfo;
    p2pDeliveryId?: string;
};

export type HostedCheckoutFields = {
    processor: PaymentProcessor;
    reference: string;
    charge_currency: string;
    charge_amount: number;
    amount_usd?: number;
    authorization_url?: string;
    checkout_url?: string;
};

export type CreateDeliveryResponse = P2pDeliverySummary & {
    delivery?: DeliverySummary;
    deliveryFee?: DeliveryFeeBlock;
    paymentMethodType?: "WALLET" | "CHECKOUT";
    payPackageValue?: boolean;
} & Partial<HostedCheckoutFields>;

export type CancelDeliveryResponse = {
    delivery: { id: string };
    refundAmount?: string | number;
    refundAmountDisplay?: DisplayMoney;
};

export type MerchantWallet = {
    id: string;
    currencyCode: string;
    balance: string;
    balanceDisplay?: DisplayMoney;
};

export type PaymentCheckoutResponse = HostedCheckoutFields;

export type StoreProfile = {
    id: string;
    name: string;
    tag: string;
};

export type AccountSummary = {
    userId: string;
    countryCode: string;
    displayCurrency: string;
    merchantWalletCurrencyCode: string;
    storeProfile: StoreProfile | null;
};

export type ExchangeRateResponse = {
    from: string;
    to: string;
    rate: number;
    isStale?: boolean;
};

export type ConvertCurrencyResponse = {
    from: string;
    to: string;
    amount: number;
    convertedAmount: number;
    rate: number;
};

export type PaginatedMeta = {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

export type ListDeliveriesResponse = {
    data: DeliveryDetail[];
    meta: PaginatedMeta;
};
