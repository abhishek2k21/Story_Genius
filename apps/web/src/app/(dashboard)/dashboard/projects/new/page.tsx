"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";

const genres = [
    { id: "fantasy", name: "Fantasy", emoji: "🧙" },
    { id: "scifi", name: "Sci-Fi", emoji: "🚀" },
    { id: "horror", name: "Horror", emoji: "👻" },
    { id: "romance", name: "Romance", emoji: "💕" },
    { id: "thriller", name: "Thriller", emoji: "🔪" },
    { id: "comedy", name: "Comedy", emoji: "😂" },
    { id: "drama", name: "Drama", emoji: "🎭" },
    { id: "action", name: "Action", emoji: "💥" },
];

export default function NewProjectPage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            setError("Please enter a project title");
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/projects`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // TODO: Add auth token from Clerk
                },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim() || undefined,
                    settings: {
                        genre: selectedGenre,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to create project");
            }

            const data = await response.json();
            router.push(`/dashboard/projects/${data.project.id}`);
        } catch (err) {
            setError("Failed to create project. Please try again.");
            setIsCreating(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Back button */}
            <Link
                href="/dashboard/projects"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Projects
            </Link>

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Create New Project</h1>
                <p className="text-muted-foreground">
                    Start a new story-to-video project. You can always edit these details later.
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium mb-2">
                        Project Title *
                    </label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="The Dragon's Quest..."
                        className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        disabled={isCreating}
                    />
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-2">
                        Description
                    </label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="A brief summary of your story..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                        disabled={isCreating}
                    />
                </div>

                {/* Genre selection */}
                <div>
                    <label className="block text-sm font-medium mb-3">
                        Genre (optional)
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {genres.map((genre) => (
                            <button
                                key={genre.id}
                                type="button"
                                onClick={() => setSelectedGenre(
                                    selectedGenre === genre.id ? null : genre.id
                                )}
                                className={`p-3 rounded-lg border text-center transition-all ${selectedGenre === genre.id
                                        ? "border-primary bg-primary/10"
                                        : "border-input hover:border-primary/50"
                                    }`}
                                disabled={isCreating}
                            >
                                <span className="text-2xl block mb-1">{genre.emoji}</span>
                                <span className="text-xs">{genre.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Error message */}
                {error && (
                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                        {error}
                    </div>
                )}

                {/* Submit button */}
                <div className="flex items-center gap-4 pt-4">
                    <button
                        type="submit"
                        disabled={isCreating}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isCreating ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                Create Project
                            </>
                        )}
                    </button>
                    <Link
                        href="/dashboard/projects"
                        className="px-6 py-3 rounded-lg border border-input hover:bg-muted transition-colors"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}
