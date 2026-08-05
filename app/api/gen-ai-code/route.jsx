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

    // Attempt 1: Direct parse
    try {
        return JSON.parse(cleaned);
    } catch (_) { /* continue */ }

    // Attempt 2: Repair escape sequences
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
    } catch (_) { /* continue */ }

    // Attempt 3: Truncated JSON — close unclosed brackets/braces
    try {
        let truncated = cleaned;
        
        // If we're inside an unclosed string, close it
        const quoteCount = (truncated.match(/(?<!\\)"/g) || []).length;
        if (quoteCount % 2 !== 0) {
            truncated += '"';
        }
        
        // Count unclosed braces and brackets
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
        
        // Close brackets and braces
        for (let i = 0; i < brackets; i++) truncated += ']';
        for (let i = 0; i < braces; i++) truncated += '}';
        
        console.warn("[gen-ai-code] Attempting truncated JSON repair, added", brackets, "brackets and", braces, "braces");
        return JSON.parse(truncated);
    } catch (_) { /* continue */ }

    // Attempt 4: Extract partial — find last complete "files" entry
    try {
        // Try to find a valid JSON object up to the last complete key-value
        const lastBrace = cleaned.lastIndexOf('}');
        if (lastBrace > 0) {
            let partial = cleaned.substring(0, lastBrace + 1);
            // Count and close remaining open braces
            let open = 0;
            let inStr = false;
            for (let i = 0; i < partial.length; i++) {
                if (partial[i] === '"' && (i === 0 || partial[i - 1] !== '\\')) inStr = !inStr;
                if (!inStr) {
                    if (partial[i] === '{') open++;
                    else if (partial[i] === '}') open--;
                }
            }
            for (let i = 0; i < open; i++) partial += '}';
            return JSON.parse(partial);
        }
    } catch (_) { /* continue */ }

    throw new Error("Failed to parse AI response as JSON. The model may have returned an incomplete response.");
}

/**
 * Normalizes file structure for Sandpack compatibility:
 * 1. Ensures format is always { "/path": { code: "..." } }
 * 2. Strips /src/ prefix (Sandpack React template expects root paths like /App.js)
 */
function normalizeFiles(files) {
    if (!files || typeof files !== "object") return files;
    const normalized = {};
    for (const [rawPath, value] of Object.entries(files)) {
        // Strip /src/ prefix — Sandpack expects /App.js not /src/App.js
        let path = rawPath;
        if (path.startsWith("/src/")) {
            path = "/" + path.slice(5);
        }
        
        // Normalize value to { code: "..." } format
        if (typeof value === "string") {
            normalized[path] = { code: value };
        } else if (value && typeof value === "object" && typeof value.code === "string") {
            normalized[path] = value;
        } else {
            normalized[path] = { code: String(value) };
        }
    }
    return normalized;
}

export async function POST(req){
    const {prompt} = await req.json();
    
    try {
        console.log("[gen-ai-code] Sending prompt to OpenRouter...", prompt.length, "chars");
        const result = await GenAiCode.sendMessage(prompt);
        const resp = result.response.text();
        console.log("[gen-ai-code] Raw response length:", resp.length);
        console.log("[gen-ai-code] First 300 chars:", resp.substring(0, 300));
        
        const parsed = parseGenerativeAiJson(resp);
        
        // Normalize file structure for Sandpack compatibility
        if (parsed.files) {
            parsed.files = normalizeFiles(parsed.files);
        }
        
        console.log("[gen-ai-code] Success! Files:", Object.keys(parsed.files || {}));
        return NextResponse.json(parsed);
    } catch (e) {
        console.error("[gen-ai-code] ERROR:", e.message);
        console.error("[gen-ai-code] Stack:", e.stack);
        
        // Return 200 with error field so axios doesn't throw
        // and CodeView can read the error message properly
        return NextResponse.json({ error: e.message || "Failed to generate AI code" });
    }
}