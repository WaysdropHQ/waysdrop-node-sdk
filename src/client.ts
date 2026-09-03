import type {
    FleetType,
    CityLocation,
    StateLocation,
    AccountSummary,
    MerchantWallet,
    DeliveryDetail,
    CountryLocation,
    DeliveryPackage,
    PricingResponse,
    RouteDataResponse,
    ExchangeRateResponse,
    CreateDeliveryResponse,
    CancelDeliveryResponse,
    ListDeliveriesResponse,
    ConvertCurrencyResponse,
    PaymentCheckoutResponse,
} from "./responses.js";
import type {
    ApiGetRouteData,
    ListLocationsParams,
    ListDeliveriesParams,
    ApiCalculateRouteCost,
    WaysdropClientOptions,
    ApiCreateOrEditPackage,
    ApiCreatePaymentCheckout,
    ApiCreateDeliveryRequest,
} from "./types.js";
import crypto from "node:crypto";
import { WaysdropError, inferBaseUrl, validateApiKey } from "./errors.js";

type QueryParams = Record<string, string | number | undefined>;

export class WaysdropClient {
    private readonly apiKey: string;
    private readonly baseUrl: string;
    private readonly timeout: number;
    private readonly displayCurrency?: string;
    private readonly correlationId?: string;
    private readonly fetchFn: typeof fetch;

    constructor(options: WaysdropClientOptions) {
        validateApiKey(options.apiKey);
        this.apiKey = options.apiKey;
        this.baseUrl = (
            options.baseUrl ?? inferBaseUrl(options.apiKey)
        ).replace(/\/$/, "");
        this.timeout = options.timeout ?? 30_000;
        this.displayCurrency = options.displayCurrency;
        this.correlationId = options.correlationId;
        this.fetchFn = options.fetch ?? fetch;
    }

    listCountries(
        params: ListLocationsParams = {},
    ): Promise<CountryLocation[]> {
        return this.get("/api/countries", params);
    }

    listStates(params: ListLocationsParams = {}): Promise<StateLocation[]> {
        return this.get("/api/states", params);
    }

    listCities(params: ListLocationsParams = {}): Promise<CityLocation[]> {
        return this.get("/api/cities", params);
    }

    getRoute(body: ApiGetRouteData): Promise<RouteDataResponse> {
        return this.post("/api/route", body);
    }

    listFleetTypes(): Promise<FleetType[]> {
        return this.get("/api/fleet-types");
    }

    getPricing(
        body: ApiCalculateRouteCost,
        currency?: string,
    ): Promise<PricingResponse> {
        return this.post(
            "/api/pricing",
            this.withCurrency(body, currency),
            currency,
        );
    }

    createDeliveryRequest(
        body: ApiCreateDeliveryRequest,
        currency?: string,
    ): Promise<CreateDeliveryResponse> {
        return this.post(
            "/api/request",
            this.withCurrency(body, currency),
            currency,
        );
    }

    cancelDeliveryRequest(deliveryId: string): Promise<CancelDeliveryResponse> {
        return this.post(`/api/request/${deliveryId}/cancel`, {});
    }

    createOrUpdatePackage(
        body: ApiCreateOrEditPackage,
        currency?: string,
    ): Promise<DeliveryPackage> {
        return this.post(
            "/api/package",
            this.withCurrency(body, currency),
            currency,
        );
    }

    async deletePackage(packageId: string): Promise<void> {
        await this.request("DELETE", `/api/package/${packageId}`);
    }

    listPackages(currency?: string): Promise<DeliveryPackage[]> {
        return this.get("/api/packages", {}, currency);
    }

    getWallet(currency?: string): Promise<MerchantWallet> {
        return this.get("/api/wallet", {}, currency);
    }

    createPaymentCheckout(
        body: ApiCreatePaymentCheckout,
        currency?: string,
    ): Promise<PaymentCheckoutResponse> {
        return this.post(
            "/api/payments/checkout",
            this.withCurrency(body, currency),
            currency,
        );
    }

    getAccount(): Promise<AccountSummary> {
        return this.get("/api/account");
    }

    getExchangeRate(from: string, to: string): Promise<ExchangeRateResponse> {
        return this.get("/api/exchange-rate", { from, to });
    }

