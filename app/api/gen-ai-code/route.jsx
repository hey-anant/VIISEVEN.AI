import { GenAiCode } from "@/configs/AiModel";
import { NextResponse } from "next/server";

function parseGenerativeAiJson(rawText) {
    let cleaned = rawText.trim();
    if (cleaned.startsWith("```json")) {
        cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    try {
        return JSON.parse(cleaned);
    } catch (firstErr) {
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
        } catch {
            throw firstErr;
        }
    }
}

export async function POST(req){
    const {prompt} = await req.json();
    
    try {
        const result = await GenAiCode.sendMessage(prompt);
        const resp = result.response.text();
        const parsed = parseGenerativeAiJson(resp);
        return NextResponse.json(parsed);
    } catch (e) {
        console.error("Gen AI Code Error:", e.message);
        
        return NextResponse.json(
            { error: e.message || "Failed to generate AI code" },
            { status: 500 }
        );
    }
}