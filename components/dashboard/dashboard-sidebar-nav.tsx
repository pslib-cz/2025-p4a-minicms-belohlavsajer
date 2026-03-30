"use client";

import { usePathname } from "next/navigation";
import { MinecraftLinkButton } from "@/components/ui/minecraft-button";

type NavItem = {
    href: string;
    label: string;
};

const navItems: NavItem[] = [
    {
        href: "/dashboard",
        label: "Guides",
    },
    {
        href: "/dashboard/taxonomy",
        label: "Tagy a typy",
    },
];

function isActivePath(pathname: string, href: string): boolean {
    if (href === "/dashboard") {
        return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardSidebarNav() {
    const pathname = usePathname();

    return (
        <nav className="nav flex-column gap-2 mb-4">
            {navItems.map((item) => {
                const isActive = isActivePath(pathname, item.href);

                return (
                    <MinecraftLinkButton
                        key={item.href}
                        href={item.href}
                        variant={isActive ? "primary" : "secondary"}
                        block
                        small
                        className={`dashboard-nav-link ${
                            isActive ? "dashboard-nav-link-active" : ""
                        }`}
                        aria-current={isActive ? "page" : undefined}
                    >
                        {item.label}
                    </MinecraftLinkButton>
                );
            })}
        </nav>
    );
}