    convertCurrency(
        amount: number,
        from: string,
        to: string,
    ): Promise<ConvertCurrencyResponse> {
        return this.get("/api/convert", { amount, from, to });
    }

    listDeliveries(
        params: ListDeliveriesParams = {},
    ): Promise<ListDeliveriesResponse> {
        const { currency, ...rest } = params;
        return this.get("/api/deliveries", rest, currency);
    }

    getDelivery(
        deliveryId: string,
        currency?: string,
    ): Promise<DeliveryDetail> {
        return this.get(`/api/deliveries/${deliveryId}`, {}, currency);
    }

    getPaymentByExternalReference(
        externalReference: string,
    ): Promise<Record<string, unknown>> {
        return this.get(
            `/api/payments/by-external-reference/${encodeURIComponent(externalReference)}`,
        );
    }

    private withCurrency<T extends Record<string, unknown>>(
        body: T,
        currency?: string,
    ): T {
        const c = currency ?? this.displayCurrency;
        if (!c || body.currency) return body;
        return { ...body, currency: c };
    }

    private get<T = unknown>(
        path: string,
        query: QueryParams = {},
        currency?: string,
    ): Promise<T> {
        const qs = this.buildQuery(query, currency);
        return this.request<T>("GET", `${path}${qs}`);
    }

    private post<T = unknown>(
        path: string,
        body: unknown,
        currency?: string,
    ): Promise<T> {
        const qs = this.buildQuery({}, currency);
        return this.request<T>("POST", `${path}${qs}`, body);
    }

    private buildQuery(query: QueryParams, currency?: string): string {
        const params = new URLSearchParams();
        const c = currency ?? this.displayCurrency;
        if (c) params.set("currency", c);
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined) params.set(key, String(value));
        }
        const s = params.toString();
        return s ? `?${s}` : "";
    }

    private async request<T>(
        method: string,
        path: string,
        body?: unknown,
    ): Promise<T> {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeout);

        const headers: Record<string, string> = {
            "api-key": this.apiKey,
            Accept: "application/json",
        };
        if (this.correlationId) {
            headers["X-Correlation-Id"] = this.correlationId;
        }
        if (body !== undefined) {
            headers["Content-Type"] = "application/json";
        }

        try {
            const response = await this.fetchFn(`${this.baseUrl}${path}`, {
                method,
                headers,
                body: body !== undefined ? JSON.stringify(body) : undefined,
                signal: controller.signal,
            });

            if (response.status === 204) {
                return undefined as T;
            }

            const text = await response.text();
            const parsed = text ? JSON.parse(text) : {};

            if (!response.ok) {
                throw new WaysdropError({
                    statusCode: parsed.statusCode ?? response.status,
                    message: parsed.message ?? response.statusText,
                    details: parsed.details,
                    quota: parsed.quota,
                    path: parsed.path,
                });
            }

            if (
                parsed &&
                typeof parsed === "object" &&
                "success" in parsed &&
                "data" in parsed
            ) {
                return parsed.data as T;
            }

            return parsed as T;
        } finally {
            clearTimeout(timer);
        }
    }
}

export function verifySignature(
    rawBody: Buffer | Uint8Array | string,
    signatureHeader: string | null | undefined,
    apiKey: string,
): boolean {
    if (!signatureHeader) return false;
    const body = typeof rawBody === "string" ? rawBody : Buffer.from(rawBody);
    const expected = crypto
        .createHmac("sha256", apiKey)
        .update(body)
        .digest("hex");
    try {
        return crypto.timingSafeEqual(
            Buffer.from(expected, "utf8"),
            Buffer.from(signatureHeader, "utf8"),
        );
    } catch {
        return false;
    }
}

export function parseWebhook<T = Record<string, unknown>>(
    rawBody: Buffer | Uint8Array | string,
): { event: string; data: T } {
    const text =
        typeof rawBody === "string"
            ? rawBody
            : Buffer.from(rawBody).toString("utf8");
    const payload = JSON.parse(text) as { event?: string; data?: T };
    if (!payload.event || payload.data === undefined) {
        throw new Error("Invalid webhook payload: expected { event, data }");
    }
    return { event: payload.event, data: payload.data };
}
