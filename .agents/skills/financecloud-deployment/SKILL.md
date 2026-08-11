---
name: financecloud-deployment
description: Use when deploying FinanceCloud to Vercel, configuring environment variables, debugging Vercel Serverless Functions, or validating the production Web/API deployment.
---

# FinanceCloud Deployment

## Goal

Deploy FinanceCloud safely to Vercel without exposing Turso credentials or breaking the Web/API split.

## Architecture

- Web app is exported by Expo.
- Vercel serves the static Web build.
- `/api/*` routes execute as Vercel Serverless Functions.
- Turso credentials are available only to server-side functions.

## Environment variables

Required server-side variables:
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

Rules:
- Never put `TURSO_AUTH_TOKEN` in client-side Expo configuration.
- Never hard-code credentials.
- Never print secret values in logs.
- Keep `.env` out of version control; `.env.example` should contain placeholders only.

## Local validation

Use:
- `npm start` for the Expo development server.
- `npm run web` for Web.
- `npx vercel dev` when testing Vercel Functions locally.

For API changes, verify the affected `/api/*` route locally when practical.

## Production validation

Before deployment:
1. Confirm TypeScript/build checks pass.
2. Confirm environment variables exist in the Vercel project.
3. Confirm `vercel.json` still contains the intended build/rewrite configuration.
4. Confirm `/api/health` can reach the database.
5. Verify the Web app can perform representative transaction/category CRUD operations.

## Deployment safety

- Do not change Vercel configuration without inspecting the current `vercel.json`.
- Do not change database migration behavior during deployment without considering existing production data.
- If a deployment fails, inspect build logs and function logs before making speculative changes.
