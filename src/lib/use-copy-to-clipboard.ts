import { useCallback, useState } from "react";

export const COPIED_FLASH_MS = 1500;

export function useCopyToClipboard(): {
  copied: boolean;
  copy: (text: string) => Promise<void>;
} {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard may be unavailable; callers still surface the value another way */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), COPIED_FLASH_MS);
  }, []);
  return { copied, copy };
}
