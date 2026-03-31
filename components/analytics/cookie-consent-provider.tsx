"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { isPublicAnalyticsPath } from "@/lib/analytics/public-routes";
import {
    ANALYTICS_CATEGORY,
    CLARITY_SERVICE,
    DEFAULT_ANALYTICS_CONSENT_SNAPSHOT,
    GTM_SERVICE,
    primeGoogleConsentModeDefaults,
    setConsentSnapshot,
    updateClarityConsentMode,
    updateGoogleConsentMode,
    type AnalyticsConsentSnapshot,
    type CookieConsentApi,
} from "@/lib/analytics/consent-state";

const COOKIE_CONSENT_NAME = "minecraft_portal_cookie_consent";
const COOKIE_CONSENT_REVISION_BASE = 2;
const PREVIEW_SERVICE = "consent_preview";
const PROVIDER_INSTANCE_VERSION = "cookie-consent-v3-preview-1";

type CookieConsentConfig = Parameters<CookieConsentApi["run"]>[0];

function buildConsentSnapshot(api: CookieConsentApi): AnalyticsConsentSnapshot {
    const consentDefined = api.validConsent();
    const analyticsAccepted = api.acceptedCategory(ANALYTICS_CATEGORY);

    return {
        initialized: true,
        consentDefined,
        analyticsAccepted,
        gtmAccepted:
            consentDefined &&
            analyticsAccepted &&
            api.acceptedService(GTM_SERVICE, ANALYTICS_CATEGORY),
        clarityAccepted:
            consentDefined &&
            analyticsAccepted &&
            api.acceptedService(CLARITY_SERVICE, ANALYTICS_CATEGORY),
    };
}

function syncConsentState(api: CookieConsentApi) {
    const snapshot = buildConsentSnapshot(api);
    setConsentSnapshot(snapshot);
    updateGoogleConsentMode(snapshot.gtmAccepted);
    updateClarityConsentMode(snapshot.clarityAccepted);
}

