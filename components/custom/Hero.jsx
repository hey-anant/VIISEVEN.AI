"use client";
import Lookup from "@/data/Lookup";
import Colors from "@/data/Colors";
import { ArrowRight, Link } from "lucide-react";
import React, { useState, useContext } from "react";
import { MessageContext } from "@/context/MessageContext";
import { UserDetailContext } from "@/context/UserDetailContext";
import { useMutation } from "convex/react";
import SignInDialog from "./SignInDialog";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const Hero = () => {
  const [userInput, setUserInput] = useState("");
  const { messages, setMessages } = useContext(MessageContext);
  const { userDetail, setUserDetail } = useContext(UserDetailContext);
  const [openDialog, setOpenDialog] = useState(false);
  const CreateWorkspace = useMutation(api.workspace.CreateWorkspace);

  const router = useRouter();
  const onGenerate = async (input) => {
    if (!userDetail?.name) {
      setOpenDialog(true);
      return;
    }
    if (!userDetail?._id) {
      toast.error('Workspace features require a synced Convex user. Deploy the Convex backend or sign in with an existing workspace user.')
      return;
    }
    if (userDetail?.token < 10) {
      toast("You dont have enough token!");
      return;
    }
    const msg = {
      role: "user",
      content: input,
    };
    setMessages([msg]);

    const workspaceId = await CreateWorkspace({
      user: userDetail?._id,
      messages: [msg],
    });
    console.log("workspaceId", workspaceId);
    // router.push(`/workspace/${workspaceId}`)
    router.push("/workspace/" + workspaceId);
  };
  return (
    <div className="flex flex-col items-center mt-36 xl:mt-52 gap-2">
      <h2 className="font-bold text-4xl">{Lookup.HERO_HEADING}</h2>
      <p className="text-gray-400 font-medium">{Lookup.HERO_DESC}</p>
      <div
        className="p-5 border rounded-xl max-w-xl w-full"
        style={{ backgroundColor: Colors.BACKGROUND }}
      >
        <div className="flex gap-2 mt-3">
          <textarea
            placeholder={Lookup.INPUT_PLACEHOLDER}
            onChange={(event) => setUserInput(event.target.value)}
            className="text-white outline-none bg-transparent w-full h-32 max-h-56 resize-none"
          />
          {userInput && (
            <ArrowRight
              onClick={() => onGenerate(userInput)}
              className=" bg-blue-500 p-2 h-10 w-10 rounded-md  cursor-pointer hover:text-white transition"
            />
          )}
        </div>
        <div>
          <Link className="h-5" />
        </div>
      </div>
      <div className="flex mt-8 flex-wrap max-w-2xl justify-center items-center gap-3">
        {Lookup?.SUGGESTIONS.map((suggestion, index) => (
          <h2
            key={index}
            onClick={() => onGenerate(suggestion)}
            className="px-2 p-1 border rounded-full text-sm text-gray-400 hover:text-white cursor-pointer"
          >
            {suggestion}
          </h2>
        ))}
      </div>
      <SignInDialog
        openDialog={openDialog}
        closeDialog={(v) => setOpenDialog(v)}
      />
    </div>
  );
};

export default Hero;
