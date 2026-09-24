"use client";
import { useConvex, useMutation } from "convex/react";
import { useParams } from "next/navigation";
import React, { useEffect, useContext, useState } from "react";
import { api } from "@/convex/_generated/api";
import { MessageContext } from "@/context/MessageContext";
import { UserDetailContext } from "@/context/UserDetailContext";
import Image from "next/image";
import Lookup from "@/data/Lookup";
import { ArrowRight, Loader2Icon } from "lucide-react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import Prompt from "@/data/Prompt";
import { useSidebar } from "../ui/sidebar";
import { toast } from "sonner";

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
      setMessages([]);
    }
  };

  const GenAiResponse = async () => {
    setLoading(true);
    try {
      const PROMPT = JSON.stringify(messages) + Prompt.CHAT_PROMPT;
      const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "";
      const result = await axios.post(`${SERVER_URL}/api/ai-chat`, { prompt: PROMPT });
      
      if (result.data.error) {
        console.error("AI API Error:", result.data.error);
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
    if (userDetail?.token < 10) {
      toast("You don't have enough tokens!");
      return;
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
      <div className="flex items-center justify-center h-[85vh] text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 items-center justify-center relative h-[85vh] p-5">
      <div className="flex-1 overflow-y-scroll scrollbar-hide w-full mb-5 space-y-3">
        {Array.isArray(messages) &&
          messages?.map((msg, index) => (
            <div
              key={index}
              className={`p-3.5 flex gap-3 items-start leading-relaxed rounded-xl border border-border bg-card text-card-foreground shadow-sm`}
            >
              {msg?.role == "user" && userDetail?.picture && (
                <Image
                  src={userDetail.picture}
                  alt="userImage"
                  width={32}
                  height={32}
                  className="rounded-full shrink-0 ring-1 ring-border"
                />
              )}
              <div className="flex flex-col text-sm prose dark:prose-invert max-w-none text-foreground">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          ))}
        {loading && (
          <div className="p-3.5 flex gap-2 items-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm">
            <Loader2Icon className="animate-spin h-4 w-4" />
            <h2 className="text-sm">Generating Response...</h2>
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
            className="rounded-full cursor-pointer ring-1 ring-border shrink-0 mb-2"
            onClick={toggleSidebar}
          />
        )}
        <div className="p-3 border border-border bg-card rounded-xl w-full flex flex-col justify-between focus-within:border-primary/50 transition-colors shadow-sm">
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
            className="text-foreground outline-none bg-transparent w-full h-20 max-h-36 resize-none text-sm placeholder-muted-foreground leading-relaxed"
          />
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-[11px] text-muted-foreground select-none">
              Press Enter to send
            </span>
            <button
              onClick={() => userInput.trim() && onGenerate(userInput)}
              disabled={!userInput.trim() || loading}
              className={`p-2 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                userInput.trim()
                  ? "bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
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
