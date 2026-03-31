"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { isPublicAnalyticsPath } from "@/lib/analytics/public-routes";
import {
    DEFAULT_ANALYTICS_CONSENT_SNAPSHOT,
    openCookiePreferences,
    setConsentSnapshot,
    subscribeCookiePreferencesOpen,
    updateClarityConsentMode,
    updateGoogleConsentMode,
    type AnalyticsConsentSnapshot,
} from "@/lib/analytics/consent-state";
import {
    getConfiguredClarityProjectId,
    getConfiguredGtmId,
} from "@/lib/analytics/config";

const COOKIE_CONSENT_NAME = "minecraft_portal_cookie_consent";
const COOKIE_CONSENT_REVISION = 3;
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 182;

type StoredConsentRecord = {
    analyticsAccepted: boolean;
    revision: number;
    savedAt: string;
};

function buildConsentSnapshot(
    analyticsAccepted: boolean,
    gtmEnabled: boolean,
    clarityEnabled: boolean,
): AnalyticsConsentSnapshot {
    return {
        initialized: true,
        consentDefined: true,
        analyticsAccepted,
        gtmAccepted: analyticsAccepted && gtmEnabled,
        clarityAccepted: analyticsAccepted && clarityEnabled,
    };
}

function readCookieValue(name: string) {
    if (typeof document === "undefined") {
        return null;
    }

    const match = document.cookie.match(
        new RegExp(`(?:^|; )${name.replace(/[$()*+.?[\\\]^{|}]/g, "\\$&")}=([^;]*)`),
    );

    return match ? decodeURIComponent(match[1]) : null;
}

function readStoredConsent(): StoredConsentRecord | null {
    if (typeof window === "undefined") {
        return null;
    }

    const sources = [
        window.localStorage.getItem(COOKIE_CONSENT_NAME),
        readCookieValue(COOKIE_CONSENT_NAME),
    ];

    for (const source of sources) {
        if (!source) {
            continue;
        }

        try {
            const parsed = JSON.parse(source) as Partial<StoredConsentRecord>;
            if (
                typeof parsed.analyticsAccepted === "boolean" &&
                typeof parsed.revision === "number" &&
                typeof parsed.savedAt === "string"
            ) {
                return {
                    analyticsAccepted: parsed.analyticsAccepted,
                    revision: parsed.revision,
                    savedAt: parsed.savedAt,
                };
            }
        } catch {
            continue;
        }
    }

    return null;
}

function clearStoredConsent() {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.removeItem(COOKIE_CONSENT_NAME);
    document.cookie = `${COOKIE_CONSENT_NAME}=; path=/; max-age=0; samesite=lax`;
}

