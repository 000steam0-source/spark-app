import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { getAuthSession } from "@/shared/api";
import AppFrame from "@/features/navigation/ui/AppFrame";
import { useWindowState } from "@/features/navigation/hooks/useWindowState";
import SplashScreen from "@/shared/ui/SplashScreen";
import { isGuestMode } from "../lib/guestMode";

export function AuthLock({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const status = useAuthStore((state) => state.status);
  const initialize = useAuthStore((state) => state.initialize);
  const [guest, setGuest] = useState(isGuestMode);
  // keeps the body's outer padding in step with maximize / fullscreen on every screen
  useWindowState();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    const syncExpiredSession = () => {
      if (!getAuthSession()) void initialize();
    };
    const syncGuest = () => setGuest(isGuestMode());
    window.addEventListener("auth:changed", syncExpiredSession);
    window.addEventListener("spark:guest-changed", syncGuest);
    return () => {
      window.removeEventListener("auth:changed", syncExpiredSession);
      window.removeEventListener("spark:guest-changed", syncGuest);
    };
  }, [initialize]);

  const needsLogin = status === "anonymous" && !guest;

  useEffect(() => {
    if (needsLogin && pathname !== "/login") navigate("/login", { replace: true });
    if (status === "authenticated" && pathname === "/login") navigate("/", { replace: true });
  }, [pathname, navigate, status, needsLogin]);

  if (
    status === "initializing" ||
    (needsLogin && pathname !== "/login") ||
    (status === "authenticated" && pathname === "/login")
  ) {
    return <SplashScreen />;
  }

  return pathname === "/login" ? children : <AppFrame>{children}</AppFrame>;
}

export default AuthLock;
