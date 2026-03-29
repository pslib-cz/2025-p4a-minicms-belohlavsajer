"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
    return (
        <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => void signOut({ callbackUrl: "/login" })}
        >
            Odhlasit se
        </button>
    );
}
