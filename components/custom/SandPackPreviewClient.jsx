import React, { useContext, useEffect, useRef } from "react";
import { SandpackPreview, useSandpack } from "@codesandbox/sandpack-react";
import { ActionContext } from "@/context/ActionContext";

const SandPackPreviewClient = () => {
  const previewRef = useRef();
  const { sandpack } = useSandpack();
  const { action, setAction } = useContext(ActionContext);

  useEffect(() => {
    if (action?.actionType) {
      handleAction();
    }
  }, [action]);

  const handleAction = async () => {
    try {
      const client = previewRef.current?.getClient();
      if (client) {
        const result = await client.getCodeSandboxURL();
        if (action?.actionType === "deploy") {
          window.open("https://" + result.sandboxId + ".csb.app/", "_blank");
        } else if (action?.actionType === "export") {
          window.open(result?.editorUrl, "_blank");
        }
        setAction(null);
      }
    } catch (err) {
      console.error("Action error in preview client:", err);
    }
  };

  return (
    <div className="w-full h-full relative flex flex-col">
      <SandpackPreview
        ref={previewRef}
        style={{ height: "78vh" }}
        showNavigator={true}
        showRefreshButton={true}
        showRestartButton={true}
        showOpenInCodeSandbox={false}
      />
    </div>
  );
};

export default SandPackPreviewClient;

