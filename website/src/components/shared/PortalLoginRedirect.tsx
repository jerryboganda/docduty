import { useEffect } from "react";
import { getPortalLoginUrl } from "@/lib/portal";

const PortalLoginRedirect = () => {
  useEffect(() => {
    window.location.replace(getPortalLoginUrl());
  }, []);

  return null;
};

export default PortalLoginRedirect;
