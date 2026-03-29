"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Button, Card, Form, Spinner } from "react-bootstrap";

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
        <Card className="ui-card">
            <Card.Body className="p-4 p-md-5">
                <h1 className="h3 mb-4 ui-title">Prihlaseni do dashboardu</h1>

                {error ? <Alert variant="danger">{error}</Alert> : null}

                <Form onSubmit={onSubmit}>
                    <Form.Group className="mb-3" controlId="username">
                        <Form.Label>Uzivatelske jmeno</Form.Label>
                        <Form.Control
                            type="text"
                            value={username}
                            onChange={(event) =>
                                setUsername(event.target.value)
                            }
                            required
                            minLength={2}
                        />
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="password">
                        <Form.Label>Heslo</Form.Label>
                        <Form.Control
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            required
                            minLength={6}
                        />
                    </Form.Group>

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
            </Card.Body>
        </Card>
    );
}
