import { HelpCircle, LogOutIcon, Settings, Wallet } from "lucide-react";
import React, { useContext, useState } from "react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { UserDetailContext } from "@/context/UserDetailContext";
import { toast } from "sonner";
import SettingsDialog from "./SettingsDialog";

const SideBarFooter = () => {
  const router = useRouter();
  const { setUserDetail } = useContext(UserDetailContext);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const options = [
    {
      name: "Settings",
      icon: Settings,
    },
    {
      name: "Help center",
      icon: HelpCircle,
    },
    {
      name: "My Subscription",
      icon: Wallet,
      path: "/pricing",
    },
    {
      name: "Sign Out",
      icon: LogOutIcon,
    },
  ];

  const onOptionClick = (option) => {
    if (option.name === "Settings") {
      setSettingsOpen(true);
      return;
    }

    if (option.name === "Sign Out") {
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
      }
      setUserDetail(null);
      router.push("/");
      toast.success("Signed out successfully");
      return;
    }

    if (option?.path) {
      router.push(option.path);
    } else {
      toast.info(`${option.name} — coming soon!`);
    }
  };

  return (
    <div className="flex flex-col w-full gap-1">
      {options.map((option) => (
        <Button
          key={option.name}
          variant="ghost"
          className="w-full flex justify-start"
          onClick={() => onOptionClick(option)}
        >
          <option.icon /> {option.name}
        </Button>
      ))}
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default SideBarFooter;
