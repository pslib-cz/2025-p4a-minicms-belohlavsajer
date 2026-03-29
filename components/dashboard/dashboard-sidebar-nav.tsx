"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
    href: string;
    label: string;
};

const navItems: NavItem[] = [
    {
        href: "/dashboard",
        label: "Články",
    },
    {
        href: "/dashboard/taxonomy",
        label: "Tagy a Kategorie",
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
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`dashboard-nav-link text-decoration-none ${
                            isActive ? "dashboard-nav-link-active" : ""
                        }`}
                        aria-current={isActive ? "page" : undefined}
                    >
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}
