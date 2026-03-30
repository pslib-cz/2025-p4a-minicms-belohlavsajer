import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
    title: "Přihlášení",
    description: "Přihlášení do redakční konzole Minecraft Portal.",
    robots: {
        index: false,
        follow: false,
    },
};

function resolveLoginCallbackUrl(
    value: string | string[] | undefined,
    fallback = "/dashboard",
) {
    if (typeof value !== "string") {
        return fallback;
    }

    return value.startsWith("/") ? value : fallback;
}

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ next?: string | string[] }>;
}) {
    const { next } = await searchParams;
    const callbackUrl = resolveLoginCallbackUrl(next);

    return (
        <main className="container ui-page" style={{ maxWidth: "540px" }}>
            <LoginForm callbackUrl={callbackUrl} />
        </main>
    );
}
