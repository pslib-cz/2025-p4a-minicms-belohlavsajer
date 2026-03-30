"use client";

import { signOut } from "next-auth/react";
import { MinecraftButton } from "@/components/ui/minecraft-button";

export function LogoutButton() {
    return (
        <MinecraftButton
            type="button"
            variant="secondary"
            onClick={() => void signOut({ callbackUrl: "/login" })}
        >
            Odhlásit se
        </MinecraftButton>
    );
}
