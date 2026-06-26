import type { ReactNode } from "react";
import { colors } from "../design-tokens";

export function DetailPanel({
  children,
  minHeight,
  width,
}: {
  children: ReactNode;
  minHeight?: number;
  width: number;
}) {
  return (
    <box
      border
      borderColor={colors.panelSecondary}
      borderStyle="rounded"
      style={{
        flexDirection: "column",
        ...(minHeight === undefined ? {} : { minHeight }),
        paddingX: 1,
        position: "relative",
        width,
      }}
    >
      {children}
    </box>
  );
}
