import { pgTable, uuid, text, timestamp, boolean, jsonb, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

export const genreEnum = [
    "fantasy",
    "sci-fi",
    "romance",
    "horror",
    "mystery",
    "thriller",
    "drama",
    "comedy",
    "adventure",
    "historical",
    "other",
] as const;

export type Genre = (typeof genreEnum)[number];

export const projects = pgTable("projects", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    genre: text("genre").$type<Genre>().default("other"),
    templateId: uuid("template_id"),
    coverImageUrl: text("cover_image_url"),
    isPublic: boolean("is_public").default(false).notNull(),
    wordCount: integer("word_count").default(0).notNull(),
    settings: jsonb("settings").default({}).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    lastEditedAt: timestamp("last_edited_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
});

export const projectsRelations = relations(projects, ({ one }) => ({
    user: one(users, {
        fields: [projects.userId],
        references: [users.id],
    }),
}));

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
