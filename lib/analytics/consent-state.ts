export const ANALYTICS_CATEGORY = "analytics";
export const GTM_SERVICE = "google_tag_manager";
export const CLARITY_SERVICE = "microsoft_clarity";

const CONSENT_STATE_CHANGE_EVENT = "minecraft-portal:consent-state-change";

type GtagFn = (...args: unknown[]) => void;

export type ClarityFn = ((command: string, ...args: unknown[]) => void) & {
    q?: unknown[][];
};

export type CookieConsentApi = typeof import("vanilla-cookieconsent");

export type AnalyticsConsentSnapshot = {
    initialized: boolean;
    consentDefined: boolean;
    analyticsAccepted: boolean;
    gtmAccepted: boolean;
    clarityAccepted: boolean;
};

export const DEFAULT_ANALYTICS_CONSENT_SNAPSHOT: AnalyticsConsentSnapshot = {
    initialized: false,
    consentDefined: false,
    analyticsAccepted: false,
    gtmAccepted: false,
    clarityAccepted: false,
};

declare global {
    interface Window {
        __minecraftPortalConsentSnapshot?: AnalyticsConsentSnapshot;
        __minecraftPortalCookieConsentApi?: CookieConsentApi;
        __minecraftPortalGoogleConsentDefaultsApplied?: boolean;
        dataLayer?: unknown[];
        gtag?: GtagFn;
        clarity?: ClarityFn;
        __clarityProjectId?: string;
    }
}

export function getConsentSnapshot() {
    if (typeof window === "undefined") {
        return DEFAULT_ANALYTICS_CONSENT_SNAPSHOT;
    }

    return (
        window.__minecraftPortalConsentSnapshot ??
        DEFAULT_ANALYTICS_CONSENT_SNAPSHOT
    );
}

export function setConsentSnapshot(snapshot: AnalyticsConsentSnapshot) {
    if (typeof window === "undefined") {
        return;
    }

    window.__minecraftPortalConsentSnapshot = snapshot;
    window.dispatchEvent(
        new CustomEvent<AnalyticsConsentSnapshot>(CONSENT_STATE_CHANGE_EVENT, {
            detail: snapshot,
        }),
    );
}

export function subscribeConsentSnapshot(listener: () => void) {
    if (typeof window === "undefined") {
        return () => undefined;
    }

    const eventListener = () => listener();
    window.addEventListener(CONSENT_STATE_CHANGE_EVENT, eventListener);

    return () => {
        window.removeEventListener(CONSENT_STATE_CHANGE_EVENT, eventListener);
    };
}

export function hasGtmConsent() {
    return getConsentSnapshot().gtmAccepted;
}

export function openCookiePreferences() {
    if (typeof window === "undefined") {
        return;
    }

    const cookieConsentApi = window.__minecraftPortalCookieConsentApi;
    if (!cookieConsentApi) {
        return;
    }

    if (cookieConsentApi.validConsent()) {
        cookieConsentApi.showPreferences();
        return;
    }

    cookieConsentApi.show(true);
}

export function primeGoogleConsentModeDefaults() {
    if (
        typeof window === "undefined" ||
        window.__minecraftPortalGoogleConsentDefaultsApplied
    ) {
        return;
    }

    window.dataLayer = window.dataLayer ?? [];
    window.gtag =
        window.gtag ??
        ((...args: unknown[]) => {
            window.dataLayer?.push(args);
        });

    window.gtag("consent", "default", {
        ad_storage: "denied",
        analytics_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
    });

    window.__minecraftPortalGoogleConsentDefaultsApplied = true;
}

export function updateGoogleConsentMode(granted: boolean) {
    if (typeof window === "undefined") {
        return;
    }

    primeGoogleConsentModeDefaults();

    window.gtag?.("consent", "update", {
        ad_storage: granted ? "granted" : "denied",
        analytics_storage: granted ? "granted" : "denied",
        ad_user_data: granted ? "granted" : "denied",
        ad_personalization: granted ? "granted" : "denied",
    });
}

export function updateClarityConsentMode(granted: boolean) {
    if (typeof window === "undefined" || !window.clarity) {
        return;
    }

    window.clarity("consentv2", {
        ad_Storage: granted ? "granted" : "denied",
        analytics_Storage: granted ? "granted" : "denied",
    });
}
