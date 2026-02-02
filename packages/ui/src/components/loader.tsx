import * as React from "react";
import { cn } from "../utils/cn";

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: "sm" | "md" | "lg";
}

const Loader = React.forwardRef<HTMLDivElement, LoaderProps>(
    ({ className, size = "md", ...props }, ref) => {
        const sizeClasses = {
            sm: "h-4 w-4 border-2",
            md: "h-8 w-8 border-2",
            lg: "h-12 w-12 border-3",
        };

        return (
            <div
                ref={ref}
                className={cn(
                    "animate-spin rounded-full border-primary border-t-transparent",
                    sizeClasses[size],
                    className
                )}
                {...props}
            />
        );
    }
);
Loader.displayName = "Loader";

const LoadingOverlay = ({ text = "Loading..." }: { text?: string }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
            <Loader size="lg" />
            <p className="text-muted-foreground">{text}</p>
        </div>
    </div>
);

export { Loader, LoadingOverlay };
