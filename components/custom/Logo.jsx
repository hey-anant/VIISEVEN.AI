"use client";
import React from "react";
import { useTheme } from "next-themes";
import Link from "next/link";

const Logo = ({ className = "", linkTo = "/" }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Link href={linkTo} className={`inline-flex items-center gap-2 group ${className}`}>
      {/* Icon mark */}
      <div className="relative">
        <svg
          width="36"
          height="36"
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 group-hover:scale-110"
        >
          {/* Background circle with gradient */}
          <defs>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
            <linearGradient id="logoGradHover" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="50%" stopColor="#818CF8" />
              <stop offset="100%" stopColor="#A78BFA" />
            </linearGradient>
          </defs>
          <rect width="36" height="36" rx="10" fill="url(#logoGrad)" />
          {/* VII text inside the icon */}
          <text
            x="18"
            y="24"
            textAnchor="middle"
            fill="white"
            fontSize="16"
            fontWeight="800"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="-0.5"
          >
            VII
          </text>
        </svg>
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-[10px] bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-violet-500/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
      </div>

      {/* Text mark */}
      <span className="flex items-baseline">
        <span
          className="text-xl font-extrabold tracking-tight transition-colors duration-300"
          style={{
            background: "linear-gradient(135deg, #3B82F6, #6366F1, #8B5CF6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          VIISEVEN
        </span>
        <span
          className="text-[10px] font-semibold ml-1 transition-colors duration-300"
          style={{ color: isDark ? "#6B7280" : "#9CA3AF" }}
        >
          .AI
        </span>
      </span>
    </Link>
  );
};

export default Logo;
