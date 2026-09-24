import { GenAiCode } from "@/configs/AiModel";
import { NextResponse } from "next/server";

function parseGenerativeAiJson(rawText) {
    let cleaned = rawText.trim();
    if (cleaned.startsWith("```json")) {
        cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }
    cleaned = cleaned.trim();

    try {
        return JSON.parse(cleaned);
    } catch (_) {}

    try {
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
            const jsonSubstring = cleaned.substring(firstBrace, lastBrace + 1);
            return JSON.parse(jsonSubstring);
        }
    } catch (_) {}

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

    try {
        let truncated = cleaned;
        const quoteCount = (truncated.match(/(?<!\\)"/g) || []).length;
        if (quoteCount % 2 !== 0) {
            truncated += '"';
        }
        
        let braces = 0, brackets = 0;
        let inString = false;
        for (let i = 0; i < truncated.length; i++) {
            const ch = truncated[i];
            if (ch === '"' && (i === 0 || truncated[i - 1] !== '\\')) {
                inString = !inString;
            }
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

function normalizeFiles(files) {
    if (!files || typeof files !== "object") return {};
    const normalized = {};
    
    for (const [rawPath, value] of Object.entries(files)) {
        if (!rawPath || typeof rawPath !== "string") continue;
        let path = rawPath.trim();
        if (!path || path === "null" || path === "undefined") continue;

        if (!path.startsWith("/")) {
            path = "/" + path;
        }
        if (path.startsWith("/src/")) {
            path = "/" + path.slice(5);
        }
        
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

    if (!normalized["/App.js"]) {
        if (normalized["/App.jsx"]) {
            normalized["/App.js"] = { code: normalized["/App.jsx"].code };
        } else if (normalized["/App.tsx"]) {
            normalized["/App.js"] = { code: normalized["/App.tsx"].code };
        } else if (normalized["/src/App.js"]) {
            normalized["/App.js"] = { code: normalized["/src/App.js"].code };
        }
    }

    if (!normalized["/styles.css"]) {
        if (normalized["/index.css"]) {
            normalized["/styles.css"] = { code: normalized["/index.css"].code };
        } else if (normalized["/App.css"]) {
            normalized["/styles.css"] = { code: normalized["/App.css"].code };
        } else {
            normalized["/styles.css"] = {
                code: `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n* {\n  box-sizing: border-box;\n}\n\nbody {\n  margin: 0;\n  padding: 0;\n}`
            };
        }
    }

    if (!normalized["/index.js"]) {
        normalized["/index.js"] = {
            code: `import React, { StrictMode } from "react";\nimport { createRoot } from "react-dom/client";\nimport "./styles.css";\nimport App from "./App";\n\nconst root = createRoot(document.getElementById("root"));\nroot.render(\n  <StrictMode>\n    <App />\n  </StrictMode>\n);`
        };
    }

    if (!normalized["/public/index.html"]) {
        normalized["/public/index.html"] = {
            code: `<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>VIISEVEN Preview</title>\n    <script src="https://cdn.tailwindcss.com"></script>\n  </head>\n  <body class="bg-gray-950 text-white antialiased min-h-screen">\n    <div id="root"></div>\n  </body>\n</html>`
        };
    }

    return normalized;
}

export async function POST(req) {
    try {
        const { prompt } = await req.json();
        const result = await GenAiCode.sendMessage(prompt);
        const resp = result.response.text();
        const parsed = parseGenerativeAiJson(resp);
        
        if (parsed.files) {
            parsed.files = normalizeFiles(parsed.files);
        }
        
        return NextResponse.json(parsed);
    } catch (e) {
        console.error("[gen-ai-code] ERROR:", e.message);
        return NextResponse.json({ error: e.message || "Failed to generate AI code" });
    }
}
