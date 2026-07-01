import type { TerminalCapabilities } from "@opentui/core";
import { useRenderer } from "@opentui/react";
import { useCallback, useSyncExternalStore } from "react";
import { detectTerminalImageSupport } from "#src/terminal-images.ts";

export function useTerminalImageSupport() {
  const renderer = useRenderer();
  const subscribeToCapabilities = useCallback(
    (onStoreChange: () => void) => {
      const handleCapabilities = (_nextCapabilities: TerminalCapabilities) => {
        onStoreChange();
      };

      renderer.on("capabilities", handleCapabilities);
      return () => {
        renderer.off("capabilities", handleCapabilities);
      };
    },
    [renderer],
  );
  const getCapabilitiesSnapshot = useCallback(
    () => renderer.capabilities,
    [renderer],
  );
  const capabilities = useSyncExternalStore(
    subscribeToCapabilities,
    getCapabilitiesSnapshot,
  );

  if (
    capabilities === null ||
    renderer.screenMode !== "alternate-screen" ||
    renderer.externalOutputMode !== "passthrough"
  ) {
    return undefined;
  }

  return detectTerminalImageSupport(Bun.env, capabilities);
}
