import { pgTable, uuid, text, timestamp, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { projects } from "./projects";
import { stories } from "./stories";
import { scenes } from "./scenes";

export const generationStatusEnum = pgEnum("generation_status", [
    "pending", "processing", "completed", "failed", "cancelled"
]);

export const videoQualityEnum = pgEnum("video_quality", [
    "draft", "standard", "high", "ultra", "cinema"
]);

export const generations = pgTable("generations", {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    storyId: uuid("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
    sceneId: uuid("scene_id").references(() => scenes.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // scene, audio, full_video
    status: generationStatusEnum("status").default("pending").notNull(),
    progress: integer("progress").default(0).notNull(),
    provider: text("provider"),
    quality: videoQualityEnum("quality").default("standard").notNull(),

    // BullMQ Job Tracking
    jobId: text("job_id"),
    priority: integer("priority").default(3).notNull(), // 1=urgent, 5=batch
    retryCount: integer("retry_count").default(0).notNull(),
    progressData: jsonb("progress_data").$type<{
        stage: string;
        percent: number;
        message: string;
        timestamp: string;
    }>(),

    result: jsonb("result"),
    error: text("error"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const generationsRelations = relations(generations, ({ one }) => ({
    project: one(projects, {
        fields: [generations.projectId],
        references: [projects.id],
    }),
    story: one(stories, {
        fields: [generations.storyId],
        references: [stories.id],
    }),
    scene: one(scenes, {
        fields: [generations.sceneId],
        references: [scenes.id],
    }),
}));

export type Generation = typeof generations.$inferSelect;
export type NewGeneration = typeof generations.$inferInsert;
