# Directus

## Generate Types

### Purpose

Generate TypeScript types from the Directus API for frontend and backend development. This enforces strict type validation with TypeScript across the app.

### Package

Uses the [`directus-sdk-typegen`](https://www.npmjs.com/package/directus-sdk-typegen) npm package.

### Fixed locations (never change)

| What                 | Path                                 |
| -------------------- | ------------------------------------ |
| Generation script    | `scripts/generate-directus-types.ts` |
| Generated types file | `app/types/directus-schema.ts`       |
| npm script name      | `generate:types`                     |

The generated file is always written to the same path, regardless of framework.

### Rules

1. Always use `generateDirectusTypes` from `directus-sdk-typegen` in the script at `scripts/generate-directus-types.ts`.
2. Always set `outputPath` to `app/types/directus-schema.ts`.
3. Always add the `generate:types` npm script exactly as given in the package script snippet.
4. Read the Directus URL and token from env. Put the token in `.env.local`, never commit it.
5. Exit with an error if either env var is missing.

### Framework adaptation

The snippet is written for Directus + Nuxt. Use the same pattern for other frameworks: keep the script path, output path and npm script identical, and only change the env var name that holds the Directus URL to match the framework's convention.

| Framework | Directus URL env var                                                         |
| --------- | ---------------------------------------------------------------------------- |
| Nuxt      | `NUXT_PUBLIC_API_BASE_URL`                                                   |
| Others    | The framework's equivalent for the API base URL (e.g. its public-env prefix) |

`DIRECTUS_TOKEN` stays the same everywhere.

### Snippets

- Script: [snippets/directus/generate-types/script.ts](../snippets/directus/generate-types/script.ts)
- npm script: [snippets/directus/generate-types/package.json](../snippets/directus/generate-types/package.json)

## Table Creation

1. Always enable `date_created`, `date_updated`, `user_created` and `user_updated`.

## Table Naming

| Rule                                                | ❌ Wrong           | ✅ Correct                      |
| --------------------------------------------------- | ------------------ | ------------------------------- |
| Use `snake_case` names                              | `Project_Coord`    | `project_coordinator`           |
| Use plural names                                    | `user`             | `users`                         |
| Do not prefix `master_` for master data             | `master_countries` | `countries`                     |

## Junction Table Naming

For junction table names, use the following pattern:

`<table_1>__<table_2>__<field>`

For example, there are 2 tables `companies` and `contacts`. If you want to add a `contacts` field to `companies`, you'll create an M2M, which needs a junction table. In this case:

- `table_1` = `companies`
- `table_2` = `contacts`
- `field` = `contacts`

Junction table: `companies__contacts__contacts`

In some cases, the same `companies` table might need a new field `owners` which again maps to the same `contacts` table. In that case:

- `table_1` = `companies`
- `table_2` = `contacts`
- `field` = `owners`

Junction table: `companies__contacts__owners`

## Field Naming

| Rule                                                  | ❌ Wrong       | ✅ Correct     |
| ----------------------------------------------------- | -------------- | -------------- |
| Use `snake_case` names                                | `User-Created` | `user_created` |
| Relational field names should be a human-friendly key | `user_id`      | `user`         |
