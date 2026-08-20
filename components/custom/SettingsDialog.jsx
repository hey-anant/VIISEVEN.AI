"use client";
import React, { useContext, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { useTheme } from "next-themes";
import { UserDetailContext } from "@/context/UserDetailContext";
import { useConvex, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, usePathname } from "next/navigation";
import {
  Sun,
  Moon,
  Monitor,
  Trash2,
  Download,
  Palette,
  History,
  FileArchive,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const ThemeOption = ({ icon: Icon, label, value, currentTheme, onClick }) => {
  const isActive = currentTheme === value;
  return (
    <button
      onClick={() => onClick(value)}
      className={`
        flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer
        ${
          isActive
            ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10 scale-105"
            : "border-transparent bg-white/5 hover:bg-white/10 hover:border-white/20"
        }
      `}
    >
      <Icon
        size={24}
        className={`transition-colors duration-300 ${
          isActive ? "text-blue-500" : "text-muted-foreground"
        }`}
      />
      <span
        className={`text-sm font-medium transition-colors duration-300 ${
          isActive ? "text-blue-500" : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
    </button>
  );
};

const SettingsDialog = ({ open, onOpenChange }) => {
  const { theme, setTheme } = useTheme();
  const { userDetail } = useContext(UserDetailContext);
  const convex = useConvex();
  const pathname = usePathname();
  const params = useParams();
  const DeleteAllWorkspaces = useMutation(api.workspace.DeleteAllWorkspaces);
  const [deletingAll, setDeletingAll] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isWorkspacePage = pathname?.includes("workspace");
  const workspaceId = params?.id;

  const handleDeleteAllHistory = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    if (!userDetail?._id) {
      toast.error("You must be signed in to delete history.");
      return;
    }

    setDeletingAll(true);
    try {
      await DeleteAllWorkspaces({ userId: userDetail._id });
      toast.success("All workspace history deleted.");
      setConfirmDelete(false);
    } catch (error) {
      console.error("Error deleting all workspaces:", error);
      toast.error("Failed to delete history. Please try again.");
    }
    setDeletingAll(false);
  };

  const handleExportFiles = async () => {
    if (!workspaceId) {
      toast.error("No workspace selected to export.");
      return;
    }

    setExporting(true);
    try {
      const workspace = await convex.query(api.workspace.GetWorkspace, {
        workspaceId: workspaceId,
      });

      if (!workspace?.fileData) {
        toast.error("No files found in this workspace.");
        setExporting(false);
        return;
      }

      const zip = new JSZip();
      const files = workspace.fileData;

      Object.entries(files).forEach(([filePath, fileData]) => {
        // Remove leading slash for zip path
        const cleanPath = filePath.startsWith("/")
          ? filePath.slice(1)
          : filePath;
        const code =
          typeof fileData === "string" ? fileData : fileData?.code || "";
        zip.file(cleanPath, code);
      });

      const blob = await zip.generateAsync({ type: "blob" });
      const projectName =
        workspace?.messages?.[0]?.content?.slice(0, 30)?.replace(/[^a-zA-Z0-9]/g, "_") ||
        "viiseven-project";
      saveAs(blob, `${projectName}.zip`);
      toast.success("Files exported successfully!");
    } catch (error) {
      console.error("Error exporting files:", error);
      toast.error("Failed to export files.");
    }
    setExporting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-white/10 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-violet-500/20">
              <Palette size={20} className="text-blue-500" />
            </div>
            Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* ─── Theme Section ─── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              <Palette size={14} />
              Appearance
            </div>
            <div className="grid grid-cols-3 gap-3">
              <ThemeOption
                icon={Sun}
                label="Light"
                value="light"
                currentTheme={theme}
                onClick={setTheme}
              />
              <ThemeOption
                icon={Moon}
                label="Dark"
                value="dark"
                currentTheme={theme}
                onClick={setTheme}
              />
              <ThemeOption
                icon={Monitor}
                label="System"
                value="system"
                currentTheme={theme}
                onClick={setTheme}
              />
            </div>
          </div>

          {/* ─── Divider ─── */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* ─── Delete History Section ─── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              <History size={14} />
              Chat History
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
              <div>
                <p className="text-sm font-medium">Delete all history</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Permanently remove all your workspace chats
                </p>
              </div>
              <Button
                variant={confirmDelete ? "destructive" : "outline"}
                size="sm"
                onClick={handleDeleteAllHistory}
                disabled={deletingAll || !userDetail?._id}
                className={`transition-all duration-300 cursor-pointer ${
                  confirmDelete
                    ? "bg-red-500/90 hover:bg-red-600 border-red-500 animate-pulse"
                    : ""
                }`}
              >
                {deletingAll ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : confirmDelete ? (
                  <>
                    <AlertTriangle size={16} /> Confirm
                  </>
                ) : (
                  <>
                    <Trash2 size={16} /> Delete All
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* ─── Divider ─── */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* ─── Export Files Section ─── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              <FileArchive size={14} />
              Export
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
              <div>
                <p className="text-sm font-medium">Download project files</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isWorkspacePage
                    ? "Export current workspace as a ZIP file"
                    : "Open a workspace first to export files"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportFiles}
                disabled={exporting || !isWorkspacePage}
                className="cursor-pointer"
              >
                {exporting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Download size={16} /> Export ZIP
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
