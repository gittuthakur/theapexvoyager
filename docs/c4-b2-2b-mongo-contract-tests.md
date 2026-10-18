# Google API budget store: live MongoDB contract tests (Stage B)

`lib/googleApiBudgetStore.mongo.contract.test.ts` checks the budget store against a **real** MongoDB. It is **skipped by default** and
must only ever be run, deliberately, against a dedicated scratch database. Nothing in the application imports it.

## What it needs (all of it, or it will not run)

1. A scratch database (a separate database from production) and a **test-only database user** whose permissions are limited to that
   database (read/write on the scratch database only; no access to the production database).
2. Three environment variables, set in the shell for that one run only:

   | Variable | Meaning |
   |---|---|
   | `GOOGLE_BUDGET_TEST_MONGODB_URI` | Connection string for the scratch database. It must include the test user's credentials and an explicit database name. There is no fallback to `MONGODB_URI`. |
   | `GOOGLE_BUDGET_TEST_ALLOW_WRITE` | Must be exactly `yes`. |
   | `GOOGLE_BUDGET_TEST_EXPECT_DB` | Must equal the database name in the URI (a second, independent declaration). |

3. A database name that carries an explicit `scratch` or `test` word (for example `apex_budget_scratch`) and is not `theapexvoyager`,
   `admin`, `local` or `config`, nor contains `prod`, `live` or `theapexvoyager`.

If the URI is unset, or the opt-in is missing, the live suite is **skipped** and nothing connects. If the variables are set but unsafe,
the run **fails** with a fixed refusal code (never the URI) and still does not connect. The full rules are in
`lib/googleApiBudgetContract.safety.ts`.

## Run

```
GOOGLE_BUDGET_TEST_MONGODB_URI='<scratch uri>' GOOGLE_BUDGET_TEST_ALLOW_WRITE=yes GOOGLE_BUDGET_TEST_EXPECT_DB=<scratch db> \
  npx vitest run lib/googleApiBudgetStore.mongo.contract.test.ts
```

## What it touches

- It opens its own standalone connection. It never uses `connectDB()` or `MONGODB_URI`, and never changes the global Mongoose
  connection.
- It uses one collection created for the run, `budget_contract_<12 hex>`, with implicit index and collection creation disabled. It
  refuses to start if that collection already exists.
- Cleanup deletes only the documents it created (by explicit `_id` list) and drops only the one TTL index it created, only on its own
  collection. It never drops a database or a collection. An empty `budget_contract_*` collection may remain; delete it by hand in the
  scratch database.
- It never waits for TTL expiry; it verifies the TTL index definition and the stored `expiresAt` values instead.
