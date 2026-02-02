import { pgTable, uuid, text, timestamp, jsonb, vector } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { stories } from "./stories";

export const characters = pgTable("characters", {
    id: uuid("id").primaryKey().defaultRandom(),
    storyId: uuid("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    traits: jsonb("traits").default([]).notNull(),
    relationships: jsonb("relationships").default([]).notNull(),
    referenceImageUrl: text("reference_image_url"),
    embedding: vector("embedding", { dimensions: 768 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const charactersRelations = relations(characters, ({ one }) => ({
    story: one(stories, {
        fields: [characters.storyId],
        references: [stories.id],
    }),
}));

export type Character = typeof characters.$inferSelect;
export type NewCharacter = typeof characters.$inferInsert;
