"use client";
import { UserDetailContext } from "@/context/UserDetailContext";
import { api } from "@/convex/_generated/api";
import { useConvex, useMutation } from "convex/react";
import Link from "next/link";
import React, { useContext, useEffect, useState } from "react";
import { useSidebar } from "../ui/sidebar";
import { Trash2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

const WorkspaceHistory = () => {
  const { userDetail } = useContext(UserDetailContext);
  const convex = useConvex();
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const DeleteWorkspace = useMutation(api.workspace.DeleteWorkspace);

  const [workspaceList, setWorkspaceList] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  
  // Extract current workspace ID from pathname
  const currentWorkspaceId = pathname?.split("/workspace/")?.[1];

  useEffect(() => {
    userDetail?._id ? GetAllWorkspace() : setWorkspaceList([]);
  }, [userDetail]);

  const GetAllWorkspace = async () => {
    const result = await convex.query(api.workspace.GetAllWorkspace, {
      userId: userDetail?._id,
    });
    setWorkspaceList(result || []);
  };

  const handleDelete = async (e, workspaceId) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingId(workspaceId);
    try {
      await DeleteWorkspace({ workspaceId });
      setWorkspaceList((prev) => prev.filter((w) => w._id !== workspaceId));
      toast.success("Chat deleted");
    } catch (error) {
      console.error("Error deleting workspace:", error);
      toast.error("Failed to delete chat");
    }
    setDeletingId(null);
  };

  return (
    <div>
      <h2 className="font-medium text-lg flex items-center gap-2">
        <MessageSquare size={18} className="text-blue-500" />
        Your Chats
      </h2>
      <div className="mt-2 space-y-1">
        {workspaceList?.map((workspace, index) => {
          const isActive = currentWorkspaceId === workspace._id;
          return (
            <div
              key={workspace._id || index}
              className={`group flex items-center gap-1 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-blue-500/20 border-l-2 border-blue-500 hover:bg-blue-500/30"
                  : "hover:bg-white/5"
              }`}
            >
              <Link
                href={"/workspace/" + workspace?._id}
                className="flex-1 min-w-0"
                onClick={toggleSidebar}
              >
                <h2
                  className={`text-sm py-2 px-2 font-light cursor-pointer truncate ${
                    isActive
                      ? "text-blue-300 font-medium"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {workspace?.messages?.[0]?.content || "Untitled chat"}
                </h2>
              </Link>
              <button
                onClick={(e) => handleDelete(e, workspace._id)}
                disabled={deletingId === workspace._id}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all duration-200 shrink-0 cursor-pointer"
                title="Delete chat"
              >
                <Trash2
                  size={14}
                  className={deletingId === workspace._id ? "animate-spin" : ""}
                />
              </button>
            </div>
          );
        })}
        {workspaceList?.length === 0 && (
          <p className="text-xs text-gray-500 mt-2 px-2">No chats yet</p>
        )}
      </div>
    </div>
  );
};

export default WorkspaceHistory;
