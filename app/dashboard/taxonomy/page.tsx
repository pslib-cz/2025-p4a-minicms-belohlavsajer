import { redirect } from "next/navigation";

import { TaxonomyManagementClient } from "@/components/dashboard/taxonomy-management-client";
import { getOptionalServerSession } from "@/lib/auth";

export default async function DashboardTaxonomyPage() {
    const session = await getOptionalServerSession();

    if (!session?.user?.id) {
        redirect("/login?next=/dashboard/taxonomy");
    }

    return <TaxonomyManagementClient />;
}
