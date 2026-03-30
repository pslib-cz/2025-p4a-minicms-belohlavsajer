import { redirect } from "next/navigation";

import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getOptionalServerSession } from "@/lib/auth";

export default async function DashboardPage() {
    const session = await getOptionalServerSession();

    if (!session?.user?.id) {
        redirect("/login?next=/dashboard");
    }

    return <DashboardClient />;
}
