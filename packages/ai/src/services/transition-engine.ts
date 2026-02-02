/**
 * Intelligent Transition Engine
 * AI-powered scene transition analysis and selection
 */

import { generateWithGeminiPro } from "../clients/gemini";

export type TransitionType =
    | "cut"           // Hard cut
    | "fade"          // Fade to black
    | "crossfade"     // Dissolve between scenes
    | "wipe_left"     // Wipe left
    | "wipe_right"    // Wipe right
    | "wipe_up"       // Wipe up
    | "wipe_down"     // Wipe down
    | "zoom_in"       // Zoom into next scene
    | "zoom_out"      // Zoom out to reveal
    | "slide_left"    // Slide left
    | "slide_right"   // Slide right
    | "blur"          // Blur transition
    | "flash"         // White flash
    | "glitch";       // Glitch effect

export interface SceneInfo {
    id: string;
    content: string;
    mood: string;
    pacing: "slow" | "medium" | "fast";
    location?: string;
    timeOfDay?: string;
    characters?: string[];
    duration: number;
}

export interface TransitionRecommendation {
    fromSceneId: string;
    toSceneId: string;
    transitionType: TransitionType;
    duration: number; // in seconds
    timing: "early" | "on-beat" | "delayed";
    reason: string;
    motionContinuity: "high" | "medium" | "low";
}

const TRANSITION_ANALYSIS_PROMPT = `You are a professional video editor analyzing scene transitions.

Given two consecutive scenes, recommend the best transition:

SCENE A (ending):
{sceneA}

SCENE B (starting):
{sceneB}

Analyze:
1. Mood change between scenes
2. Location/time continuity
3. Pacing requirements
4. Emotional impact

Return a JSON object:
{
  "transitionType": "one of: cut, fade, crossfade, wipe_left, wipe_right, zoom_in, zoom_out, slide_left, slide_right, blur, flash, glitch",
  "duration": <number 0.3 to 2.0 seconds>,
  "timing": "early | on-beat | delayed",
  "reason": "Why this transition works best",
  "motionContinuity": "high | medium | low"
}

Respond ONLY with the JSON object.`;

/**
 * Analyze relationship between two scenes
 */
export async function analyzeSceneRelationship(
    sceneA: SceneInfo,
    sceneB: SceneInfo
): Promise<TransitionRecommendation> {
    const prompt = TRANSITION_ANALYSIS_PROMPT
        .replace("{sceneA}", JSON.stringify(sceneA, null, 2))
        .replace("{sceneB}", JSON.stringify(sceneB, null, 2));

    const response = await generateWithGeminiPro(prompt);

    try {
        const parsed = JSON.parse(response);
        return {
            fromSceneId: sceneA.id,
            toSceneId: sceneB.id,
            transitionType: parsed.transitionType || "crossfade",
            duration: parsed.duration || 0.5,
            timing: parsed.timing || "on-beat",
            reason: parsed.reason || "Default transition",
            motionContinuity: parsed.motionContinuity || "medium",
        };
    } catch (error) {
        // Fallback to intelligent defaults
        return getDefaultTransition(sceneA, sceneB);
    }
}

/**
 * Analyze all transitions for a sequence of scenes
 */
export async function analyzeAllTransitions(
    scenes: SceneInfo[]
): Promise<TransitionRecommendation[]> {
    const recommendations: TransitionRecommendation[] = [];

    for (let i = 0; i < scenes.length - 1; i++) {
        const transition = await analyzeSceneRelationship(scenes[i], scenes[i + 1]);
        recommendations.push(transition);
    }

    return recommendations;
}

/**
 * Get default transition based on scene properties
 */
function getDefaultTransition(
    sceneA: SceneInfo,
    sceneB: SceneInfo
): TransitionRecommendation {
    let transitionType: TransitionType = "crossfade";
    let duration = 0.5;

    // Same location = hard cut
    if (sceneA.location === sceneB.location) {
        transitionType = "cut";
        duration = 0;
    }
    // Different time of day = fade
    else if (sceneA.timeOfDay !== sceneB.timeOfDay) {
        transitionType = "fade";
        duration = 1.0;
    }
    // Fast pacing = quick cuts
    else if (sceneA.pacing === "fast" || sceneB.pacing === "fast") {
        transitionType = "cut";
        duration = 0;
    }
    // Mood shift = crossfade
    else if (sceneA.mood !== sceneB.mood) {
        transitionType = "crossfade";
        duration = 0.75;
    }

    return {
        fromSceneId: sceneA.id,
        toSceneId: sceneB.id,
        transitionType,
        duration,
        timing: "on-beat",
        reason: "Default heuristic transition",
        motionContinuity: "medium",
    };
}

/**
 * Optimize transition timing for the entire sequence
 */
export function optimizeTransitionTiming(
    transitions: TransitionRecommendation[],
    targetTotalDuration?: number
): TransitionRecommendation[] {
    // Calculate total transition time
    const totalTransitionTime = transitions.reduce((sum, t) => sum + t.duration, 0);

    // If we need to hit a target, adjust proportionally
    if (targetTotalDuration && totalTransitionTime > targetTotalDuration * 0.1) {
        const scaleFactor = (targetTotalDuration * 0.1) / totalTransitionTime;
        return transitions.map(t => ({
            ...t,
            duration: Math.max(0.2, t.duration * scaleFactor),
        }));
    }

    return transitions;
}

/**
 * Get FFmpeg filter string for a transition
 */
export function getTransitionFilter(type: TransitionType, duration: number): string {
    switch (type) {
        case "cut":
            return ""; // No filter needed
        case "fade":
            return `fade=t=out:d=${duration},fade=t=in:d=${duration}`;
        case "crossfade":
            return `xfade=transition=fade:duration=${duration}`;
        case "wipe_left":
            return `xfade=transition=wipeleft:duration=${duration}`;
        case "wipe_right":
            return `xfade=transition=wiperight:duration=${duration}`;
        case "wipe_up":
            return `xfade=transition=wipeup:duration=${duration}`;
        case "wipe_down":
            return `xfade=transition=wipedown:duration=${duration}`;
        case "zoom_in":
            return `xfade=transition=zoomin:duration=${duration}`;
        case "zoom_out":
            return `xfade=transition=slideup:duration=${duration}`;
        case "slide_left":
            return `xfade=transition=slideleft:duration=${duration}`;
        case "slide_right":
            return `xfade=transition=slideright:duration=${duration}`;
        case "blur":
            return `xfade=transition=smoothleft:duration=${duration}`;
        case "flash":
            return `xfade=transition=fadewhite:duration=${duration}`;
        case "glitch":
            return `xfade=transition=pixelize:duration=${duration}`;
        default:
            return `xfade=transition=fade:duration=${duration}`;
    }
}
