import { pgTable, uuid, text, timestamp, bigint, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { projects } from "./projects";

export const assetTypeEnum = pgEnum("asset_type", [
    "image", "video", "audio", "thumbnail", "subtitle"
]);

export const assets = pgTable("assets", {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    type: assetTypeEnum("type").notNull(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    size: bigint("size", { mode: "number" }).notNull(),
    url: text("url").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const assetsRelations = relations(assets, ({ one }) => ({
    project: one(projects, {
        fields: [assets.projectId],
        references: [projects.id],
    }),
}));

export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
