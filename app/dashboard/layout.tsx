import { getServerSession } from "next-auth";

import { LogoutButton } from "@/components/auth/logout-button";
import { DashboardSidebarNav } from "@/components/dashboard/dashboard-sidebar-nav";
import { authOptions } from "@/lib/auth";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);
    const username = session?.user?.name ?? "Unknown user";

    return (
        <div className="dashboard-shell">
            <aside className="dashboard-sidebar">
                <div className="dashboard-sidebar-card">
                    <div>
                        <p className="text-uppercase text-muted small fw-semibold mb-1">
                            Dashboard
                        </p>
                        <p className="text-dark fw-semibold mb-4">{username}</p>

                        <DashboardSidebarNav />
                    </div>

                    <div className="mt-auto d-grid">
                        <LogoutButton />
                    </div>
                </div>
            </aside>

            <main className="dashboard-main">{children}</main>
        </div>
    );
}
