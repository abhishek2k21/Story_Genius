"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Global Error:", error);
    }, [error]);

    return (
        <html>
            <body>
                <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-destructive" />
                        </div>
                        <h2 className="text-2xl font-bold">Something went wrong!</h2>
                        <p className="text-muted-foreground max-w-sm">
                            A critical error occurred. Please try again.
                        </p>
                        <button
                            onClick={() => reset()}
                            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
