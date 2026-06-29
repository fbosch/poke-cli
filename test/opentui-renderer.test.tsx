import { createTestRenderer } from "@opentui/core/testing";
import { createRoot } from "@opentui/react";
import { expect, test } from "bun:test";
import { App } from "../src/ui/app";

test("OpenTUI renderer draws the Search screen", async () => {
  const { renderer, captureCharFrame, renderOnce, resize } =
    await createTestRenderer({ height: 20, width: 80 });
  const root = createRoot(renderer);

  try {
    root.render(<App initialQuery="pika" onExit={() => {}} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await renderOnce();

    const initialFrame = captureCharFrame();
    expect(initialFrame).toContain("pika");
    expect(initialFrame).toContain("#025 Pikachu");

    resize(60, 12);
    await renderOnce();
    expect(captureCharFrame()).toContain("#025 Pikachu");
  } finally {
    root.unmount();
    renderer.destroy();
  }
});
