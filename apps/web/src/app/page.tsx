import Link from "next/link";
import { ArrowRight, Sparkles, Video, Brain, Eye } from "lucide-react";

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
            {/* Hero Section */}
            <main className="container mx-auto px-4 py-20">
                {/* Navigation */}
                <nav className="flex items-center justify-between mb-20">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-8 w-8 text-primary" />
                        <span className="text-2xl font-bold">Story-Genius</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/sign-in"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/sign-up"
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Get Started
                        </Link>
                    </div>
                </nav>

                {/* Hero Content */}
                <div className="text-center max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-8">
                        <Brain className="h-4 w-4" />
                        <span className="text-sm font-medium">AI That Thinks Before It Creates</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent animate-fade-in">
                        Transform Stories Into
                        <br />
                        Stunning Videos
                    </h1>

                    <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-slide-up">
                        Write your story. Watch AI understand it. See your vision come to life.
                        Full transparency, complete control, cinematic results.
                    </p>

                    <div className="flex items-center justify-center gap-4 animate-slide-up">
                        <Link
                            href="/sign-up"
                            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-all hover:gap-3"
                        >
                            Start Creating <ArrowRight className="h-5 w-5" />
                        </Link>
                        <Link
                            href="#features"
                            className="inline-flex items-center gap-2 border border-border px-6 py-3 rounded-lg font-medium hover:bg-muted transition-colors"
                        >
                            <Eye className="h-5 w-5" /> See How It Works
                        </Link>
                    </div>
                </div>

                {/* Feature Cards */}
                <div id="features" className="grid md:grid-cols-3 gap-6 mt-32">
                    <FeatureCard
                        icon={<Brain className="h-8 w-8" />}
                        title="AI Thinking Pipeline"
                        description="Watch AI understand your story, plan scenes, and make intelligent decisions before generating."
                    />
                    <FeatureCard
                        icon={<Video className="h-8 w-8" />}
                        title="Cinematic Generation"
                        description="Full narrative video generation with consistent characters, intelligent transitions, and professional quality."
                    />
                    <FeatureCard
                        icon={<Sparkles className="h-8 w-8" />}
                        title="Creative Control"
                        description="You're the creative director. Choose from options at every step. Edit, regenerate, and perfect."
                    />
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-border py-8 mt-20">
                <div className="container mx-auto px-4 text-center text-muted-foreground">
                    <p>&copy; 2024 Story-Genius. AI-Powered Storytelling.</p>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all">
            <div className="text-primary mb-4 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </div>
    );
}
