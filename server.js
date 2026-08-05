import express from "express";
import cors from "cors";
import { chatSession, GenAiCode } from "./configs/AiModel.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

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

app.get("/health", (req, res) => {
    res.json({ status: "OK", server: "VIISEVEN Node.js Backend API" });
});

app.post("/api/ai-chat", async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    try {
        const result = await chatSession.sendMessage(prompt);
        const AIResp = result.response.text();
        return res.json({ result: AIResp });
    } catch (e) {
        console.error("AI Chat Error:", e.message);
        return res.status(500).json({ error: e.message || "Failed to get AI response" });
    }
});

app.post("/api/gen-ai-code", async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    try {
        const result = await GenAiCode.sendMessage(prompt);
        const resp = result.response.text();
        const parsed = parseGenerativeAiJson(resp);
        return res.json(parsed);
    } catch (e) {
        console.error("Gen AI Code Error:", e.message);
        return res.status(500).json({ error: e.message || "Failed to generate AI code" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 VIISEVEN Node.js Backend Server listening on http://localhost:${PORT}`);
});
