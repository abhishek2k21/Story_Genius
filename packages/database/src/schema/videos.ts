import { pgTable, uuid, text, timestamp, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { scenes } from "./scenes";

export const videoStatusEnum = pgEnum("video_status", [
    "pending",
    "processing",
    "completed",
    "failed",
    "cancelled"
]);

export const videoProviderEnum = pgEnum("video_provider", [
    "runway",
    "pika",
    "kling",
    "replicate"
]);

export const videos = pgTable("videos", {
    id: uuid("id").primaryKey().defaultRandom(),
    sceneId: uuid("scene_id").notNull().references(() => scenes.id, { onDelete: "cascade" }),
    provider: videoProviderEnum("provider").notNull(),
    status: videoStatusEnum("status").default("pending").notNull(),
    prompt: text("prompt").notNull(),
    videoUrl: text("video_url"),
    thumbnailUrl: text("thumbnail_url"),
    duration: integer("duration"), // in seconds
    width: integer("width"),
    height: integer("height"),
    metadata: jsonb("metadata").default({}).notNull(),
    errorMessage: text("error_message"),
    externalId: text("external_id"), // Provider's job ID
    creditsUsed: integer("credits_used").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
});

export const videosRelations = relations(videos, ({ one }) => ({
    scene: one(scenes, {
        fields: [videos.sceneId],
        references: [scenes.id],
    }),
}));

export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;
