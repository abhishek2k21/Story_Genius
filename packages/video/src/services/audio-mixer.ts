/**
 * Audio Mixer Service
 * Multi-track audio mixing with ducking and normalization
 */

import ffmpeg from "fluent-ffmpeg";

export interface AudioTrack {
    id: string;
    path: string;
    type: "narration" | "music" | "sfx";
    startTime: number; // seconds
    endTime?: number;
    volume: number; // 0.0 to 1.0
    pan?: number; // -1.0 (left) to 1.0 (right)
    fadeIn?: number; // seconds
    fadeOut?: number; // seconds
}

export interface DuckingConfig {
    targetTrackType: "music"; // Track to duck
    triggerTrackType: "narration"; // Track that triggers ducking
    duckLevel: number; // Target volume during duck (0.0 to 1.0)
    attackTime: number; // How fast to duck (seconds)
    releaseTime: number; // How fast to return (seconds)
}

export interface AudioMixConfig {
    tracks: AudioTrack[];
    ducking?: DuckingConfig;
    masterVolume: number;
    normalize: boolean;
    targetLoudness?: number; // LUFS for normalization
    outputFormat: "mp3" | "aac" | "wav";
}

export interface MixResult {
    outputPath: string;
    duration: number;
    peakLevel: number;
    avgLoudness: number;
}

/**
 * Default ducking configuration for narration over music
 */
export const DEFAULT_DUCKING: DuckingConfig = {
    targetTrackType: "music",
    triggerTrackType: "narration",
    duckLevel: 0.3, // Lower music to 30%
    attackTime: 0.3,
    releaseTime: 0.5,
};

/**
 * Create audio mix from multiple tracks
 */
export async function mixAudioTracks(
    config: AudioMixConfig,
    outputPath: string
): Promise<MixResult> {
    return new Promise((resolve, reject) => {
        if (config.tracks.length === 0) {
            reject(new Error("No audio tracks provided"));
            return;
        }

        let command = ffmpeg();

        // Add all input tracks
        config.tracks.forEach(track => {
            command = command.input(track.path);
        });

        // Build complex filter graph
        const filterParts: string[] = [];
        const processedLabels: string[] = [];

        config.tracks.forEach((track, i) => {
            let filter = `[${i}:a]`;
            const label = `[a${i}]`;

            // Apply volume
            filter += `volume=${track.volume}`;

            // Apply timing (delay)
            if (track.startTime > 0) {
                filter += `,adelay=${Math.round(track.startTime * 1000)}|${Math.round(track.startTime * 1000)}`;
            }

            // Apply fades
            if (track.fadeIn && track.fadeIn > 0) {
                filter += `,afade=t=in:d=${track.fadeIn}`;
            }
            if (track.fadeOut && track.fadeOut > 0) {
                filter += `,afade=t=out:d=${track.fadeOut}`;
            }

            // Apply pan
            if (track.pan !== undefined && track.pan !== 0) {
                const leftVol = track.pan < 0 ? 1 : 1 - track.pan;
                const rightVol = track.pan > 0 ? 1 : 1 + track.pan;
                filter += `,pan=stereo|c0=${leftVol}*c0|c1=${rightVol}*c1`;
            }

            filter += label;
            filterParts.push(filter);
            processedLabels.push(label);
        });

        // Mix all tracks together
        const mixInputs = processedLabels.join("");

        if (config.ducking) {
            // Apply sidechain ducking
            // Find trigger and target tracks
            const triggerIdx = config.tracks.findIndex(t => t.type === config.ducking!.triggerTrackType);
            const targetIdx = config.tracks.findIndex(t => t.type === config.ducking!.targetTrackType);

            if (triggerIdx >= 0 && targetIdx >= 0) {
                // Use sidechaincompress for ducking
                filterParts.push(
                    `[a${targetIdx}][a${triggerIdx}]sidechaincompress=threshold=0.01:ratio=4:attack=${config.ducking.attackTime}:release=${config.ducking.releaseTime}:level_in=${config.ducking.duckLevel}[ducked]`
                );

                // Mix ducked music with other tracks
                const otherLabels = processedLabels.filter((_, i) => i !== targetIdx);
                filterParts.push(
                    `[ducked]${otherLabels.join("")}amix=inputs=${processedLabels.length}:duration=longest[mixed]`
                );
            } else {
                // No ducking needed, just mix
                filterParts.push(
                    `${mixInputs}amix=inputs=${config.tracks.length}:duration=longest[mixed]`
                );
            }
        } else {
            // Simple mix without ducking
            filterParts.push(
                `${mixInputs}amix=inputs=${config.tracks.length}:duration=longest[mixed]`
            );
        }

        // Apply master volume
        filterParts.push(`[mixed]volume=${config.masterVolume}[mastered]`);

        // Apply normalization if requested
        if (config.normalize) {
            const targetLoudness = config.targetLoudness || -16; // Default to -16 LUFS
            filterParts.push(
                `[mastered]loudnorm=I=${targetLoudness}:TP=-1.5:LRA=11[final]`
            );
        } else {
            filterParts.push(`[mastered]acopy[final]`);
        }

        // Audio codec based on format
        const audioCodecs: Record<string, string> = {
            mp3: "libmp3lame",
            aac: "aac",
            wav: "pcm_s16le",
        };

        command
            .complexFilter(filterParts.join(";"))
            .outputOptions([
                "-map", "[final]",
                "-c:a", audioCodecs[config.outputFormat],
            ])
            .output(outputPath)
            .on("end", () => {
                resolve({
                    outputPath,
                    duration: 0, // Would need ffprobe to get actual duration
                    peakLevel: 0,
                    avgLoudness: config.targetLoudness || -16,
                });
            })
            .on("error", reject)
            .run();
    });
}

