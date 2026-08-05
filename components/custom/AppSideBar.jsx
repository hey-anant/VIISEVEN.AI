import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import SideBarFooter from "./SideBarFooter";
import Image from "next/image";
import { Button } from "../ui/button";
import { MessageCircleCode } from "lucide-react";
import WorkspaceHistory from "./WorkspaceHistory";
import Link from "next/link";

function AppSideBar() {
  return (
    <Sidebar>
      <SidebarHeader className="p-5">
        <Image src="/logo.svg" alt="VIISEVEN Logo" width={140} height={40} className="h-10 w-auto" priority />
        <Link href="/">
          <Button className="mt-3 w-full">
            <MessageCircleCode /> Start new chat
          </Button>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-5 ">
        <WorkspaceHistory />
        <SidebarGroup />
        {/* <SidebarGroup /> */}
      </SidebarContent>
      <SidebarFooter>
        <SideBarFooter />
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSideBar;
