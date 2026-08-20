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
import { MessageCircleCode } from "lucide-react";
import WorkspaceHistory from "./WorkspaceHistory";
import Link from "next/link";
import Logo from "./Logo";

function AppSideBar() {
  return (
    <Sidebar>
      <SidebarHeader className="p-5">
        <Logo />
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
