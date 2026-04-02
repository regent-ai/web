# Platform Phoenix Cutover Database

## Goal

Allow the Phoenix web app in `/web` to attach to the existing `/platform` Postgres data without copying or reshaping the live basenames and auction records by hand.

## What changed

- The retained-table bootstrap migration now creates the old platform tables only when they do not already exist.
- A follow-up cutover migration repairs early Phoenix-only columns so the final table layout matches the old platform shape.
- The Phoenix schemas now read the old platform timestamp column names directly.

## Cutover flow

1. Point the app in `/web` at the existing production `DATABASE_URL`.
2. Run `mix ecto.migrate`.
3. Phoenix will:
   - adopt the old retained tables if they are already present
   - create any missing retained tables
   - rename Phoenix-only `inserted_at` columns to `created_at` when needed
   - normalize the retained timestamp columns to the old platform style
4. Start the app from `/web`.

## Expected retained tables after cutover

- `basenames_mint_allowances`
- `basenames_mints`
- `basenames_payment_credits`
- `agentlaunch_auctions`

## Important detail

The old platform uses `created_at`, not Phoenix's default `inserted_at`. The cutover migration fixes that so Phoenix reads the exact same rows instead of relying on a second copy of the data.
