import { useEffect } from "react";
import { getPortalRegisterUrl } from "@/lib/portal";

const PortalRegisterRedirect = () => {
  useEffect(() => {
    window.location.replace(getPortalRegisterUrl());
  }, []);

  return null;
};

export default PortalRegisterRedirect;
