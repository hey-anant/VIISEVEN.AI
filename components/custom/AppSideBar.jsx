import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import SideBarFooter from "./SideBarFooter";
import { Button } from "../ui/button";
import { MessageCircleCode, X } from "lucide-react";
import WorkspaceHistory from "./WorkspaceHistory";
import Link from "next/link";
import Logo from "./Logo";
import { useSidebar } from "../ui/sidebar";

function AppSideBar() {
  const { toggleSidebar } = useSidebar();
  
  return (
    <Sidebar>
      <SidebarHeader className="p-5">
        <div className="flex justify-between items-center">
          <Logo />
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="text-gray-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <Link href="/">
          <Button className="mt-3 w-full">
            <MessageCircleCode /> Start new chat
          </Button>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-5 ">
        <WorkspaceHistory />
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter>
        <SideBarFooter />
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSideBar;
