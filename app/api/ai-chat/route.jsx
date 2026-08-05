import { chatSession } from "@/configs/AiModel";
import { NextResponse } from "next/server";

export async function POST(req){
    const {prompt} = await req.json();
    
    try {
        console.log("[ai-chat] Sending prompt...", prompt.length, "chars");
        const result = await chatSession.sendMessage(prompt);
        const AIResp = result.response.text();
        console.log("[ai-chat] Success! Response length:", AIResp.length);
        return NextResponse.json({result: AIResp});
    } catch (e) {
        console.error("[ai-chat] ERROR:", e.message);
        
        // Return 200 with error field so client can read the message
        return NextResponse.json({ error: e.message || "Failed to get AI response" });
    }
}