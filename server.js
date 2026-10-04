import express from "express";
import cors from "cors";
import { chatSession, GenAiCode } from "./configs/AiModel.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ─── JSON Parser (resilient against AI-generated malformed JSON) ───
function parseGenerativeAiJson(rawText) {
    let cleaned = rawText.trim();
    if (cleaned.startsWith("```json")) {
        cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }
    cleaned = cleaned.trim();

    // Attempt 1: Direct parse
    try {
        return JSON.parse(cleaned);
    } catch (_) {}

    // Attempt 2: Extract JSON bounded by outermost { }
    try {
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
            return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
        }
    } catch (_) {}

    // Attempt 3: Repair unescaped control chars
    try {
        const repaired = cleaned
            .replace(/\\(?!["\\/bfnrtu]|u[0-9a-fA-F]{4})/g, "\\\\")
            .replace(/[\x00-\x1F]/g, (ch) => {
                if (ch === '\n') return '\\n';
                if (ch === '\r') return '\\r';
                if (ch === '\t') return '\\t';
                return '';
            });
        return JSON.parse(repaired);
    } catch (_) {}

    // Attempt 4: Close unclosed braces/brackets
    try {
        let truncated = cleaned;
        const quoteCount = (truncated.match(/(?<!\\)"/g) || []).length;
        if (quoteCount % 2 !== 0) truncated += '"';

        let braces = 0, brackets = 0, inString = false;
        for (let i = 0; i < truncated.length; i++) {
            const ch = truncated[i];
            if (ch === '"' && (i === 0 || truncated[i - 1] !== '\\')) inString = !inString;
            if (!inString) {
                if (ch === '{') braces++;
                else if (ch === '}') braces--;
                else if (ch === '[') brackets++;
                else if (ch === ']') brackets--;
            }
        }
        for (let i = 0; i < brackets; i++) truncated += ']';
        for (let i = 0; i < braces; i++) truncated += '}';
        return JSON.parse(truncated);
    } catch (_) {}

    throw new Error("Failed to parse AI response as valid JSON.");
}

// ─── Normalize file structure for Sandpack ───
function normalizeFiles(files) {
    if (!files || typeof files !== "object") return {};
    const normalized = {};

    for (const [rawPath, value] of Object.entries(files)) {
        if (!rawPath || typeof rawPath !== "string") continue;
        let path = rawPath.trim();
        if (!path || path === "null" || path === "undefined") continue;

        if (!path.startsWith("/")) path = "/" + path;
        if (path.startsWith("/src/")) path = "/" + path.slice(5);

        let code = "";
        if (typeof value === "string") {
            code = value;
        } else if (value && typeof value === "object" && typeof value.code === "string") {
            code = value.code;
        } else {
            code = String(value || "");
        }

        normalized[path] = { code };
    }

    // Alias App.jsx / App.tsx → App.js
    if (!normalized["/App.js"]) {
        if (normalized["/App.jsx"]) normalized["/App.js"] = { code: normalized["/App.jsx"].code };
        else if (normalized["/App.tsx"]) normalized["/App.js"] = { code: normalized["/App.tsx"].code };
    }

    // Ensure /styles.css exists
    if (!normalized["/styles.css"]) {
        if (normalized["/index.css"]) normalized["/styles.css"] = { code: normalized["/index.css"].code };
        else if (normalized["/App.css"]) normalized["/styles.css"] = { code: normalized["/App.css"].code };
        else {
            normalized["/styles.css"] = {
                code: `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n* { box-sizing: border-box; }\nbody { margin: 0; padding: 0; }`
            };
        }
    }

    // Ensure /index.js exists
    if (!normalized["/index.js"]) {
        normalized["/index.js"] = {
            code: `import React, { StrictMode } from "react";\nimport { createRoot } from "react-dom/client";\nimport "./styles.css";\nimport App from "./App";\n\nconst root = createRoot(document.getElementById("root"));\nroot.render(\n  <StrictMode>\n    <App />\n  </StrictMode>\n);`
        };
    }

    // Ensure /public/index.html exists
    if (!normalized["/public/index.html"]) {
        normalized["/public/index.html"] = {
            code: `<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>VIISEVEN Preview</title>\n    <script src="https://cdn.tailwindcss.com"></script>\n  </head>\n  <body class="bg-gray-950 text-white antialiased min-h-screen">\n    <div id="root"></div>\n  </body>\n</html>`
        };
    }

    return normalized;
}

// ─── Health Check ───
app.get("/health", (req, res) => {
    res.json({ status: "OK", server: "VIISEVEN Node.js Backend API" });
});

// ─── AI Chat Endpoint ───
app.post("/api/ai-chat", async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    try {
        console.log("[ai-chat] Sending prompt...", prompt.length, "chars");
        const result = await chatSession.sendMessage(prompt);
        const AIResp = result.response.text();
        console.log("[ai-chat] Success! Response length:", AIResp.length);
        return res.json({ result: AIResp });
    } catch (e) {
        console.error("[ai-chat] ERROR:", e.message);
        return res.json({ error: e.message || "Failed to get AI response" });
    }
});

// ─── Code Generation Endpoint ───
app.post("/api/gen-ai-code", async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    try {
        console.log("[gen-ai-code] Generating code...");
        const result = await GenAiCode.sendMessage(prompt);
        const resp = result.response.text();
        console.log("[gen-ai-code] Raw response length:", resp?.length);
        const parsed = parseGenerativeAiJson(resp);

        if (parsed.files) {
            parsed.files = normalizeFiles(parsed.files);
        }

        console.log("[gen-ai-code] Files generated:", Object.keys(parsed.files || {}));
        return res.json(parsed);
    } catch (e) {
        console.error("[gen-ai-code] ERROR:", e.message);
        return res.json({ error: e.message || "Failed to generate AI code" });
    }
});

// ─── GitHub OAuth token exchange ───
app.post("/api/auth/github", async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ error: "Authorization code is required" });
        }

        const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID;
        const clientSecret = process.env.GITHUB_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
            return res.status(500).json({ error: "GitHub OAuth not configured on server" });
        }

        // Exchange code for access token
        const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
        });
        const tokenData = await tokenResponse.json();
        if (tokenData.error) {
            return res.status(400).json({ error: tokenData.error_description || tokenData.error });
        }

        // Get user info
        const userRes = await fetch("https://api.github.com/user", {
            headers: { "Authorization": `Bearer ${tokenData.access_token}`, "Accept": "application/vnd.github.v3+json" },
        });
        const userData = await userRes.json();

        // Get email
        let email = userData.email;
        if (!email) {
            const emailRes = await fetch("https://api.github.com/user/emails", {
                headers: { "Authorization": `Bearer ${tokenData.access_token}`, "Accept": "application/vnd.github.v3+json" },
            });
            if (emailRes.ok) {
                const emails = await emailRes.json();
                email = (emails.find(e => e.primary) || emails[0])?.email;
            }
        }

        return res.json({
            user: {
                name: userData.name || userData.login,
                email: email || `${userData.login}@github.com`,
                picture: userData.avatar_url,
                githubUsername: userData.login,
                githubAccessToken: tokenData.access_token,
            },
        });
    } catch (error) {
        console.error("GitHub auth error:", error);
        return res.status(500).json({ error: "Authentication failed" });
    }
});

