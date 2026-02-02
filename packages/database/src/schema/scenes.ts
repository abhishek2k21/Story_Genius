import { pgTable, uuid, text, timestamp, integer, numeric, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { stories } from "./stories";

export const scenes = pgTable("scenes", {
    id: uuid("id").primaryKey().defaultRandom(),
    storyId: uuid("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
    projectId: uuid("project_id"),
    order: integer("order").notNull(),
    title: text("title"),
    content: text("content").notNull(),
    summary: text("summary"),
    duration: numeric("duration", { precision: 10, scale: 2 }).default("5").notNull(),
    location: text("location"),
    timeOfDay: text("time_of_day"),
    mood: text("mood"),
    characters: jsonb("characters").$type<string[]>().default([]).notNull(),
    actions: jsonb("actions").$type<string[]>().default([]),
    emotions: jsonb("emotions").$type<string[]>().default([]),

    // Visual Plan
    cameraMovement: text("camera_movement"),
    cameraAngle: text("camera_angle"),
    lighting: text("lighting"),
    colorPalette: jsonb("color_palette").$type<string[]>().default([]),
    transitionIn: text("transition_in"),
    transitionOut: text("transition_out"),

    // Post-Production
    audioSettings: jsonb("audio_settings").default({}).notNull(), // { musicVolume: 0.5, narrationVolume: 1.0, mute: false }
    subtitleText: text("subtitle_text"), // Editable subtitle content

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const scenesRelations = relations(scenes, ({ one }) => ({
    story: one(stories, {
        fields: [scenes.storyId],
        references: [stories.id],
    }),
}));

export type Scene = typeof scenes.$inferSelect;
export type NewScene = typeof scenes.$inferInsert;
