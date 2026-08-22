"use client";
import { useConvex, useMutation } from "convex/react";
import { useParams } from "next/navigation";
import React, { useEffect, useContext, useState } from "react";
import { api } from "@/convex/_generated/api";
import { MessageContext } from "@/context/MessageContext";
import { UserDetailContext } from "@/context/UserDetailContext";
import Image from "next/image";
import Colors from "@/data/Colors";
// import { GetWorkspace } from '@/convex/workspace'
import Lookup from "@/data/Lookup";
import { ArrowRight, Link, Loader2Icon } from "lucide-react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import Prompt from "@/data/Prompt";
import { useSidebar } from "../ui/sidebar";
import { toast } from "sonner";

// NOTE: This is an approximate word-based token count, not actual AI tokens.
// Actual Gemini token counting would require an API call (countTokens).
export const countToken = (inputText) => {
  return inputText
    .trim()
    .split(/\s+/)
    .filter((word) => word).length;
};

const ChatView = () => {
  const { id } = useParams();
  const convex = useConvex();
  const { messages, setMessages } = useContext(MessageContext);
  const [loading, setLoading] = useState(false);
  const { userDetail, setUserDetail } = useContext(UserDetailContext);
  const [userInput, setUserInput] = useState("");
  const UpdateMessages = useMutation(api.workspace.UpdateMessages);
  const { toggleSidebar } = useSidebar();


  /**
   * Used to fetch workspace data using workspace id
   */
  useEffect(() => {
    id && GetWorkspaceData();
  }, [id]);

  const GetWorkspaceData = async () => {

    try {
      const result = await convex.query(api.workspace.GetWorkspace, {
        workspaceId: id,
      });
      setMessages(result?.messages || []);
    } catch (error) {
      console.error("Error fetching workspace data:", error);
      setMessages([]); // Reset messages on error
    }
  };

  const GenAiResponse = async () => {
    setLoading(true);
    try {
      const PROMPT = JSON.stringify(messages) + Prompt.CHAT_PROMPT;
      const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "";
      const result = await axios.post(`${SERVER_URL}/api/ai-chat`, { prompt: PROMPT });
      
      // Check if the response contains an error
      if (result.data.error) {
        console.error("AI API Error:", result.data.error);
        
        // Check if it's a rate limit error
        if (result.data.error.includes("429") || result.data.error.includes("quota")) {
          toast.error("Rate limit exceeded. Please wait a moment and try again.");
        } else {
          toast.error("AI Error: " + result.data.error);
        }
        setLoading(false);
        return;
      }
      


      const aiResp = {
        role: "ai",
        content: result.data.result,
      };

      const updatedMessages = [...messages, aiResp];
      setMessages(updatedMessages);

      await UpdateMessages({
        messages: updatedMessages,
        workspaceId: id,
      });
      // NOTE: Token deduction is handled exclusively by CodeView to avoid
      // double-deducting when both components react to the same user message.
    } catch (error) {
      console.error("Error in GenAiResponse:", error);
      toast.error("Failed to generate AI response. Please check your API key.");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (messages?.length > 0) {
      const role = messages[messages?.length - 1]?.role;
      if (role == "user") {
        GenAiResponse();
      }
    }
  }, [messages]);

  const onGenerate = (input) => {
    if(userDetail?.token<10){
      toast('You dont have enough token!')
      return
    }
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: input,
      },
    ]);
    setUserInput("");
  };

  if (!messages) {
    return (
      <div className="flex items-center justify-center h-[85vh]">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 items-center justify-center   relative h-[85vh] p-5">
      <div className="flex-1 overflow-y-scroll scrollbar-hide w-full mb-5">
        {Array.isArray(messages) &&
          messages?.map((msg, index) => (
            <div
              key={index}
              className={`p-3 mb-2 flex gap-2 items-start leading-7 rounded-lg `}
              style={{ backgroundColor: Colors.CHAT_BACKGROUND }}
            >
              {msg?.role == "user" && userDetail?.picture && (
                <Image
                  src={userDetail.picture}
                  alt="userImage"
                  width={35}
                  height={35}
                  className="inline-block rounded-full mr-2"
                />
              )}
              <div className="flex flex-col">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          ))}
        {loading && (
          <div
            className="p-3 mb-2 flex gap-2 items-center rounded-lg "
            style={{ backgroundColor: Colors.CHAT_BACKGROUND }}
          >
            <Loader2Icon className="animate-spin" />
            <h2>Generating Response...</h2>
          </div>
        )}
      </div>
      {/* Input section */}
      <div className="flex gap-2 items-end w-full">
        {userDetail?.picture && (
          <Image
            src={userDetail.picture}
            alt="user"
            height={32}
            width={32}
            className="rounded-full cursor-pointer ring-1 ring-white/10 shrink-0 mb-2"
            onClick={toggleSidebar}
          />
        )}
        <div className="p-3 border border-zinc-800 bg-[#131418] rounded-xl w-full flex flex-col justify-between focus-within:border-zinc-700 transition-colors">
          <textarea
            placeholder={Lookup.INPUT_PLACEHOLDER}
            value={userInput}
            onChange={(event) => setUserInput(event.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (userInput.trim()) {
                  onGenerate(userInput);
                }
              }
            }}
            className="text-white outline-none bg-transparent w-full h-20 max-h-36 resize-none text-sm placeholder-zinc-500 leading-relaxed"
          />
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
            <span className="text-[11px] text-zinc-500 select-none">
              Press Enter to send
            </span>
            <button
              onClick={() => userInput.trim() && onGenerate(userInput)}
              disabled={!userInput.trim() || loading}
              className={`p-2 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                userInput.trim()
                  ? "bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              }`}
            >
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
