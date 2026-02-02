import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Sidebar, Header } from "@/components/layout";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <div className="relative">
                <Sidebar />
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
