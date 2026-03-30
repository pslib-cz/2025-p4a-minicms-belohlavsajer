"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Form, Spinner } from "react-bootstrap";

import { FormField } from "@/components/ui/form-field";
import { MinecraftButton } from "@/components/ui/minecraft-button";
import { SectionCard } from "@/components/ui/section-card";
import { StatusAlert } from "@/components/ui/status-alert";

export function LoginForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setLoading(true);

        const callbackUrl = searchParams.get("next") || "/dashboard";

        const result = await signIn("credentials", {
            username,
            password,
            redirect: false,
            callbackUrl,
        });

        setLoading(false);

        if (!result || result.error) {
            setError("Neplatné přihlašovací údaje.");
            return;
        }

        router.push(result.url || callbackUrl);
        router.refresh();
    }

    return (
        <SectionCard
            title="Přihlášení do Portal Ops"
            titleAs="h1"
            headingClassName="h3"
            bodyClassName="p-4 p-md-5"
            headerClassName="mb-4"
        >
            <StatusAlert message={error} />

            <p className="ui-subtitle mb-4">
                Přihlášení odemyká interní konzoli pro správu guideů, typů
                obsahu a tagů. Demo účet: <strong>test</strong> /{" "}
                <strong>password123</strong>
            </p>

            <Form onSubmit={onSubmit}>
                <FormField controlId="username" label="Uživatelské jméno">
                    <Form.Control
                        type="text"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        required
                        minLength={2}
                    />
                </FormField>

                <FormField controlId="password" label="Heslo" className="mb-4">
                    <Form.Control
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        minLength={6}
                    />
                </FormField>

                <MinecraftButton
                    type="submit"
                    variant="primary"
                    block
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Spinner size="sm" className="me-2" />
                            Přihlašuji...
                        </>
                    ) : (
                        "Přihlásit"
                    )}
                </MinecraftButton>
            </Form>
        </SectionCard>
    );
}
