import Link from "next/link";
import { Plus, Search, Grid, List, MoreVertical, Clock } from "lucide-react";

export default function ProjectsPage() {
    // TODO: Fetch projects from API
    const projects: any[] = [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Projects</h1>
                    <p className="text-muted-foreground">
                        Manage your story-to-video projects
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

            {/* Filters and search */}
            <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
                <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
                    <button className="p-2 rounded-md bg-background shadow-sm">
                        <Grid className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-md text-muted-foreground hover:text-foreground">
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Projects grid */}
            {projects.length === 0 ? (
                <div className="p-12 rounded-xl border border-dashed border-muted-foreground/25 text-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                        <Plus className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium text-lg mb-2">No projects yet</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                        Create your first project to start transforming your stories into stunning AI-generated videos
                    </p>
                    <Link
                        href="/dashboard/projects/new"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Create Your First Project
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((project) => (
                        <Link
                            key={project.id}
                            href={`/dashboard/projects/${project.id}`}
                            className="group p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all"
                        >
                            {/* Thumbnail */}
                            <div className="aspect-video rounded-lg bg-muted mb-4 overflow-hidden">
                                {project.coverImageUrl ? (
                                    <img
                                        src={project.coverImageUrl}
                                        alt={project.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-4xl">{project.title[0]}</span>
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex items-start justify-between">
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-medium truncate">{project.title}</h3>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                        <Clock className="w-3 h-3" />
                                        Updated {new Date(project.updatedAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <button
                                    className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
                                    onClick={(e) => e.preventDefault()}
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
