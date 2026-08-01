import React, { useContext, useEffect, useRef } from "react";
import { SandpackPreview, useSandpack } from "@codesandbox/sandpack-react";
import { ActionContext } from "@/context/ActionContext";
const SandPackPreviewClient = () => {
  const previewRef = useRef();
  const { sandpack } = useSandpack();
  const {action,setAction} = useContext(ActionContext)

  useEffect(() => {
    GetSandpackClient();
  }, [sandpack&&action]);

  const GetSandpackClient = async () => {
    const client = previewRef.current?.getClient();
    if (client) {
      console.log(client);
      const result=await client.getCodeSandboxURL();
      if(action?.actionType=='deploy'){
        window.open('http://'+result.sandboxId+'.csb.app/')
      }else if(action?.actionType=='export'){
        window?.open(result?.editorUrl)
      }
      console.log(result);
    }
  };
  return (
    <SandpackPreview
      ref={previewRef}
      style={{ height: "80vh" }}
      showNavigator={true}
    />
  );
};

export default SandPackPreviewClient;
