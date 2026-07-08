import { useEffect, useState } from "react";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() =>
    typeof window !== "undefined" &&
    typeof matchMedia !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mediaQuery.matches);
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);
  return reduced;
}