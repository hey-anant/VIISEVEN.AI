"use client";

import React, { useState, useEffect } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import Header from "@/components/custom/Header";
import { MessageContext } from "@/context/MessageContext";
import { UserDetailContext } from "@/context/UserDetailContext";

import { SidebarProvider } from "@/components/ui/sidebar"; 
import AppSideBar from "@/components/custom/AppSideBar";
import { ActionContext } from "@/context/ActionContext";
import { usePathname, useRouter } from "next/navigation";
import { useConvex, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import uuid4 from "uuid4";

function Provider({ children }) {
  // State for contexts
  const [messages, setMessages] = useState();
  const [userDetail, setUserDetail] = useState();
  const [action, setAction] = useState();
  const router=useRouter();
  const pathname = usePathname();
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_AUTH_CLIENT_ID_KEY;
  const convex = useConvex();
  const createUser = useMutation(api.users.createUser);

  // Load user from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setUserDetail(JSON.parse(storedUser));
        } catch (error) {
          console.error("Error parsing stored user:", error);
          localStorage.removeItem("user");
        }
      }
    }
  }, []);

  // Auto-sync: if user has email but no Convex _id, fetch/create in Convex
  useEffect(() => {
    const syncUserWithConvex = async () => {
      if (!userDetail?.email || userDetail?._id) return;

      try {
        // Check if user already exists in Convex
        let dbUser = await convex.query(api.users.getUsers, {
          email: userDetail.email,
        });

        // If not found, create them first
        if (!dbUser?._id) {
          await createUser({
            name: userDetail.name || '',
            email: userDetail.email,
            picture: userDetail.picture || '',
            uid: uuid4(),
          });

          // Fetch the newly created user
          dbUser = await convex.query(api.users.getUsers, {
            email: userDetail.email,
          });
        }

        if (dbUser?._id) {
          const syncedUser = {
            ...userDetail,
            _id: dbUser._id,
            token: dbUser.token ?? userDetail.token ?? 50000,
          };
          setUserDetail(syncedUser);
          if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(syncedUser));
          }
          console.log('User synced with Convex:', syncedUser);
        }
      } catch (error) {
        console.error('Error syncing user with Convex:', error);
      }
    };

    syncUserWithConvex();
  }, [userDetail?.email, userDetail?._id]);

  // Redirect unauthenticated users to home
  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem("user") && pathname !== '/') {
      router.push('/')
    }
  }, [pathname, router]);

  const appTree = (
    <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
      <MessageContext.Provider value={{ messages, setMessages }}>
        {/* FIX: Ensuring correct component capitalization (.Provider) */}
        <ActionContext.Provider value={{ action, setAction }}>
          {/* 2. SidebarProvider must wrap components that use its context (Header, AppSideBar) */}
          <SidebarProvider defaultOpen={false}> 
            <NextThemesProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              {/* 3. Layout Fix: Define the full-screen structure (Header, Sidebar, Content) */}
              <div className="flex flex-col h-screen w-full">
                {/* Header spans the top */}
                <Header /> 
                {/* Main content area: Sidebar and Page Content (takes up remaining height) */}
                <div className="flex flex-1 overflow-hidden">
                  <AppSideBar />
                  {/* Page Content: takes up remaining space and scrolls */}
                  <main className="flex-1 overflow-y-auto">
                    {children}
                  </main>
                </div>
              </div>
            </NextThemesProvider>
          </SidebarProvider>
        </ActionContext.Provider>
      </MessageContext.Provider>
    </UserDetailContext.Provider>
  );

  if (!googleClientId) {
    return appTree;
  }

  return <GoogleOAuthProvider clientId={googleClientId}>{appTree}</GoogleOAuthProvider>;
}

export default Provider;