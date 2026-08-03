<div align="center">

# ⚡️ VIISEVEN.AI - AI-Powered Full-Stack Code Generation Platform

<img src="./public/logo.svg" alt="VIISEVEN Logo" width="280" />

### 🚀 AI-Powered Full-Stack Code Generation Platform  

**Generate, edit, run, and deploy complete React applications — all inside your browser.**

</div>

---

## 🧠 What is VIISEVEN?

**VIISEVEN** is an advanced AI-driven web application builder designed to transform natural language prompts into production-ready React applications. Powered by **Google Gemini** (`gemini-2.0-flash-exp`), **Next.js 16**, **Convex**, and **Sandpack**, VIISEVEN scaffolds full code structures, streams live previews, and provides an in-browser code editor for real-time tweaking and deployment.

---

## ✨ Core Features

| 🚀 Feature | 💡 Description |
|:--|:--|
| **⚙️ AI Code Generation** | Generates full React applications styled with Tailwind CSS and Lucide React icons. |
| **🧩 Live Code Editor** | Integrated with **Sandpack** (CodeSandbox) for interactive code editing in your browser. |
| **🎨 Real-Time Preview** | Instantly preview your generated React app as code changes occur. |
| **🔐 Google OAuth Sync** | Seamless authentication with automatic account syncing to Convex DB. |
| **🗂️ Workspace & Chat History** | Automatically stores multi-session workspaces, chat history, and generated file structures via Convex. |
| **💾 Serverless Backend** | Powered by **Convex** for real-time state management and zero-config DB queries. |
| **🚀 Direct Deployment & Export** | One-click export to CodeSandbox editor or direct deployment to live web sandboxes. |

---

## 🧩 Tech Stack

| Layer | Technology |
|:--|:--|
| **Frontend Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) + [React 19](https://react.dev/) |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/) + Radix UI + Lucide Icons |
| **Backend & Database** | [Convex](https://www.convex.dev/) (Serverless Real-Time DB) |
| **AI Engine** | [Google Gemini API](https://ai.google.dev/) (`gemini-2.0-flash-exp`) |
| **Auth** | Google OAuth (`@react-oauth/google`) |
| **In-Browser Editor** | [@codesandbox/sandpack-react](https://sandpack.codesandbox.io/) |

---

## ⚡️ Getting Started

### 🧰 Prerequisites

Ensure you have installed:
- **Node.js ≥ 18.0**
- **npm** (or `pnpm` / `yarn` / `bun`)
- A **Google Cloud Console** project with Google OAuth Client ID
- A **Google Gemini API Key**
- A free **Convex** account

---

### 🔑 Environment Variables Setup

Create a `.env.local` file in the root directory and configure the following credentials:

```env
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Convex Backend Configuration
NEXT_PUBLIC_CONVEX_URL=https://your-deployment-name.convex.cloud
CONVEX_DEPLOYMENT=dev:your-deployment-name

# Google OAuth Credentials
NEXT_PUBLIC_GOOGLE_AUTH_CLIENT_ID_KEY=your_google_oauth_client_id.apps.googleusercontent.com

# Convex Public Site URL
NEXT_PUBLIC_CONVEX_SITE_URL=https://your-deployment-name.convex.site
```

---

### 📥 Installation & Setup


1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Deploy / Connect Convex Backend**
   Push the schema and functions to your Convex backend:
   ```bash
   npx convex dev --once
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to start building apps!

---

## 🛠️ Project Structure

```
├── app/
│   ├── (main)/
│   │   ├── pricing/          # Subscription & Pricing page
│   │   └── workspace/[id]/   # Dynamic workspace (Chat + Code View)
│   ├── api/
│   │   ├── ai-chat/          # AI Chat endpoint (Gemini text)
│   │   └── gen-ai-code/      # AI Code Generator endpoint (Gemini JSON)
│   ├── layout.js             # Root layout with providers & fonts
│   ├── page.js               # Home Landing Page (Hero)
│   └── provider.jsx          # Context providers & Convex sync
├── components/
│   ├── custom/
│   │   ├── AppSideBar.jsx    # Sidebar navigation & workspace history
│   │   ├── ChatView.jsx      # Interactive AI chat interface
│   │   ├── CodeView.jsx      # Sandpack code editor & preview tabs
│   │   ├── Header.jsx        # Navigation header with avatar & action buttons
│   │   ├── Hero.jsx          # Main prompt input landing component
│   │   ├── Logo.jsx          # VIISEVEN branding logo component
│   │   ├── SandPackPreviewClient.jsx  # Live sandbox deployment preview
│   │   └── SignInDialog.jsx  # Google OAuth authentication modal
│   └── ui/                   # Reusable UI primitives (Radix UI)
├── configs/
│   └── AiModel.jsx           # Google Generative AI SDK configuration
├── convex/
│   ├── schema.js             # Database schema definition (Users, Workspace)
│   ├── users.js              # User mutations & queries
│   └── workspace.js          # Workspace mutations & queries
├── data/
│   ├── Lookup.jsx            # Application constants & default templates
│   └── Prompt.jsx            # Gemini AI system prompt definitions
├── public/                   # Static assets (logo, favicon)
```

---

## 🚀 Production Build & Deployment

### Build Locally
To test a production build:
```bash
npm run build
npm start
```

### Deploying to Vercel

1. Push your repository to GitHub.
2. Import the project into **Vercel**.
3. Add the required Environment Variables in Vercel settings:
   - `GEMINI_API_KEY`
   - `NEXT_PUBLIC_CONVEX_URL`
   - `NEXT_PUBLIC_GOOGLE_AUTH_CLIENT_ID_KEY`
   - `CONVEX_DEPLOYMENT`
4. Click **Deploy**.

---


