# FinPulse Supabase Setup Guide

This project already supports Supabase through the repository files in `src/lib/repositories`.
If Supabase environment variables are missing, the app falls back to the in-memory mock store.

## 1. Create Supabase Project

1. Go to https://supabase.com/dashboard.
2. Create a new project.
3. Open the project dashboard.
4. Go to **Project Settings > API**.

Copy these values:

- **Project URL**
- **anon public key**
- **service_role key**

Keep the `service_role` key private. Never expose it in client-side code.

## 2. Add Environment Variables

Create or update `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The app uses:

- `NEXT_PUBLIC_SUPABASE_URL` in `src/lib/supabase/admin.ts`
- `SUPABASE_SERVICE_ROLE_KEY` in server-side API routes
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` for future client-side Supabase usage

## 3. Create Database Tables

Use the single setup file:

```txt
supabase/finpulse_database_setup.sql
```

Steps:

1. Open Supabase dashboard.
2. Go to **SQL Editor**.
3. Click **New query**.
4. Paste all SQL from `supabase/finpulse_database_setup.sql`.
5. Click **Run**.

This creates:

- `users`
- `linked_accounts`
- `transactions`
- `jars`
- `contacts`
- `scheduled_payments`
- `chat_messages`

It also creates indexes, update triggers, and row level security policies.

## 4. What Each Table Saves

### `users`

Stores logged-in user profile data from NextAuth/Google.

Important columns:

- `email`
- `name`
- `image`
- `google_id`

### `linked_accounts`

Stores connected bank accounts from JustPay, Plaid, or manual/demo linking.

Important columns:

- `provider`
- `account_name`
- `account_number`
- `account_type`
- `currency`
- `balance`
- `metadata`

Use `metadata` for safe extra details like masked account numbers, provider references, or tokenized references.

### `transactions`

Stores all money movements.

Examples:

- Send money
- Receive money
- Bill payment
- Mobile top-up
- Manual jar deposit
- Automatic jar DCA deposit

For jar deposits, use:

- `type`: `debit`
- `category`: `Savings`
- `counterparty`: jar name
- `remark`: `Jar deposit: <Jar Name>`

### `jars`

Stores savings jar goals and balances.

Important columns:

- `name`
- `target_amount`
- `balance`
- `actual_saved`
- `virtual_saved`
- `metadata`

Example DCA metadata:

```json
{
  "auto_contribution": {
    "enabled": true,
    "amount": 5000,
    "frequency": "monthly",
    "next_run_at": "2026-06-17T00:00:00.000Z"
  }
}
```

### `contacts`

Stores saved contact suggestions for Action Hub forms.

Types:

- `bank`
- `bill`
- `mobile`

Important columns:

- `label`
- `contact_type`
- `account_number`
- `bank_code`
- `provider`

### `scheduled_payments`

Stores scheduled bills, top-ups, and recurring payments.

Important columns:

- `label`
- `amount`
- `day_of_month`
- `is_active`
- `last_run_at`
- `next_run_at`
- `metadata`

Use `metadata` for flexible schedule modes such as pay after 30 days or monthly day labels.

### `chat_messages`

Stores AI assistant history.

Important columns:

- `role`
- `content`
- `tool_calls`
- `metadata`

Roles:

- `user`
- `assistant`
- `system`
- `tool`

## 5. Run The Project

After updating `.env.local`, restart the dev server:

```bash
npm run dev
```

Then test:

1. Login.
2. Add a contact.
3. Link/add an account.
4. Create a jar.
5. Add money to the jar.
6. Open transactions and confirm the jar deposit appears.
7. Chat with the AI assistant and confirm chat history saves.

## 6. Important Security Notes

- Do not commit `.env.local`.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` in React components.
- Do not save bank passwords.
- Do not save raw sensitive banking tokens unless encrypted.
- Prefer masked account numbers in the UI.

## 7. Existing Migration Files

The project also keeps migration-style files:

- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_dual_balance_jars.sql`

For a fresh Supabase project, using `supabase/finpulse_database_setup.sql` is the easiest option.
