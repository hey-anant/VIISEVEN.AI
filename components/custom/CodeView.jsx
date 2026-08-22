"use client";
import React, { useContext, useEffect, useState } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackFileExplorer,
} from "@codesandbox/sandpack-react";
import Lookup from "@/data/Lookup";
import { MessageContext } from "@/context/MessageContext";
import axios from "axios";
import Prompt from "@/data/Prompt";
import { useConvex, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Loader2Icon, Play, RefreshCw, Code as CodeIcon, Eye } from "lucide-react";
import { countToken } from "./ChatView";
import { UserDetailContext } from "@/context/UserDetailContext";
import SandPackPreviewClient from "./SandPackPreviewClient";
import { ActionContext } from "@/context/ActionContext";
import { toast } from "sonner";

const CodeView = () => {
  const { userDetail, setUserDetail } = useContext(UserDetailContext);
  const [activeTab, setActiveTab] = useState("preview");
  const { id } = useParams();
  const [files, setFiles] = useState(Lookup?.DEFAULT_FILE);
  const { messages } = useContext(MessageContext);
  const UpdateFiles = useMutation(api.workspace.UpdateFiles);
  const convex = useConvex();
  const [loading, setLoading] = useState(false);
  const UpdateTokens = useMutation(api.users.UpdateToken);
  const { action } = useContext(ActionContext);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (id) {
      GetFiles();
    }
  }, [id]);

  useEffect(() => {
    if (action) {
      setActiveTab("preview");
    }
  }, [action]);

  const GetFiles = async () => {
    setLoading(true);
    try {
      const result = await convex.query(api.workspace.GetWorkspace, {
        workspaceId: id,
      });
      if (result?.fileData && Object.keys(result.fileData).length > 0) {
        const mergedFiles = { ...Lookup.DEFAULT_FILE, ...result.fileData };
        setFiles(mergedFiles);
      }
    } catch (err) {
      console.error("Error fetching workspace files:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (messages?.length > 0) {
      const role = messages[messages.length - 1].role;
      if (role === "user") {
        const timer = setTimeout(() => GenerateAiCode(), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [messages]);

  const GenerateAiCode = async () => {
    setLoading(true);
    try {
      const PROMPT = JSON.stringify(messages) + " " + Prompt.CODE_GEN_PROMPT;
      const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "";
      const result = await axios.post(
        `${SERVER_URL}/api/gen-ai-code`,
        { prompt: PROMPT },
        { timeout: 120000 }
      );

      const aiResp = result.data;
      if (aiResp?.error) {
        if (aiResp.error.includes("429") || aiResp.error.includes("quota")) {
          toast.error("Gemini API rate limit exceeded. Please wait a moment and try again.");
        } else {
          toast.error("AI Error: " + aiResp.error);
        }
        setLoading(false);
        return;
      }

      if (aiResp?.files && Object.keys(aiResp.files).length > 0) {
        const mergedFiles = { ...Lookup.DEFAULT_FILE, ...aiResp.files };
        setFiles(mergedFiles);

        await UpdateFiles({
          workspaceId: id,
          files: aiResp.files,
        });

        // Automatically switch to preview to see running app
        setActiveTab("preview");
        setReloadKey((prev) => prev + 1);
        toast.success("App code generated and running successfully!");
      }

      const token =
        Number(userDetail?.token || 50000) -
        Number(countToken(JSON.stringify(aiResp || {})));

      if (userDetail?._id) {
        await UpdateTokens({
          userId: userDetail._id,
          token: token,
        });
      }
      setUserDetail((prev) =>
        prev
          ? {
              ...prev,
              token: token,
            }
          : prev
      );
    } catch (error) {
      console.error("Error in GenerateAiCode:", error);
      const errMsg = error.response?.data?.error || error.message;
      toast.error("Code generation failed: " + (errMsg || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleRunRefresh = () => {
    setReloadKey((prev) => prev + 1);
    setActiveTab("preview");
    toast.success("Reloading preview...");
  };

  return (
    <div className="relative border border-zinc-800 rounded-xl overflow-hidden bg-[#0c0d10] shadow-xl">
      {/* Top Header Bar */}
      <div className="bg-[#121318] px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between flex-wrap gap-2">
        {/* Tab Switcher */}
        <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab("code")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === "code"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <CodeIcon size={14} />
            Code
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === "preview"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Eye size={14} />
            Preview
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunRefresh}
            className="flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer active:scale-95"
            title="Re-run & refresh preview"
          >
            <Play size={13} className="fill-current" />
            Run App
          </button>
        </div>
      </div>

      {/* Sandpack Provider & Layout */}
      <SandpackProvider
        key={`${JSON.stringify(files)}_${reloadKey}`}
        files={files}
        template="react"
        theme="dark"
        customSetup={{
          dependencies: {
            ...Lookup.DEPENDANCY,
          },
        }}
        options={{
          externalResources: ["https://cdn.tailwindcss.com"],
        }}
      >
        <SandpackLayout className="!border-none !rounded-none">
          {activeTab === "code" ? (
            <>
              <SandpackFileExplorer style={{ height: "78vh" }} />
              <SandpackCodeEditor
                style={{ height: "78vh" }}
                showLineNumbers={true}
                showInlineErrors={true}
                wrapContent={true}
              />
            </>
          ) : (
            <SandPackPreviewClient />
          )}
        </SandpackLayout>
      </SandpackProvider>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-3">
          <Loader2Icon className="animate-spin h-10 w-10 text-blue-500" />
          <h2 className="text-white font-medium text-base">
            Generating and compiling your application...
          </h2>
          <p className="text-zinc-400 text-xs">
            Writing React components, styling with Tailwind CSS, and mounting Sandpack runtime.
          </p>
        </div>
      )}
    </div>
  );
};

export default CodeView;