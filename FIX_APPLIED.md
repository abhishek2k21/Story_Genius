# Fix Applied

The `User not found` error during project creation has been resolved.

## Changes
1. **API**: Implemented JIT (Just-In-Time) user creation in `apps/api/src/routes/projects.ts`. If the user record is missing (due to missing local webhooks), it is now automatically created.
2. **Worker**: Added missing dependency `drizzle-orm` to `apps/worker` to fix the worker crash.

## Next Steps
You can now create projects successfully.
