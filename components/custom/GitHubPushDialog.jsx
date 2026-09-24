"use client";
import React, { useState, useContext } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { UserDetailContext } from "@/context/UserDetailContext";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import {
  Github,
  Loader2,
  Lock,
  Globe,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Lookup from "@/data/Lookup";

const GitHubPushDialog = ({ open, onOpenChange, openSignIn }) => {
  const { userDetail } = useContext(UserDetailContext);
  const convex = useConvex();
  const { id } = useParams() || {};
  const [repoName, setRepoName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [result, setResult] = useState(null);

  const hasGitHubToken = !!userDetail?.githubAccessToken;

  const handlePush = async () => {
    if (!repoName.trim()) {
      toast.error("Please enter a repository name.");
      return;
    }

    if (!hasGitHubToken) {
      toast.error("Please connect your GitHub account first.");
      return;
    }

    if (!id) {
      toast.error("No workspace selected. Open a workspace first.");
      return;
    }

    setPushing(true);
    setResult(null);

    try {
      const workspace = await convex.query(api.workspace.GetWorkspace, {
        workspaceId: id,
      });

      const filesToPush = { ...(Lookup?.DEFAULT_FILE || {}), ...(workspace?.fileData || {}) };
      const projectDesc = workspace?.messages?.[0]?.content || "A React application built with VIISEVEN.AI";

      // Append README.md and package.json if not present
      if (!filesToPush["/README.md"]) {
        filesToPush["/README.md"] = {
          code: `# ${repoName}\n\n${description || projectDesc}\n\n## Built With\n- [VIISEVEN.AI](https://viiseven.ai)\n- React & Tailwind CSS\n`,
        };
      }

      const response = await axios.post("/api/github/push", {
        repoName: repoName.trim(),
        files: filesToPush,
        accessToken: userDetail.githubAccessToken,
        isPrivate,
        description: description || projectDesc,
      });

      if (response.data.success) {
        setResult({ success: true, repoUrl: response.data.repoUrl });
        toast.success("Project pushed to GitHub successfully! 🚀");
      } else {
        setResult({ error: response.data.error });
        toast.error(response.data.error || "Push failed.");
      }
    } catch (error) {
      console.error("GitHub push error:", error);
      const errMsg = error.response?.data?.error || error.message;
      setResult({ error: errMsg });
      toast.error("Push failed: " + errMsg);
    }
    setPushing(false);
  };

  const handleClose = (openVal) => {
    if (!openVal) {
      setResult(null);
      setRepoName("");
      setDescription("");
      setIsPrivate(false);
    }
    onOpenChange(openVal);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] border-border bg-card text-card-foreground backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            <div className="p-2 rounded-lg bg-muted text-foreground">
              <Github size={20} />
            </div>
            Push to GitHub
          </DialogTitle>
        </DialogHeader>

        {!hasGitHubToken ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="p-4 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500">
              <AlertCircle size={32} />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg text-foreground">GitHub Account Not Linked</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Sign in with GitHub or connect your GitHub account to push projects directly into your repositories.
              </p>
            </div>
            <Button
              className="bg-[#24292e] text-white hover:bg-[#2f363d] cursor-pointer mt-2"
              onClick={() => {
                onOpenChange(false);
                if (openSignIn) openSignIn(true);
              }}
            >
              <Github size={18} />
              Connect GitHub Account
            </Button>
          </div>
        ) : result?.success ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
              <CheckCircle2 size={32} />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg text-foreground">Pushed Successfully! 🎉</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your project is live in your GitHub repository.
              </p>
            </div>
            <a
              href={result.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#24292e] text-white hover:bg-[#2f363d] font-medium text-sm px-5 py-2.5 rounded-xl transition-all shadow-md"
            >
              <ExternalLink size={16} />
              Open Repository
            </a>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">
                Repository Name
              </label>
              <Input
                placeholder="my-cool-project"
                value={repoName}
                onChange={(e) =>
                  setRepoName(e.target.value.replace(/[^a-zA-Z0-9._-]/g, "-"))
                }
                className="font-mono bg-background text-foreground border-border"
              />
              {repoName && userDetail?.githubUsername && (
                <p className="text-xs text-muted-foreground mt-1">
                  Target: github.com/{userDetail.githubUsername}/{repoName}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">
                Description (optional)
              </label>
              <Input
                placeholder="Built with VIISEVEN.AI"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-background text-foreground border-border"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-foreground">Visibility:</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrivate(false)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    !isPrivate
                      ? "bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  <Globe size={14} />
                  Public
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrivate(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isPrivate
                      ? "bg-amber-600/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  <Lock size={14} />
                  Private
                </button>
              </div>
            </div>

            {result?.error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {result.error}
              </div>
            )}

            <Button
              onClick={handlePush}
              disabled={pushing || !repoName.trim()}
              className="w-full bg-[#24292e] text-white hover:bg-[#2f363d] cursor-pointer mt-2"
            >
              {pushing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Pushing files to GitHub...
                </>
              ) : (
                <>
                  <Github size={16} />
                  Commit & Push to GitHub
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GitHubPushDialog;
