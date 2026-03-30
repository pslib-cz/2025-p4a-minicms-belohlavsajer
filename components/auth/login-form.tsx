"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Form, Spinner } from "react-bootstrap";

import { FormField } from "@/components/ui/form-field";
import { SectionCard } from "@/components/ui/section-card";
import { StatusAlert } from "@/components/ui/status-alert";

export function LoginForm() {
    const [username, setUsername] = useState("test");
    const [password, setPassword] = useState("password123");
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
            setError("Neplatne prihlasovaci udaje.");
            return;
        }

        router.push(result.url || callbackUrl);
        router.refresh();
    }

    return (
        <SectionCard
            title="Prihlaseni do dashboardu"
            titleAs="h1"
            headingClassName="h3"
            bodyClassName="p-4 p-md-5"
            headerClassName="mb-4"
        >
            <StatusAlert message={error} />

            <Form onSubmit={onSubmit}>
                <FormField controlId="username" label="Uzivatelske jmeno">
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

                <Button
                    type="submit"
                    variant="dark"
                    className="w-100"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Spinner size="sm" className="me-2" />
                            Prihlasuji...
                        </>
                    ) : (
                        "Prihlasit"
                    )}
                </Button>
            </Form>
        </SectionCard>
    );
}
