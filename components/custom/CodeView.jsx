"use client";
import React, { useContext, useEffect, useState } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackFileExplorer,
} from "@codesandbox/sandpack-react";
import Lookup from "@/data/Lookup";
import { MessageContext } from "@/context/MessageContext";
import axios from "axios";
import Prompt from "@/data/Prompt";
import { useConvex, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { countToken } from "./ChatView";
import { UserDetailContext } from "@/context/UserDetailContext";
import SandPackPreviewClient from "./SandPackPreviewClient";
import { ActionContext } from "@/context/ActionContext";
import { toast } from "sonner";

const CodeView = () => {
  const { userDetail, setUserDetail } = useContext(UserDetailContext)
  const [activeTab, setActiveTab] = useState('code')
  const { id } = useParams()
  const [files, setFiles] = useState(Lookup?.DEFAULT_FILE)
  const { messages, setMessages } = useContext(MessageContext);
  const UpdateFiles = useMutation(api.workspace.UpdateFiles)
  const convex = useConvex();
  const [loading, setLoading] = useState(false)
  const UpdateTokens = useMutation(api.users.UpdateToken)
  const { action, setAction } = useContext(ActionContext)

  useEffect(() => {
    id && GetFiles()
  }, [id])

  useEffect(() => {
    setActiveTab('preview');
  }, [action])

  const GetFiles = async () => {
    setLoading(true)
    const result = await convex.query(api.workspace.GetWorkspace, {
      workspaceId: id
    });
    const mergedFiles = { ...Lookup.DEFAULT_FILE, ...result?.fileData }
    setFiles(mergedFiles)
    setLoading(false)
  }


  useEffect(() => {
    if (messages?.length > 0) {
      const role = messages[messages?.length - 1].role;
      if (role == 'user') {
        // Stagger: delay code generation so ChatView's lighter API call
        // fires first, reducing concurrent Gemini API pressure and 429s.
        const timer = setTimeout(() => GenerateAiCode(), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [messages])



  const GenerateAiCode = async () => {
    setLoading(true);
    try {
      const PROMPT = JSON.stringify(messages) + " " + Prompt.CODE_GEN_PROMPT;
      const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "";
      const result = await axios.post(`${SERVER_URL}/api/gen-ai-code`, {
        prompt: PROMPT
      });
      
      const aiResp = result.data;
      if (aiResp?.error) {
        if (aiResp.error.includes("429") || aiResp.error.includes("quota")) {
          toast.error("Gemini API rate limit exceeded. Please wait a minute and try again.");
        } else {
          toast.error("AI Error: " + aiResp.error);
        }
        setLoading(false);
        return;
      }

      const mergedFiles = { ...Lookup.DEFAULT_FILE, ...aiResp?.files };
      setFiles(mergedFiles);

      if (aiResp?.files) {
        await UpdateFiles({
          workspaceId: id,
          files: aiResp.files
        });
      }

      setActiveTab('code');
      const token =
        Number(userDetail?.token) - Number(countToken(JSON.stringify(aiResp)));

      if (userDetail?._id) {
        await UpdateTokens({
          userId: userDetail?._id,
          token: token,
        });
      }
      setUserDetail(prev => (prev ? ({
        ...prev,
        token: token
      }) : prev));
      setActiveTab('code');
    } catch (error) {
      console.error("Error in GenerateAiCode:", error);
      const errMsg = error.response?.data?.error || error.message;
      if (errMsg && (errMsg.includes("429") || errMsg.includes("quota"))) {
        toast.error("Gemini API rate limit exceeded. Please wait a minute and try again.");
      } else {
        toast.error("Failed to generate code files. Please try again.");
      }
    }
    setLoading(false);
  };




  return (
    <div>
      <div className="bg-[#181818] p-2 w-full border">
        <div className="flex items-center flex-wrap shrink-0 bg-black p-1 px-2 rounded-full justify-center gap-3 w-[140px] "  >
          <h2 className={`text-sm cursor-pointer ${activeTab == 'code' && 'text-blue-500  bg-blue-500/25 p-1 rounded-full'} `} onClick={() => { setActiveTab('code') }}>Code</h2>
          <h2 className={`text-sm cursor-pointer ${activeTab == 'preview' && 'text-blue-500 bg-blue-500/25 p-1 rounded-full'} `} onClick={() => { setActiveTab('preview') }} >Preview</h2>
        </div>
      </div>
      <SandpackProvider key={JSON.stringify(files)} files={files} template="react" theme={"dark"} customSetup={{
        dependencies: {
          ...Lookup.DEPENDANCY
        }
      }}
        options={{
          externalResources: ['https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4']
        }}   >
        <SandpackLayout>
          {activeTab == 'code' ? (<>

            <SandpackFileExplorer style={{ height: "80vh" }} />
            <SandpackCodeEditor style={{ height: "80vh" }} />

          </>) : (

            <SandPackPreviewClient />
          )}
        </SandpackLayout>
      </SandpackProvider>

      {loading && <div className="p-10 bg-gray-900 opacity-90 absolute top-0 rounded-lg w-full h-full flex items-center justify-center" >
        <Loader2Icon className="animate-spin h-10 w-10 text-white " />
        <h2 className="text-white">Generating your files...</h2>
      </div>}
    </div>
  );
};

export default CodeView;