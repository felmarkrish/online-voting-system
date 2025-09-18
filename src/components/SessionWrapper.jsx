"use client";

import { useEffect } from "react";
import { startSessionTimeout } from "../lib/session";

export default function SessionWrapper({ children }) {
  useEffect(() => {
    startSessionTimeout(() => {
      console.debug("[Session] Logging out user...");

      // ✅ Call logout API and redirect to login page
      fetch("/api/logout", { method: "POST" }).then(() => {
        localStorage.removeItem("username");
        window.location.href = "/login";
      });
    }, 5); // ⏱ 1 minute
  }, []);

  return <>{children}</>;
}
