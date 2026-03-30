import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
    title: "Přihlášení",
    description: "Přihlášení do redakční konzole Minecraft Portal.",
    robots: {
        index: false,
        follow: false,
    },
};

export default async function LoginPage() {
    const session = await getServerSession(authOptions);

    if (session?.user?.id) {
        redirect("/dashboard");
    }

    return (
        <main className="container ui-page" style={{ maxWidth: "540px" }}>
            <LoginForm />
        </main>
    );
}
