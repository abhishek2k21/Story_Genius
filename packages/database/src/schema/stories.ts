import { pgTable, uuid, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { projects } from "./projects";

export const stories = pgTable("stories", {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: text("content").default("").notNull(),
    wordCount: integer("word_count").default(0).notNull(),
    analysis: jsonb("analysis"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const storiesRelations = relations(stories, ({ one }) => ({
    project: one(projects, {
        fields: [stories.projectId],
        references: [projects.id],
    }),
}));

export type Story = typeof stories.$inferSelect;
export type NewStory = typeof stories.$inferInsert;
