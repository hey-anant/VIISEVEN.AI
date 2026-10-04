# Vercel Deployment & Environment Variables Guide

## 1. Environment Variables in Vercel

In your **Vercel Project Dashboard** (`Settings` → `Environment Variables`), add the following exact keys and types:

### A. Public Client Variables (Set Type to "Config" or proceed with `NEXT_PUBLIC_`):
These variables must be accessible to the browser:

| Variable Name | Value Description |
| :--- | :--- |
| `NEXT_PUBLIC_CONVEX_URL` | Your Convex deployment URL (e.g. `https://flexible-lobster-72.convex.cloud`) |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | Your Convex site URL (e.g. `https://flexible-lobster-72.convex.site`) |
| `NEXT_PUBLIC_GOOGLE_AUTH_CLIENT_ID_KEY` | Your Google OAuth Client ID (e.g. `609205355144-...`) |
| `NEXT_PUBLIC_GITHUB_CLIENT_ID` | Your GitHub OAuth App Client ID |

> **Note on Vercel Warning:** Vercel shows a prompt saying *"Public framework prefix..."*. Select **Config** (or keep the `NEXT_PUBLIC_` prefix) and save. These are client IDs and connection URLs that the browser requires.

---

### B. Secret Server-Only Variables (Set Type to "Secret" / Default):
These variables are kept private on the server and are NEVER exposed to the browser:

| Variable Name | Value Description |
| :--- | :--- |
| `CONVEX_DEPLOY_KEY` | Deploy key from Convex Dashboard (`Settings` → `Deploy Keys`) |
| `GEMINI_API_KEY` | Google Gemini API Key |
| `OPENROUTER_API_KEY` | OpenRouter API Key (Fallback AI) |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Secret |

---

## 2. Deploying

1. Ensure all variables above are saved in Vercel.
2. Go to **Deployments** in Vercel.
3. Click the three dots (`...`) on your latest deployment and select **Redeploy** (or push to git).
