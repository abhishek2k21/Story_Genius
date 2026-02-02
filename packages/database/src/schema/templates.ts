import { pgTable, uuid, text, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";

export const templates = pgTable("templates", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    genre: text("genre").notNull(),
    description: text("description"),
    structure: jsonb("structure").default({}).notNull(),
    exampleContent: text("example_content"),
    coverImageUrl: text("cover_image_url"),
    isSystem: boolean("is_system").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;
