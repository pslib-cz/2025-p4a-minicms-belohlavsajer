import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <header className="border-bottom bg-white sticky-top">
                <div className="container py-3 d-flex justify-content-between align-items-center">
                    <div>
                        <Link
                            href="/"
                            className="fw-semibold text-decoration-none text-dark me-3"
                        >
                            Public web
                        </Link>
                        <span className="text-muted">Dashboard</span>
                    </div>
                    <LogoutButton />
                </div>
            </header>
            {children}
        </>
    );
}