// ─── GitHub OAuth callback (popup handler) ───
app.get("/api/auth/github/callback", (req, res) => {
    const { code, error } = req.query;
    const html = `<!DOCTYPE html><html><head><title>GitHub Auth</title></head>
    <body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;background:#0d1117;color:white;">
    <p>Authenticating...</p>
    <script>
    if(window.opener){window.opener.postMessage({type:'github-oauth-callback',code:${code ? `'${code}'` : 'null'},error:${error ? `'${error}'` : 'null'}},window.location.origin);window.close();}
    else{document.body.innerHTML='<p>Done. You can close this window.</p>';}
    </script></body></html>`;
    res.setHeader("Content-Type", "text/html");
    res.send(html);
});

// ─── GitHub Push ───
app.post("/api/github/push", async (req, res) => {
    try {
        const { repoName, files, accessToken, isPrivate, description } = req.body;
        if (!accessToken || !repoName || !files) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const headers = {
            "Authorization": `Bearer ${accessToken}`,
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json",
            "User-Agent": "VIISEVEN-AI-App",
        };

        // Get user
        const userRes = await fetch("https://api.github.com/user", { headers });
        const user = await userRes.json();
        if (!user.login) return res.status(401).json({ error: "Invalid GitHub token" });

        const repoFullName = `${user.login}/${repoName}`;

        // Create repo if needed
        const checkRepo = await fetch(`https://api.github.com/repos/${repoFullName}`, { headers });
        if (checkRepo.status === 404) {
            const createRes = await fetch("https://api.github.com/user/repos", {
                method: "POST", headers,
                body: JSON.stringify({ name: repoName, private: !!isPrivate, description: description || "Created with VIISEVEN.AI", auto_init: true }),
            });
            if (!createRes.ok && createRes.status !== 422) {
                const err = await createRes.json();
                return res.status(400).json({ error: `Repo creation failed: ${err.message}` });
            }
            await new Promise(r => setTimeout(r, 2000));
        }

        // Get base SHA
        let branch = "main", baseSha = null;
        let refRes = await fetch(`https://api.github.com/repos/${repoFullName}/git/ref/heads/main`, { headers });
        if (!refRes.ok) {
            refRes = await fetch(`https://api.github.com/repos/${repoFullName}/git/ref/heads/master`, { headers });
            if (refRes.ok) branch = "master";
        }
        if (refRes.ok) baseSha = (await refRes.json()).object.sha;

        // Create blobs
        const tree = [];
        for (const [filePath, fileData] of Object.entries(files)) {
            const content = typeof fileData === "string" ? fileData : fileData?.code || "";
            const cleanPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
            const blobRes = await fetch(`https://api.github.com/repos/${repoFullName}/git/blobs`, {
                method: "POST", headers, body: JSON.stringify({ content, encoding: "utf-8" }),
            });
            if (blobRes.ok) {
                tree.push({ path: cleanPath, mode: "100644", type: "blob", sha: (await blobRes.json()).sha });
            }
        }
        if (!tree.length) return res.status(400).json({ error: "No files to push" });

        // Create tree
        const treePayload = { tree };
        if (baseSha) treePayload.base_tree = baseSha;
        const treeRes = await fetch(`https://api.github.com/repos/${repoFullName}/git/trees`, {
            method: "POST", headers, body: JSON.stringify(treePayload),
        });
        if (!treeRes.ok) return res.status(400).json({ error: `Tree error: ${(await treeRes.json()).message}` });
        const treeData = await treeRes.json();

        // Create commit
        const commitPayload = { message: "Update from VIISEVEN.AI 🚀", tree: treeData.sha };
        if (baseSha) commitPayload.parents = [baseSha];
        const commitRes = await fetch(`https://api.github.com/repos/${repoFullName}/git/commits`, {
            method: "POST", headers, body: JSON.stringify(commitPayload),
        });
        if (!commitRes.ok) return res.status(400).json({ error: `Commit error: ${(await commitRes.json()).message}` });
        const commitData = await commitRes.json();

        // Update ref
        await fetch(`https://api.github.com/repos/${repoFullName}/git/refs/heads/${branch}`, {
            method: "PATCH", headers, body: JSON.stringify({ sha: commitData.sha, force: true }),
        });

        return res.json({ success: true, repoUrl: `https://github.com/${repoFullName}`, commitSha: commitData.sha });
    } catch (error) {
        console.error("GitHub push error:", error);
        return res.status(500).json({ error: error.message || "Push failed" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 VIISEVEN Backend Server running at http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
});