function buildConsentConfig(
    api: CookieConsentApi,
    gtmEnabled: boolean,
    clarityEnabled: boolean,
    previewMode: boolean,
): CookieConsentConfig {
    const analyticsServices: Record<string, { label: string }> = {};

    if (gtmEnabled) {
        analyticsServices[GTM_SERVICE] = {
            label: "Google Analytics 4 přes Google Tag Manager",
        };
    }

    if (clarityEnabled) {
        analyticsServices[CLARITY_SERVICE] = {
            label: "Microsoft Clarity heatmapy a session replay",
        };
    }

    if (previewMode) {
        analyticsServices[PREVIEW_SERVICE] = {
            label: "Lokální preview consent UI bez aktivního měření",
        };
    }

    const revision =
        COOKIE_CONSENT_REVISION_BASE +
        (gtmEnabled ? 1 : 0) +
        (clarityEnabled ? 2 : 0) +
        (previewMode ? 4 : 0);

    return {
        mode: "opt-in",
        revision,
        manageScriptTags: false,
        disablePageInteraction: false,
        cookie: {
            name: COOKIE_CONSENT_NAME,
            sameSite: "Lax",
            expiresAfterDays: 182,
        },
        guiOptions: {
            consentModal: {
                layout: "box wide",
                position: "bottom left",
                flipButtons: false,
                equalWeightButtons: true,
            },
            preferencesModal: {
                layout: "box",
                equalWeightButtons: true,
                flipButtons: false,
            },
        },
        onConsent: () => {
            syncConsentState(api);
        },
        onChange: () => {
            syncConsentState(api);
        },
        categories: {
            necessary: {
                enabled: true,
                readOnly: true,
            },
            [ANALYTICS_CATEGORY]: {
                autoClear: {
                    cookies: [
                        { name: /^_ga/ },
                        { name: "_gid" },
                        { name: /^_gat/ },
                        { name: /^_gcl/ },
                        { name: "_clck" },
                        { name: "_clsk" },
                    ],
                },
                services: analyticsServices,
            },
        },
        language: {
            default: "cs",
            translations: {
                cs: {
                    consentModal: {
                        label: "Cookie souhlas pro volitelnou analytiku",
                        title: "Cookies pro volitelnou analytiku",
                        description:
                            previewMode
                                ? "Používáme nezbytné cookies pro běh webu a přihlášení. Tohle je lokální preview consent UI, takže bez nastaveného GTM nebo Clarity se po povolení nic nezačne měřit. {{revisionMessage}}"
                                : "Používáme nezbytné cookies pro běh webu a přihlášení. Volitelně můžeme zapnout analytiku pro měření návštěvnosti a zlepšování veřejné části webu. {{revisionMessage}}",
                        revisionMessage:
                            "Pokud jste web navštívili dřív, obnovili jsme nastavení cookies kvůli změně aktivních analytických služeb.",
                        acceptAllBtn: "Povolit analytiku",
                        acceptNecessaryBtn: "Pouze nezbytné",
                        showPreferencesBtn: "Nastavení cookies",
                    },
                    preferencesModal: {
                        title: "Nastavení cookies",
                        acceptAllBtn: "Povolit vše",
                        acceptNecessaryBtn: "Pouze nezbytné",
                        savePreferencesBtn: "Uložit výběr",
                        closeIconLabel: "Zavřít",
                        serviceCounterLabel: "služba",
                        sections: [
                            {
                                title: "Jak cookies používáme",
                                description:
                                    "Nezbytné cookies drží přihlášení a bezpečnost formulářů. Volitelná analytika nám pomáhá rozumět tomu, které veřejné stránky a prvky fungují dobře.",
                            },
                            {
                                title: "Nezbytné cookies",
                                description:
                                    "Tyto cookies jsou nutné pro základní fungování webu, přihlášení a uložení vaší consent volby.",
                                linkedCategory: "necessary",
                                cookieTable: {
                                    headers: {
                                        name: "Cookie",
                                        description: "Účel",
                                    },
                                    body: [
                                        {
                                            name: COOKIE_CONSENT_NAME,
                                            description:
                                                "Uloží vaši volbu cookies pro tento web.",
                                        },
                                        {
                                            name: "next-auth.session-token / __Secure-next-auth.session-token",
                                            description:
                                                "Drží přihlášenou relaci v administraci.",
                                        },
                                        {
                                            name: "next-auth.csrf-token",
                                            description:
                                                "Chrání přihlašovací formulář a další citlivé akce proti zneužití.",
                                        },
                                    ],
                                },
                            },
                            {
                                title: "Volitelná analytika",
                                description:
                                    previewMode
                                        ? "V tomhle lokálním preview není připojená žádná reálná analytická služba. Kategorie slouží jen pro ověření banneru a preference flow."
                                        : "Tato kategorie zpřístupní služby pro měření návštěvnosti a chování uživatelů ve veřejné části webu.",
                                linkedCategory: ANALYTICS_CATEGORY,
                                cookieTable: {
                                    headers: {
                                        name: "Cookie",
                                        description: "Účel",
                                    },
                                    body: [
                                        {
                                            name: "_ga*, _gid",
                                            description:
                                                "Google Analytics identifikátory pro agregované měření návštěvnosti.",
                                        },
                                        {
                                            name: "_clck, _clsk",
                                            description:
                                                "Microsoft Clarity identifikátory pro session replay a heatmapy.",
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                },
            },
        },
    };
}

type CookieConsentRuntimeProps = {
    pathname: string;
};

function CookieConsentRuntime({ pathname }: CookieConsentRuntimeProps) {
    const initStatusRef = useRef<"idle" | "pending" | "ready">("idle");
    const isDevelopment = process.env.NODE_ENV !== "production";
    const gtmEnabled = Boolean(process.env.NEXT_PUBLIC_GTM_ID?.trim());
    const clarityEnabled = Boolean(
        process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim(),
    );
    const previewMode = isDevelopment && !gtmEnabled && !clarityEnabled;

    useEffect(() => {
        const hasOptionalAnalytics = gtmEnabled || clarityEnabled;
        const shouldMountConsentUi = hasOptionalAnalytics || previewMode;

        if (!shouldMountConsentUi) {
            return;
        }

        if (!isPublicAnalyticsPath(pathname)) {
            updateGoogleConsentMode(false);
            updateClarityConsentMode(false);
            return;
        }

        if (gtmEnabled) {
            primeGoogleConsentModeDefaults();
        }

        const cookieConsentApi = window.__minecraftPortalCookieConsentApi;
        if (cookieConsentApi) {
            initStatusRef.current = "ready";
            syncConsentState(cookieConsentApi);
            return;
        }

        if (initStatusRef.current !== "idle") {
            return;
        }

        let cancelled = false;
        initStatusRef.current = "pending";

        void (async () => {
            try {
                const cookieConsentModule = await import("vanilla-cookieconsent");
                const CookieConsent =
                    cookieConsentModule.default as unknown as CookieConsentApi;

                if (cancelled) {
                    return;
                }

                window.__minecraftPortalCookieConsentApi = CookieConsent;
                await CookieConsent.run(
                    buildConsentConfig(
                        CookieConsent,
                        gtmEnabled,
                        clarityEnabled,
                        previewMode,
                    ),
                );

                if (cancelled) {
                    return;
                }

                initStatusRef.current = "ready";
                syncConsentState(CookieConsent);
            } catch {
                initStatusRef.current = "idle";
                setConsentSnapshot({
                    ...DEFAULT_ANALYTICS_CONSENT_SNAPSHOT,
                    initialized: true,
                });
            }
        })();

        return () => {
            cancelled = true;
            if (initStatusRef.current === "pending") {
                initStatusRef.current = "idle";
            }
        };
    }, [pathname, isDevelopment, gtmEnabled, clarityEnabled, previewMode]);

    return null;
}

export function CookieConsentProvider() {
    const pathname = usePathname();

    return (
        <CookieConsentRuntime
            key={`${PROVIDER_INSTANCE_VERSION}:${pathname}`}
            pathname={pathname}
        />
    );
}
