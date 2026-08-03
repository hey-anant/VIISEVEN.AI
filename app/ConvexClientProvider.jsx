"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import React, { useMemo } from "react";

function ConvexClientProvider({ children }) {
  const convex = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      throw new Error("NEXT_PUBLIC_CONVEX_URL is not set. Check your .env.local file.");
    }
    return new ConvexReactClient(url);
  }, []);

  return <ConvexProvider client={convex}>{children}</ConvexProvider>
}

export default ConvexClientProvider;