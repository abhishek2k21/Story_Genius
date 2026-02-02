import { pgTable, uuid, text, timestamp, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { scenes } from "./scenes";

export const previewStyleEnum = pgEnum("preview_style", ["A", "B", "C", "D"]);
export const previewProviderEnum = pgEnum("preview_provider", ["runway", "pika", "kling"]);

export const previews = pgTable("previews", {
    id: uuid("id").primaryKey().defaultRandom(),
    sceneId: uuid("scene_id").notNull().references(() => scenes.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").notNull(),
    style: previewStyleEnum("style").notNull(),
    provider: previewProviderEnum("provider").notNull(),

    // Storage
    imageUrl: text("image_url"),
    imageKey: text("image_key"),
    thumbnailUrl: text("thumbnail_url"),

    // User selection
    isSelected: integer("is_selected").default(0).notNull(), // 0 = not selected, 1 = selected

    // Metadata
    prompt: text("prompt"),
    generationParams: jsonb("generation_params").$type<Record<string, unknown>>(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const previewsRelations = relations(previews, ({ one }) => ({
    scene: one(scenes, {
        fields: [previews.sceneId],
        references: [scenes.id],
    }),
}));

export type Preview = typeof previews.$inferSelect;
export type NewPreview = typeof previews.$inferInsert;
