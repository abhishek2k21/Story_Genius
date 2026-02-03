
"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { X, Video, Download, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { VideoAnalysis } from "./video-result";

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    projectTitle: string;
    onExportComplete?: (analysis: VideoAnalysis) => void;
}

export function ExportModal({ isOpen, onClose, projectId, projectTitle, onExportComplete }: ExportModalProps) {
    const [resolution, setResolution] = useState("1080p");
    const [preset, setPreset] = useState("youtube");
    const [format, setFormat] = useState("mp4");
    const [isExporting, setIsExporting] = useState(false);
    const [exportStatus, setExportStatus] = useState<"idle" | "success" | "error">("idle");
    const [error, setError] = useState<string | null>(null);
    const { getToken } = useAuth();

    const handleExport = async () => {
        setIsExporting(true);
        setExportStatus("idle");
        setError(null);

        try {
            const token = await getToken();
            const response = await fetch(`/api/projects/${projectId}/export`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ resolution, preset, format }),
            });

            if (!response.ok) throw new Error("Failed to start export");

            setExportStatus("success");

            // Simulate processing time for demo smoothness, then show results
            setTimeout(() => {
                if (onExportComplete) {
                    onExportComplete({
                        engagementScore: 78,
                        engagementLabel: "High",
                        bestMoments: ["1:23", "2:45", "3:58"],
                        socialPotential: "Excellent for TikTok/Reels",
                        suggestions: [
                            "Adding subtitles would increase engagement by ~40%",
                            "Scene 4 could be 2s shorter without losing impact"
                        ]
                    });
                } else {
                    onClose();
                }
                setExportStatus("idle");
            }, 2000);
        } catch (err) {
            setExportStatus("error");
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsExporting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <Video className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold text-lg">Export Project</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded-md transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {exportStatus === "success" ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Export Started!</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    We're assembling your movie. You'll find it in the exports tab once finished.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Resolution</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {["1080p", "720p", "4k", "9:16"].map((res) => (
                                            <button
                                                key={res}
                                                onClick={() => setResolution(res)}
                                                className={cn(
                                                    "px-3 py-2 text-sm rounded-lg border transition-all",
                                                    resolution === res
                                                        ? "bg-primary border-primary text-primary-foreground"
                                                        : "border-border bg-muted/50 hover:bg-muted"
                                                )}
                                            >
                                                {res === "9:16" ? "9:16 (Vertical)" : res}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Export Preset</label>
                                    <select
                                        value={preset}
                                        onChange={(e) => setPreset(e.target.value)}
                                        className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="youtube">YouTube (Optimized)</option>
                                        <option value="tiktok">TikTok / Reels</option>
                                        <option value="generic">Generic (High Quality)</option>
                                    </select>
                                </div>
                            </div>

                            {exportStatus === "error" && (
                                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex gap-3 text-destructive">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p className="text-xs font-medium leading-relaxed">{error}</p>
                                </div>
                            )}

                            <button
                                onClick={handleExport}
                                disabled={isExporting}
                                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isExporting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Preparing...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" />
                                        Export Movie
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-muted/30 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                        Story-Genius Render Engine v1.0
                    </p>
                </div>
            </div>
        </div>
    );
}
