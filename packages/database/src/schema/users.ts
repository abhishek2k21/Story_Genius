import { pgTable, uuid, text, timestamp, varchar, integer, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userPlanTierEnum = pgEnum("user_plan_tier", ["free", "creator", "professional", "enterprise"]);

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkId: text("clerk_id").notNull().unique(),
    email: text("email").notNull().unique(),
    name: text("name"),
    avatarUrl: text("avatar_url"),
    planTier: userPlanTierEnum("plan_tier").default("free").notNull(),
    creditsRemaining: integer("credits_remaining").default(100).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations will be defined after projects import to avoid circular deps
export const usersRelations = relations(users, ({ many }) => ({
    // Projects relation defined in projects.ts
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

