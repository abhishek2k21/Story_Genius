import { pgTable, uuid, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { projects } from "./projects";

export const chapters = pgTable("chapters", {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("Untitled Chapter"),
    content: text("content").default(""),
    order: integer("order").notNull().default(0),
    wordCount: integer("word_count").default(0).notNull(),
    metadata: jsonb("metadata").default({}).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chaptersRelations = relations(chapters, ({ one }) => ({
    project: one(projects, {
        fields: [chapters.projectId],
        references: [projects.id],
    }),
}));

export type Chapter = typeof chapters.$inferSelect;
export type NewChapter = typeof chapters.$inferInsert;
