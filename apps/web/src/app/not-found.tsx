import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
            <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold">Page Not Found</h2>
                <p className="text-muted-foreground max-w-sm">
                    The page you are looking for does not exist or has been moved.
                </p>
                <Link
                    href="/"
                    className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    Go Back Home
                </Link>
            </div>
        </div>
    );
}
