import Link from "next/link";
import { Plus, FolderKanban, Sparkles, ArrowRight } from "lucide-react";

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            {/* Welcome section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Welcome back!</h1>
                    <p className="text-muted-foreground mt-1">
                        Create amazing AI-powered videos from your stories
                    </p>
                </div>
                <Link
                    href="/dashboard/projects/new"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    New Project
                </Link>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                    href="/dashboard/projects/new"
                    className="group p-6 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all"
                >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">Create New Story</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Start from scratch with our AI-powered story editor
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm text-primary">
                        Get started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                </Link>

                <Link
                    href="/dashboard/projects"
                    className="group p-6 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all"
                >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
                        <FolderKanban className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">View Projects</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Continue working on your existing projects
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm text-primary">
                        Browse projects <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                </Link>

                <div className="p-6 rounded-xl border border-dashed border-muted-foreground/25 bg-muted/50">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-4">
                        <Plus className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1 text-muted-foreground">Import Story</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Upload a document or paste text to get started
                    </p>
                    <span className="text-sm text-muted-foreground">Coming soon</span>
                </div>
            </div>

            {/* Recent projects placeholder */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Recent Projects</h2>
                    <Link
                        href="/dashboard/projects"
                        className="text-sm text-primary hover:underline"
                    >
                        View all
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Empty state */}
                    <div className="col-span-full p-12 rounded-xl border border-dashed border-muted-foreground/25 text-center">
                        <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="font-medium text-lg mb-2">No projects yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Create your first project to start generating amazing videos
                        </p>
                        <Link
                            href="/dashboard/projects/new"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Create Project
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
