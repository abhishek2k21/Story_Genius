"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
    ArrowLeft,
    Download,
    Upload,
    Settings,
    Save,
    MoreHorizontal,
    Trash2,
    Copy,
    Film,
    FileText as EditIcon
} from "lucide-react";
import { TipTapEditor, ChapterManager, ImportDialog } from "@/components/editor";
import { SceneList } from "@/components/scenes/scene-list";
import {
    ExportModal,
    VideoResult,
    type VideoAnalysis,
    AnalysisThinking,
    AnalysisResults,
    VisualCustomizer,
    PreviewGenerator,
    GenerationDashboard
} from "@/components/projects";
import { cn } from "@/lib/utils";

interface Project {
    id: string;
    title: string;
    description: string | null;
    genre: string | null;
    wordCount: number;
}

interface Chapter {
    id: string;
    title: string;
    content: string;
    order: number;
    wordCount: number;
}

export default function ProjectEditorPage() {
    const params = useParams();
    const router = useRouter();
    const { getToken } = useAuth();
    const projectId = params.projectId as string;

    const [project, setProject] = useState<Project | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showVideoResult, setShowVideoResult] = useState(false);
    const [videoAnalysis, setVideoAnalysis] = useState<VideoAnalysis | null>(null);
    const [showMenu, setShowMenu] = useState(false);
    const [viewMode, setViewMode] = useState<"write" | "analysis" | "results" | "studio" | "visuals" | "preview" | "generating">("write");

    // Fetch project and chapters
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = await getToken();
                // Fetch project
                const projectRes = await fetch(`/api/projects/${projectId}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (projectRes.ok) {
                    const { project: projectData } = await projectRes.json();
                    setProject(projectData);
                }

                // Fetch chapters
                const chaptersRes = await fetch(`/api/projects/${projectId}/chapters`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (chaptersRes.ok) {
                    const { chapters: chaptersData } = await chaptersRes.json();
                    setChapters(chaptersData);
                    if (chaptersData.length > 0 && !activeChapterId) {
                        setActiveChapterId(chaptersData[0].id);
                    }
                }
            } catch (error) {
                console.error("Error fetching project data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [projectId, activeChapterId]);

    const activeChapter = chapters.find((c) => c.id === activeChapterId);

    // Handle chapter content update
    const handleContentUpdate = useCallback(async (content: string) => {
        if (!activeChapterId) return;

        try {
            const token = await getToken();
            await fetch(`/api/chapters/${activeChapterId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ content }),
            });

            setChapters((prev) =>
                prev.map((c) =>
                    c.id === activeChapterId
                        ? { ...c, content, wordCount: content.split(/\s+/).filter(Boolean).length }
                        : c
                )
            );
        } catch (error) {
            console.error("Error saving chapter:", error);
        }
    }, [activeChapterId]);

    // Handle word count change
    const handleWordCountChange = useCallback((count: number) => {
        setChapters((prev) =>
            prev.map((c) =>
                c.id === activeChapterId ? { ...c, wordCount: count } : c
            )
        );
    }, [activeChapterId]);

    // Add new chapter
    const handleAddChapter = async () => {
        try {
            const token = await getToken();
            const res = await fetch(`/api/projects/${projectId}/chapters`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ title: `Chapter ${chapters.length + 1}` }),
            });

            if (res.ok) {
                const { chapter } = await res.json();
                setChapters((prev) => [...prev, chapter]);
                setActiveChapterId(chapter.id);
            }
        } catch (error) {
            console.error("Error adding chapter:", error);
        }
    };

    // Rename chapter
    const handleRenameChapter = async (id: string, title: string) => {
        try {
            const token = await getToken();
            await fetch(`/api/chapters/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ title }),
            });

            setChapters((prev) =>
                prev.map((c) => (c.id === id ? { ...c, title } : c))
            );
        } catch (error) {
            console.error("Error renaming chapter:", error);
        }
    };

    // Delete chapter
    const handleDeleteChapter = async (id: string) => {
        try {
            const token = await getToken();
            await fetch(`/api/chapters/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            const newChapters = chapters.filter((c) => c.id !== id);
            setChapters(newChapters);

            if (activeChapterId === id) {
                setActiveChapterId(newChapters[0]?.id || null);
            }
        } catch (error) {
            console.error("Error deleting chapter:", error);
        }
    };

    // Reorder chapters
    const handleReorderChapters = async (newChapters: Chapter[]) => {
        setChapters(newChapters);

        try {
            const token = await getToken();
            await fetch("/api/chapters/reorder", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    chapters: newChapters.map((c) => ({ id: c.id, order: c.order })),
                }),
            });
        } catch (error) {
            console.error("Error reordering chapters:", error);
        }
    };

    // Handle import
    const handleImport = async (content: string, source: string) => {
        if (activeChapterId) {
            await handleContentUpdate(content);
        } else {
            // Create new chapter with imported content
            try {
                const token = await getToken();
                const res = await fetch(`/api/projects/${projectId}/chapters`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title: source.startsWith("url:") ? source.slice(4) : "Imported Content",
                        content,
                    }),
                });

                if (res.ok) {
                    const { chapter } = await res.json();
                    setChapters((prev) => [...prev, chapter]);
                    setActiveChapterId(chapter.id);
                }
            } catch (error) {
                console.error("Error creating chapter from import:", error);
            }
        }
    };

    // Delete project
    const handleDeleteProject = async () => {
        if (!confirm("Are you sure you want to delete this project?")) return;

        try {
            const token = await getToken();
            await fetch(`/api/projects/${projectId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            router.push("/dashboard/projects");
        } catch (error) {
            console.error("Error deleting project:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <h2 className="text-xl font-semibold mb-2">Project not found</h2>
                <button
                    onClick={() => router.push("/dashboard/projects")}
                    className="text-primary hover:underline"
                >
                    Back to projects
                </button>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar - Chapter Manager */}
            <div className="w-64 shrink-0">
                <ChapterManager
                    chapters={chapters}
                    activeChapterId={activeChapterId || undefined}
                    onChapterSelect={setActiveChapterId}
                    onChapterAdd={handleAddChapter}
                    onChapterRename={handleRenameChapter}
                    onChapterDelete={handleDeleteChapter}
                    onChaptersReorder={handleReorderChapters}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push("/dashboard/projects")}
                            className="p-2 hover:bg-muted rounded-md transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div>
                            <h1 className="font-semibold">{project.title}</h1>
                            {project.genre && (
                                <span className="text-xs text-muted-foreground capitalize">
                                    {project.genre}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex bg-muted p-1 rounded-lg mr-2">
                            <button
                                onClick={() => setViewMode("write")}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all",
                                    viewMode === "write"
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <EditIcon className="w-3.5 h-3.5" />
                                Write
                            </button>
                            <button
                                onClick={() => setViewMode("studio")}
                                disabled={viewMode !== "write" && viewMode !== "studio"}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all",
                                    viewMode === "studio"
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Film className="w-3.5 h-3.5" />
                                Studio
                            </button>
                        </div>

                        {viewMode === "write" && (
                            <button
                                onClick={() => setViewMode("analysis")}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-md hover:shadow-lg hover:shadow-indigo-500/20 transition-all"
                            >
                                <Film className="w-3.5 h-3.5" />
                                Generate Video
                            </button>
                        )}

                        <button
                            onClick={() => setShowImportDialog(true)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted rounded-md transition-colors"
                        >
                            <Upload className="w-4 h-4" />
                            Import
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-2 hover:bg-muted rounded-md transition-colors"
                            >
                                <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {showMenu && (
                                <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[160px]">
                                    <button className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted text-left">
                                        <Settings className="w-4 h-4" />
                                        Settings
                                    </button>
                                    <button className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted text-left">
                                        <Copy className="w-4 h-4" />
                                        Duplicate
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowExportModal(true);
                                            setShowMenu(false);
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted text-left"
                                    >
                                        <Download className="w-4 h-4" />
                                        Export
                                    </button>
                                    <hr className="my-1 border-border" />
                                    <button
                                        onClick={handleDeleteProject}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted text-destructive text-left"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Editor / Studio */}
                <div className="flex-1 overflow-hidden p-4">
                    {viewMode === "write" ? (
                        activeChapter ? (
                            <TipTapEditor
                                content={activeChapter.content || ""}
                                onUpdate={handleContentUpdate}
                                onWordCountChange={handleWordCountChange}
                                placeholder={`Start writing ${activeChapter.title}...`}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <p className="text-muted-foreground mb-4">
                                    No chapter selected. Create a new chapter to start writing.
                                </p>
                                <button
                                    onClick={handleAddChapter}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    Add First Chapter
                                </button>
                            </div>
                        )
                    ) : viewMode === "analysis" ? (
                        <AnalysisThinking onComplete={() => setViewMode("results")} />
                    ) : viewMode === "results" ? (
                        <AnalysisResults
                            onConfirm={() => setViewMode("studio")}
                            onReanalyze={() => setViewMode("analysis")}
                        />
                    ) : viewMode === "visuals" ? (
                        <VisualCustomizer
                            onBack={() => setViewMode("studio")}
                            onNext={() => setViewMode("preview")}
                        />
                    ) : viewMode === "preview" ? (
                        <PreviewGenerator
                            onBack={() => setViewMode("visuals")}
                            onGenerate={() => setViewMode("generating")}
                        />
                    ) : viewMode === "generating" ? (
                        <GenerationDashboard
                            onComplete={() => {
                                setVideoAnalysis({
                                    engagementScore: 78,
                                    engagementLabel: "High",
                                    bestMoments: ["1:23", "2:45", "3:58"],
                                    socialPotential: "Excellent for TikTok/Reels",
                                    suggestions: [
                                        "Adding subtitles would increase engagement by ~40%",
                                        "Scene 4 could be 2s shorter without losing impact"
                                    ]
                                });
                                setShowVideoResult(true);
                                setViewMode("studio"); // Return to studio behind the overlay
                            }}
                        />
                    ) : (
                        <div className="h-full flex flex-col">
                            <div className="flex-1 overflow-y-auto">
                                <SceneList
                                    projectId={projectId}
                                    storyContent={chapters.map(c => `Chapter: ${c.title}\n${c.content}`).join("\n\n")}
                                />
                            </div>
                            {/* Studio Mode Footer Actions */}
                            <div className="p-4 border-t border-border bg-background flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                    {chapters.length} chapters • {chapters.reduce((acc, c) => acc + c.wordCount, 0)} words
                                </span>
                                <button
                                    onClick={() => setViewMode("visuals")}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    Customize Visuals
                                    <ArrowLeft className="w-4 h-4 rotate-180" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Export Modal */}
            <ExportModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                projectId={projectId}
                projectTitle={project.title}
                onExportComplete={(analysis) => {
                    setShowExportModal(false);
                    setVideoAnalysis(analysis);
                    setShowVideoResult(true);
                }}
            />

            {/* Video Result Overlay */}
            {showVideoResult && videoAnalysis && (
                <div className="fixed inset-0 z-50 bg-background">
                    <VideoResult
                        analysis={videoAnalysis}
                        onClose={() => setShowVideoResult(false)}
                        onEditScenes={() => {
                            setShowVideoResult(false);
                            setViewMode("studio");
                        }}
                        onAddSubtitles={() => {
                            setShowVideoResult(false);
                            setViewMode("studio");
                            // In real app, would focus specific subtitle field
                        }}
                        onChangeMusic={() => {
                            setShowVideoResult(false);
                            setViewMode("studio");
                        }}
                        onExport={(format) => {
                            // Already exported, but allows re-download
                            console.log(`Downloading ${format}...`);
                        }}
                    />
                </div>
            )}

            {/* Import Dialog */}
            <ImportDialog
                isOpen={showImportDialog}
                onClose={() => setShowImportDialog(false)}
                onImport={handleImport}
            />
        </div>
    );
}
