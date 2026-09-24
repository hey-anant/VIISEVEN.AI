"use client";
import React, { useContext, useEffect, useState, useMemo } from "react";
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
import { Loader2Icon, Play, Code as CodeIcon, Eye } from "lucide-react";
import { countToken } from "./ChatView";
import { UserDetailContext } from "@/context/UserDetailContext";
import SandPackPreviewClient from "./SandPackPreviewClient";
import { ActionContext } from "@/context/ActionContext";
import { toast } from "sonner";
import { useTheme } from "next-themes";

function sanitizeSandpackFiles(rawFiles) {
  if (!rawFiles || typeof rawFiles !== "object") {
    return Lookup?.DEFAULT_FILE || {};
  }

  const clean = {};
  for (const [key, val] of Object.entries(rawFiles)) {
    if (!key || typeof key !== "string") continue;
    let path = key.trim();
    if (!path.startsWith("/")) {
      path = "/" + path;
    }

    if (val === null || val === undefined) {
      clean[path] = { code: "" };
    } else if (typeof val === "string") {
      clean[path] = { code: val };
    } else if (typeof val === "object") {
      clean[path] = {
        code: typeof val.code === "string" ? val.code : String(val.code || ""),
        ...(val.active ? { active: true } : {}),
        ...(val.hidden ? { hidden: true } : {}),
      };
    }
  }

  // Fallback defaults if essential files are missing
  if (!clean["/App.js"]) {
    clean["/App.js"] = Lookup?.DEFAULT_FILE?.["/App.js"] || {
      code: "export default function App() { return <div>App Loaded</div>; }",
    };
  }
  if (!clean["/index.js"]) {
    clean["/index.js"] = Lookup?.DEFAULT_FILE?.["/index.js"];
  }

  return clean;
}

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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sanitizedFiles = useMemo(() => {
    return sanitizeSandpackFiles(files);
  }, [files]);

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
        setFiles(sanitizeSandpackFiles(mergedFiles));
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
        const cleanGenerated = sanitizeSandpackFiles(aiResp.files);
        const mergedFiles = { ...Lookup.DEFAULT_FILE, ...cleanGenerated };
        setFiles(mergedFiles);

        await UpdateFiles({
          workspaceId: id,
          files: cleanGenerated,
        });

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

  // Prevent SSR hydration mismatch from dynamic client theme resolution
  const sandpackTheme = mounted && resolvedTheme === "light" ? "light" : "dark";

  return (
    <div className="relative border border-border rounded-xl overflow-hidden bg-background shadow-xl">
      {/* Top Header Bar */}
      <div className="bg-card px-4 py-2.5 border-b border-border flex items-center justify-between flex-wrap gap-2">
        {/* Tab Switcher */}
        <div className="flex items-center bg-muted p-1 rounded-xl border border-border">
          <button
            onClick={() => setActiveTab("code")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === "code"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
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
                : "text-muted-foreground hover:text-foreground"
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
            className="flex items-center gap-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer active:scale-95"
            title="Re-run & refresh preview"
          >
            <Play size={13} className="fill-current" />
            Run App
          </button>
        </div>
      </div>

      {/* Sandpack Provider & Layout */}
      {!mounted ? (
        <div className="h-[78vh] flex items-center justify-center text-muted-foreground text-sm">
          Loading editor...
        </div>
      ) : (
        <SandpackProvider
          key={`${reloadKey}_${sandpackTheme}`}
          files={sanitizedFiles}
          template="react"
          theme={sandpackTheme}
          customSetup={{
            dependencies: {
              ...Lookup.DEPENDANCY,
            },
          }}
          options={{
            activeFile: "/App.js",
            visibleFiles: ["/App.js", "/styles.css"],
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
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-3">
          <Loader2Icon className="animate-spin h-10 w-10 text-blue-500" />
          <h2 className="text-foreground font-medium text-base">
            Generating and compiling your application...
          </h2>
          <p className="text-muted-foreground text-xs">
            Writing React components, styling with Tailwind CSS, and mounting Sandpack runtime.
          </p>
        </div>
      )}
    </div>
  );
};

export default CodeView;