/**
 * Analyze audio levels
 */
export async function analyzeAudioLevels(audioPath: string): Promise<{
    peakLevel: number;
    avgLoudness: number;
    truePeak: number;
}> {
    return new Promise((resolve, reject) => {
        ffmpeg(audioPath)
            .audioFilters("loudnorm=print_format=json")
            .format("null")
            .output("-")
            .on("stderr", (stderrLine) => {
                // Parse loudnorm output
                if (stderrLine.includes("input_i")) {
                    try {
                        // Extract JSON from output
                        const match = stderrLine.match(/\{[\s\S]*\}/);
                        if (match) {
                            const data = JSON.parse(match[0]);
                            resolve({
                                peakLevel: parseFloat(data.input_tp) || 0,
                                avgLoudness: parseFloat(data.input_i) || -23,
                                truePeak: parseFloat(data.input_tp) || 0,
                            });
                        }
                    } catch (e) {
                        // Continue parsing
                    }
                }
            })
            .on("error", reject)
            .on("end", () => {
                // Fallback if no loudnorm data parsed
                resolve({
                    peakLevel: -1,
                    avgLoudness: -16,
                    truePeak: -1,
                });
            })
            .run();
    });
}

/**
 * Apply ducking to music track based on narration
 */
export async function applyDucking(
    musicPath: string,
    narrationPath: string,
    outputPath: string,
    duckLevel: number = 0.3
): Promise<void> {
    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(musicPath)
            .input(narrationPath)
            .complexFilter([
                `[0:a][1:a]sidechaincompress=threshold=0.01:ratio=4:attack=0.3:release=0.5:level_in=${duckLevel}[ducked]`,
                `[ducked][1:a]amix=inputs=2:duration=first[out]`,
            ])
            .outputOptions(["-map", "[out]"])
            .output(outputPath)
            .on("end", () => resolve())
            .on("error", reject)
            .run();
    });
}

/**
 * Normalize audio to target loudness
 */
export async function normalizeAudio(
    inputPath: string,
    outputPath: string,
    targetLUFS: number = -16
): Promise<void> {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .audioFilters(`loudnorm=I=${targetLUFS}:TP=-1.5:LRA=11`)
            .output(outputPath)
            .on("end", () => resolve())
            .on("error", reject)
            .run();
    });
}

/**
 * Trim audio to specific duration
 */
export async function trimAudio(
    inputPath: string,
    outputPath: string,
    startTime: number,
    duration: number
): Promise<void> {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .setStartTime(startTime)
            .setDuration(duration)
            .output(outputPath)
            .on("end", () => resolve())
            .on("error", reject)
            .run();
    });
}

/**
 * Loop audio to match video duration
 */
export async function loopAudio(
    inputPath: string,
    outputPath: string,
    targetDuration: number
): Promise<void> {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .inputOptions(["-stream_loop", "-1"])
            .setDuration(targetDuration)
            .audioFilters("afade=t=out:st=" + (targetDuration - 2) + ":d=2")
            .output(outputPath)
            .on("end", () => resolve())
            .on("error", reject)
            .run();
    });
}
