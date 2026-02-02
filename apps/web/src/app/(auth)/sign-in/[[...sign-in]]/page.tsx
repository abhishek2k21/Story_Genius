import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
            <div className="w-full max-w-md">
                <SignIn
                    appearance={{
                        elements: {
                            rootBox: "mx-auto",
                            card: "bg-card border border-border shadow-2xl",
                            headerTitle: "text-foreground",
                            headerSubtitle: "text-muted-foreground",
                            socialButtonsBlockButton: "bg-muted hover:bg-muted/80 border-border",
                            formFieldLabel: "text-foreground",
                            formFieldInput: "bg-background border-input",
                            footerActionLink: "text-primary hover:text-primary/80",
                        },
                    }}
                />
            </div>
        </div>
    );
}
