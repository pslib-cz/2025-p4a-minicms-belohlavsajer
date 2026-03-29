import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";

export async function requireUserId(): Promise<number | NextResponse> {
    const session = await getServerSession(authOptions);
    const userId = Number.parseInt(session?.user?.id ?? "", 10);

    if (!session?.user?.id || Number.isNaN(userId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return userId;
}
