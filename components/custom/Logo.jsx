"use client";
import React from "react";
import Link from "next/link";

const Logo = ({ className = "", linkTo = "/" }) => {
  return (
    <Link
      href={linkTo}
      className={`inline-flex items-center gap-1.5 font-bold tracking-tight text-white transition-opacity hover:opacity-90 ${className}`}
    >
      <span className="text-base sm:text-lg font-extrabold tracking-wider font-sans">
        VIISEVEN<span className="text-gray-300 font-bold">.AI</span>
      </span>
    </Link>
  );
};

export default Logo;