function persistStoredConsent(record: StoredConsentRecord) {
    if (typeof window === "undefined") {
        return;
    }

    const serialized = JSON.stringify(record);
    window.localStorage.setItem(COOKIE_CONSENT_NAME, serialized);
    document.cookie = `${COOKIE_CONSENT_NAME}=${encodeURIComponent(
        serialized,
    )}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}

export function CookieConsentProvider() {
    const pathname = usePathname();
    const [initialized, setInitialized] = useState(false);
    const [consentDefined, setConsentDefined] = useState(false);
    const [analyticsAccepted, setAnalyticsAccepted] = useState(false);
    const [preferencesOpen, setPreferencesOpen] = useState(false);

    const gtmId = getConfiguredGtmId();
    const clarityProjectId = getConfiguredClarityProjectId();
    const hasOptionalAnalytics = Boolean(gtmId || clarityProjectId);
    const gtmEnabled = Boolean(gtmId);
    const clarityEnabled = Boolean(clarityProjectId);
    const publicPath = isPublicAnalyticsPath(pathname);

    useEffect(() => {
        const storedConsent = readStoredConsent();
        const consentIsCurrent =
            storedConsent?.revision === COOKIE_CONSENT_REVISION;

        if (consentIsCurrent && storedConsent) {
            const snapshot = buildConsentSnapshot(
                storedConsent.analyticsAccepted,
                gtmEnabled,
                clarityEnabled,
            );

            setConsentSnapshot(snapshot);
            setInitialized(true);
            setConsentDefined(true);
            setAnalyticsAccepted(storedConsent.analyticsAccepted);
            updateGoogleConsentMode(snapshot.gtmAccepted && publicPath);
            updateClarityConsentMode(snapshot.clarityAccepted && publicPath);
            return;
        }

        if (storedConsent && !consentIsCurrent) {
            clearStoredConsent();
        }

        setConsentSnapshot({
            ...DEFAULT_ANALYTICS_CONSENT_SNAPSHOT,
            initialized: true,
        });
        setInitialized(true);
        setConsentDefined(false);
        setAnalyticsAccepted(false);
        updateGoogleConsentMode(false);
        updateClarityConsentMode(false);
    }, [publicPath, gtmEnabled, clarityEnabled]);

    useEffect(() => {
        return subscribeCookiePreferencesOpen(() => {
            if (!hasOptionalAnalytics) {
                return;
            }

            setPreferencesOpen(true);
        });
    }, [hasOptionalAnalytics, publicPath]);

    function applyConsent(nextAnalyticsAccepted: boolean) {
        const record: StoredConsentRecord = {
            analyticsAccepted: nextAnalyticsAccepted,
            revision: COOKIE_CONSENT_REVISION,
            savedAt: new Date().toISOString(),
        };
        const snapshot = buildConsentSnapshot(
            nextAnalyticsAccepted,
            gtmEnabled,
            clarityEnabled,
        );

        persistStoredConsent(record);
        setConsentSnapshot(snapshot);
        setInitialized(true);
        setConsentDefined(true);
        setAnalyticsAccepted(nextAnalyticsAccepted);
        setPreferencesOpen(false);
        updateGoogleConsentMode(snapshot.gtmAccepted && publicPath);
        updateClarityConsentMode(snapshot.clarityAccepted && publicPath);
    }

    if (!initialized || !hasOptionalAnalytics) {
        return null;
    }

    return (
        <>
            {!consentDefined ? (
                <div className="cookie-banner" role="dialog" aria-modal="false">
                    <div className="cookie-banner__copy">
                        <p className="cookie-banner__eyebrow">Cookies</p>
                        <h2>Zapnout Clarity a analytiku</h2>
                        <p>
                            Web funguje i bez volitelných cookies. Pokud je
                            povolíte, zapne se Microsoft Clarity a případně další
                            analytika na veřejných stránkách. Volbu můžete
                            nastavit odkudkoli na webu.
                        </p>
                    </div>
                    <div className="cookie-banner__actions">
                        <button
                            type="button"
                            className="cookie-banner__secondary"
                            onClick={() => applyConsent(false)}
                        >
                            Pouze nezbytné
                        </button>
                        <button
                            type="button"
                            className="cookie-banner__secondary"
                            onClick={() => setPreferencesOpen(true)}
                        >
                            Nastavení
                        </button>
                        <button
                            type="button"
                            className="cookie-banner__primary"
                            onClick={() => applyConsent(true)}
                        >
                            Povolit analytiku
                        </button>
                    </div>
                </div>
            ) : null}

            {preferencesOpen ? (
                <div className="cookie-modal-backdrop" role="presentation">
                    <div
                        className="cookie-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="cookie-modal-title"
                    >
                        <div className="cookie-modal__header">
                            <div>
                                <p className="cookie-banner__eyebrow">
                                    Nastavení cookies
                                </p>
                                <h2 id="cookie-modal-title">
                                    Volitelná analytika
                                </h2>
                            </div>
                            <button
                                type="button"
                                className="cookie-modal__close"
                                onClick={() => setPreferencesOpen(false)}
                                aria-label="Zavřít nastavení cookies"
                            >
                                ×
                            </button>
                        </div>

                        <div className="cookie-modal__section">
                            <div className="cookie-modal__row">
                                <div>
                                    <h3>Nezbytné cookies</h3>
                                    <p>
                                        Nutné pro přihlášení, bezpečnost a uložení
                                        vaší volby cookies.
                                    </p>
                                </div>
                                <span className="cookie-modal__badge">
                                    Vždy aktivní
                                </span>
                            </div>
                        </div>

                        <div className="cookie-modal__section">
                            <label className="cookie-modal__toggle">
                                <div>
                                    <h3>Microsoft Clarity a analytika</h3>
                                    <p>
                                        Zapne Clarity na veřejných stránkách a
                                        další volitelné měření, pokud je v projektu
                                        nastavené.
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={analyticsAccepted}
                                    onChange={(event) =>
                                        setAnalyticsAccepted(event.target.checked)
                                    }
                                />
                            </label>
                        </div>

                        <div className="cookie-modal__footer">
                            <button
                                type="button"
                                className="cookie-banner__secondary"
                                onClick={() => applyConsent(false)}
                            >
                                Pouze nezbytné
                            </button>
                            <button
                                type="button"
                                className="cookie-banner__primary"
                                onClick={() => applyConsent(analyticsAccepted)}
                            >
                                Uložit volbu
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {consentDefined ? (
                <button
                    type="button"
                    className="cookie-preferences-button"
                    onClick={openCookiePreferences}
                >
                    Nastavení cookies
                </button>
            ) : null}
        </>
    );
}
