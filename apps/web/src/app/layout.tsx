import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "../components/providers/theme-provider";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
});

export const metadata: Metadata = {
    title: "Story-Genius | AI That Thinks Before It Creates",
    description:
        "Transform your stories into stunning videos with AI that plans, reviews, and creates with intelligence.",
    keywords: ["AI", "video generation", "storytelling", "text-to-video", "creative AI"],
    authors: [{ name: "Story-Genius Team" }],
    openGraph: {
        title: "Story-Genius",
        description: "AI-powered story to video generation",
        type: "website",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    console.log("RootLayout rendering");
    return (
        <ClerkProvider>
            <html lang="en" suppressHydrationWarning>
                <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="dark"
                        enableSystem
                        disableTransitionOnChange
                    >
                        {children}
                    </ThemeProvider>
                </body>
            </html>
        </ClerkProvider>
    );
}
