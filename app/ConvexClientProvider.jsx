"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import React, { useMemo } from "react";

function ConvexClientProvider({ children }) {
  const convex = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL || "https://kindly-hedgehog-391.convex.cloud";
    return new ConvexReactClient(url);
  }, []);

  return <ConvexProvider client={convex}>{children}</ConvexProvider>
}

export default ConvexClientProvider;