import { Hono } from "hono";
import { Webhook } from "svix";
import { db } from "@repo/database";
import { users } from "@repo/database";
import { eq } from "drizzle-orm";

const webhooks = new Hono();

interface ClerkUserEventData {
    id: string;
    email_addresses: Array<{
        id: string;
        email_address: string;
    }>;
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
    created_at: number;
    updated_at: number;
}

interface ClerkWebhookEvent {
    type: string;
    data: ClerkUserEventData;
}

/**
 * Clerk webhook handler for user events
 * Syncs Clerk users with PostgreSQL database
 */
webhooks.post("/clerk", async (c) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error("CLERK_WEBHOOK_SECRET not configured");
        return c.json({ error: "Webhook secret not configured" }, 500);
    }

    // Get the headers
    const svixId = c.req.header("svix-id");
    const svixTimestamp = c.req.header("svix-timestamp");
    const svixSignature = c.req.header("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
        return c.json({ error: "Missing Svix headers" }, 400);
    }

    // Get the body
    const body = await c.req.text();

    // Verify the webhook
    const wh = new Webhook(webhookSecret);
    let event: ClerkWebhookEvent;

    try {
        event = wh.verify(body, {
            "svix-id": svixId,
            "svix-timestamp": svixTimestamp,
            "svix-signature": svixSignature,
        }) as ClerkWebhookEvent;
    } catch (err) {
        console.error("Webhook verification failed:", err);
        return c.json({ error: "Webhook verification failed" }, 400);
    }

    const { type, data } = event;

    console.log(`📬 Clerk webhook received: ${type}`);

    try {
        switch (type) {
            case "user.created": {
                const email = data.email_addresses[0]?.email_address;
                if (!email) {
                    console.error("No email in user.created event");
                    return c.json({ error: "No email provided" }, 400);
                }

                const name = [data.first_name, data.last_name]
                    .filter(Boolean)
                    .join(" ") || null;

                await db.insert(users).values({
                    clerkId: data.id,
                    email,
                    name,
                    avatarUrl: data.image_url,
                    planTier: "free",
                    creditsRemaining: 100,
                }).onConflictDoNothing();

                console.log(`✅ Created user: ${email}`);
                break;
            }

            case "user.updated": {
                const email = data.email_addresses[0]?.email_address;
                const name = [data.first_name, data.last_name]
                    .filter(Boolean)
                    .join(" ") || null;

                await db.update(users)
                    .set({
                        email: email || undefined,
                        name,
                        avatarUrl: data.image_url,
                        updatedAt: new Date(),
                    })
                    .where(eq(users.clerkId, data.id));

                console.log(`✅ Updated user: ${data.id}`);
                break;
            }

            case "user.deleted": {
                // Soft delete or cascade handled by database
                await db.delete(users)
                    .where(eq(users.clerkId, data.id));

                console.log(`✅ Deleted user: ${data.id}`);
                break;
            }

            default:
                console.log(`ℹ️ Unhandled webhook type: ${type}`);
        }

        return c.json({ received: true });
    } catch (error) {
        console.error("Webhook processing error:", error);
        return c.json({ error: "Webhook processing failed" }, 500);
    }
});

export { webhooks };
