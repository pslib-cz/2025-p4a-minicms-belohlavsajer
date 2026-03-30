"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

import { useAnalyticsConsent } from "@/components/analytics/use-analytics-consent";
import { isPublicAnalyticsPath } from "@/lib/analytics/public-routes";

const GTM_INIT_SCRIPT_ID = "google-tag-manager-init";
const GTM_SCRIPT_ID = "google-tag-manager-script";

export function GoogleTagManagerProvider() {
    const pathname = usePathname();
    const { gtmAccepted } = useAnalyticsConsent();
    const gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim();

    if (!gtmId || !gtmAccepted || !isPublicAnalyticsPath(pathname)) {
        return null;
    }

    return (
        <>
            <Script id={GTM_INIT_SCRIPT_ID} strategy="afterInteractive">
                {`
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  "gtm.start": Date.now(),
  event: "gtm.js"
});
                `}
            </Script>
            <Script
                id={GTM_SCRIPT_ID}
                src={`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(
                    gtmId,
                )}`}
                strategy="afterInteractive"
            />
        </>
    );
}
