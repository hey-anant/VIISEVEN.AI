"use client";
import Lookup from "@/data/Lookup";
import { ArrowRight } from "lucide-react";
import React, { useState, useContext } from "react";
import { MessageContext } from "@/context/MessageContext";
import { UserDetailContext } from "@/context/UserDetailContext";
import { useMutation } from "convex/react";
import SignInDialog from "./SignInDialog";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import uuid4 from "uuid4";

const Hero = () => {
  const [userInput, setUserInput] = useState("");
  const { setMessages } = useContext(MessageContext);
  const { userDetail, setUserDetail } = useContext(UserDetailContext);
  const [openDialog, setOpenDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const CreateWorkspace = useMutation(api.workspace.CreateWorkspace);
  const createUser = useMutation(api.users.createUser);
  const router = useRouter();

  const onGenerate = async (input) => {
    const trimmed = input?.trim();
    if (!trimmed || isSubmitting) return;

    // If user is not signed in, create a quick local guest user and sync to Convex
    let currentUser = userDetail;
    if (!currentUser?.name || !currentUser?._id) {
      try {
        const guestEmail = `guest_${Date.now()}@viiseven.local`;
        const guestUid = uuid4();
        await createUser({
          name: "Guest User",
          email: guestEmail,
          picture: "",
          uid: guestUid,
        });

        // Setup guest user in local state
        currentUser = {
          name: "Guest User",
          email: guestEmail,
          picture: "",
          token: 50000,
        };
        setUserDetail(currentUser);
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(currentUser));
        }
      } catch (err) {
        console.warn("Guest auto-create:", err);
        setOpenDialog(true);
        return;
      }
    }

    if (currentUser?.token !== undefined && currentUser?.token < 10) {
      toast.error("You don't have enough tokens!");
      return;
    }

    setIsSubmitting(true);
    try {
      const msg = {
        role: "user",
        content: trimmed,
      };
      setMessages([msg]);

      const workspaceId = await CreateWorkspace({
        user: currentUser?._id,
        messages: [msg],
      });

      router.push("/workspace/" + workspaceId);
    } catch (error) {
      console.error("Failed to create workspace:", error);
      // Fallback: If _id was missing, prompt login dialog
      setOpenDialog(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onGenerate(userInput);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 -mt-10">
      <div className="flex flex-col items-center text-center max-w-3xl w-full">
        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          {Lookup.HERO_HEADING}
        </h1>
        {/* Subheading */}
        <p className="text-gray-400 text-base sm:text-lg mt-3 font-normal">
          {Lookup.HERO_DESC}
        </p>

        {/* Input Card Container */}
        <div className="mt-8 w-full max-w-2xl bg-[#131418] border border-[#23252e] rounded-2xl p-5 shadow-2xl text-left flex flex-col justify-between min-h-[180px] focus-within:border-gray-600 transition-colors">
          <textarea
            placeholder={Lookup.INPUT_PLACEHOLDER}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-white placeholder-gray-500 outline-none resize-none text-base h-28 leading-relaxed"
          />

          {/* Card Bottom Bar */}
          <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
            <span className="text-xs text-gray-500 font-normal select-none">
              Press the arrow to generate
            </span>
            <button
              onClick={() => onGenerate(userInput)}
              disabled={isSubmitting}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                userInput.trim()
                  ? "bg-[#1652f0] hover:bg-[#1244cc] text-white shadow-md shadow-blue-500/20 active:scale-95"
                  : "bg-[#1a2b4c] text-blue-400 hover:bg-[#1652f0] hover:text-white"
              }`}
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* Staggered Suggestion Chips */}
        <div className="mt-8 flex flex-col items-center gap-2.5 max-w-2xl">
          {/* Row 1 */}
          <div className="flex flex-wrap justify-center gap-2.5">
            <button
              onClick={() => onGenerate(Lookup.SUGGESTIONS[0])}
              className="px-4 py-2 border border-[#272a34] bg-[#14151b]/70 hover:bg-[#1f212a] hover:border-gray-600 rounded-full text-xs sm:text-sm text-gray-300 hover:text-white transition-all cursor-pointer"
            >
              {Lookup.SUGGESTIONS[0]}
            </button>
            <button
              onClick={() => onGenerate(Lookup.SUGGESTIONS[1])}
              className="px-4 py-2 border border-[#272a34] bg-[#14151b]/70 hover:bg-[#1f212a] hover:border-gray-600 rounded-full text-xs sm:text-sm text-gray-300 hover:text-white transition-all cursor-pointer"
            >
              {Lookup.SUGGESTIONS[1]}
            </button>
          </div>

          {/* Row 2 */}
          <div className="flex flex-wrap justify-center gap-2.5">
            <button
              onClick={() => onGenerate(Lookup.SUGGESTIONS[2])}
              className="px-4 py-2 border border-[#272a34] bg-[#14151b]/70 hover:bg-[#1f212a] hover:border-gray-600 rounded-full text-xs sm:text-sm text-gray-300 hover:text-white transition-all cursor-pointer"
            >
              {Lookup.SUGGESTIONS[2]}
            </button>
            <button
              onClick={() => onGenerate(Lookup.SUGGESTIONS[3])}
              className="px-4 py-2 border border-[#272a34] bg-[#14151b]/70 hover:bg-[#1f212a] hover:border-gray-600 rounded-full text-xs sm:text-sm text-gray-300 hover:text-white transition-all cursor-pointer"
            >
              {Lookup.SUGGESTIONS[3]}
            </button>
          </div>

          {/* Row 3 */}
          <div className="flex flex-wrap justify-center gap-2.5">
            <button
              onClick={() => onGenerate(Lookup.SUGGESTIONS[4])}
              className="px-4 py-2 border border-[#272a34] bg-[#14151b]/70 hover:bg-[#1f212a] hover:border-gray-600 rounded-full text-xs sm:text-sm text-gray-300 hover:text-white transition-all cursor-pointer"
            >
              {Lookup.SUGGESTIONS[4]}
            </button>
          </div>
        </div>
      </div>

      <SignInDialog
        openDialog={openDialog}
        closeDialog={(v) => setOpenDialog(v)}
      />
    </div>
  );
};

export default Hero;

