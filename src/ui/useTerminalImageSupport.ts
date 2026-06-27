import type { TerminalCapabilities } from "@opentui/core";
import { useRenderer } from "@opentui/react";
import { useEffect, useState } from "react";
import { detectTerminalImageSupport } from "#src/terminal-images.ts";

export function useTerminalImageSupport() {
  const renderer = useRenderer();
  const [capabilities, setCapabilities] = useState(renderer.capabilities);

  useEffect(() => {
    const handleCapabilities = (nextCapabilities: TerminalCapabilities) => {
      setCapabilities(nextCapabilities);
    };

    renderer.on("capabilities", handleCapabilities);
    return () => {
      renderer.off("capabilities", handleCapabilities);
    };
  }, [renderer]);

  if (
    capabilities === null ||
    renderer.screenMode !== "alternate-screen" ||
    renderer.externalOutputMode !== "passthrough"
  ) {
    return undefined;
  }

  return detectTerminalImageSupport(Bun.env, capabilities);
}
