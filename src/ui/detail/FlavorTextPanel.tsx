import type { PokemonDetail } from "../../pokemon-detail";
import { colors, textStyles } from "../design-tokens";

export function FlavorTextPanel({
  detail,
  selectedIndex,
}: {
  detail: PokemonDetail;
  selectedIndex: number;
}) {
  const selected = detail.flavorTexts[selectedIndex];
  const text = selected?.text ?? detail.flavorText;
  const source = selected?.source ?? "Unknown";
  const count = Math.max(1, detail.flavorTexts.length);
  const displayIndex = Math.min(selectedIndex + 1, count);

  return (
    <>
      <text>{text}</text>
      <text
        fg={colors.muted}
        attributes={textStyles.muted}
        style={{ bottom: 0, position: "absolute", right: 1 }}
      >
        {`${displayIndex.toString()}/${count.toString()} (${source})`}
      </text>
    </>
  );
}
