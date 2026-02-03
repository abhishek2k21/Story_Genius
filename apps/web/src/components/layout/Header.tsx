"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { UserButton } from "@clerk/nextjs";
import { useState, useEffect } from "react";

// Generate breadcrumbs from pathname
function generateBreadcrumbs(pathname: string) {
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs = [];

    let currentPath = "";
    for (const segment of segments) {
        currentPath += `/${segment}`;
        breadcrumbs.push({
            name: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " "),
            href: currentPath,
        });
    }

    return breadcrumbs;
}

export function Header() {
    const pathname = usePathname();
    const breadcrumbs = generateBreadcrumbs(pathname);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm">
                {breadcrumbs.map((crumb, index) => (
                    <div key={crumb.href} className="flex items-center gap-2">
                        {index > 0 && (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        {index === breadcrumbs.length - 1 ? (
                            <span className="font-medium text-foreground">
                                {crumb.name}
                            </span>
                        ) : (
                            <Link
                                href={crumb.href}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {crumb.name}
                            </Link>
                        )}
                    </div>
                ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-4">
                {/* Credits indicator - placeholder */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm">
                    <span className="text-muted-foreground">Credits:</span>
                    <span className="font-medium">100</span>
                </div>

                {/* Theme toggle */}
                <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    aria-label="Toggle theme"
                >
                    {mounted ? (
                        theme === "dark" ? (
                            <Sun className="w-5 h-5" />
                        ) : (
                            <Moon className="w-5 h-5" />
                        )
                    ) : (
                        <div className="w-5 h-5" /> // Placeholder matching size
                    )}
                </button>

                {/* User button */}
                <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                        elements: {
                            avatarBox: "w-8 h-8",
                        },
                    }}
                />
            </div>
        </header>
    );
}
