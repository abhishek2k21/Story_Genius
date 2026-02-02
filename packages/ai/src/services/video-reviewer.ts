export interface ReviewResult {
    score: number; // 0-100
    engagementLabel: "High" | "Medium" | "Low";
    bestMoments: string[];
    socialPotential: string;
    issues: string[];
    suggestions: string[];
}

export class VideoReviewer {
    /**
     * Analyze assembly for potential issues
     * (Mock implementation as real analysis needs deep learning models)
     */
    async reviewAssembly(
        duration: number,
        sceneCount: number,
        hasAudio: boolean
    ): Promise<ReviewResult> {
        const issues: string[] = [];
        const suggestions: string[] = [];
        let score = 100;

        if (!hasAudio) {
            issues.push("Video has no audio track");
            score -= 30;
        }

        if (sceneCount < 3 && duration > 30) {
            issues.push("Pacing might be too slow (few scenes for long duration)");
            suggestions.push("Consider breaking down scenes further to improve pacing");
            score -= 10;
        }

        if (sceneCount > 20 && duration < 60) {
            issues.push("Pacing might be too fast (many scenes for short duration)");
            suggestions.push("Ensure each scene has enough time to register");
            score -= 10;
        }

        if (score < 70) suggestions.push("Adding subtitles would increase engagement by ~40%");

        // Mocking sophisticated analysis for now
        const bestMoments = [
            Math.floor(duration * 0.2),
            Math.floor(duration * 0.5),
            Math.floor(duration * 0.8)
        ].map(s => {
            const min = Math.floor(s / 60);
            const sec = s % 60;
            return `${min}:${sec.toString().padStart(2, '0')}`;
        });

        return {
            score: Math.max(0, score),
            engagementLabel: score > 80 ? "High" : score > 50 ? "Medium" : "Low",
            bestMoments,
            socialPotential: score > 80 ? "Excellent for TikTok/Reels" : "Good for Story/Posts",
            issues,
            suggestions,
        };
    }
}

export const videoReviewer = new VideoReviewer();
