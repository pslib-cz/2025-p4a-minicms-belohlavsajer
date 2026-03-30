import { LogoutButton } from "@/components/auth/logout-button";
import { DashboardSidebarNav } from "@/components/dashboard/dashboard-sidebar-nav";
import { getOptionalServerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getOptionalServerSession();
    const username = session?.user?.name ?? "Unknown user";

    return (
        <div className="dashboard-shell">
            <aside className="dashboard-sidebar">
                <div className="dashboard-sidebar-card">
                    <div>
                        <p className="text-uppercase dashboard-shell-label mb-1">
                            Portal Ops
                        </p>
                        <p className="dashboard-shell-brand mb-1">
                            Minecraft Portal
                        </p>
                        <p className="dashboard-username mb-4">{username}</p>

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
