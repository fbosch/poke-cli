import type { DamageTaken, DamageTakenEntry } from "../../type-matchups";
import { TypeTag } from "../components";
import { colors, textStyles } from "../design-tokens";

export function DamageTakenPanel({
  damageTaken,
}: {
  damageTaken: DamageTaken;
}) {
  return (
    <box style={{ flexDirection: "column" }}>
      <text attributes={textStyles.active}>Damage Taken</text>
      <DamageTakenRow label="Weak" entries={damageTaken.weaknesses} />
      <text> </text>
      <DamageTakenRow label="Resist" entries={damageTaken.resistances} />
    </box>
  );
}

function DamageTakenRow({
  entries,
  label,
}: {
  entries: readonly DamageTakenEntry[];
  label: string;
}) {
  const rows = chunkEntries(entries, 3);

  if (entries.length === 0) {
    return (
      <text>
        <span fg={colors.muted}>{label.padEnd(7)}</span>
        <span fg={colors.muted}>none</span>
      </text>
    );
  }

  return (
    <box style={{ flexDirection: "column" }}>
      {rows.map((row, rowIndex) => (
        <text key={`${label}-${rowIndex.toString()}`}>
          <span fg={colors.muted}>
            {rowIndex === 0 ? label.padEnd(7) : " ".repeat(7)}
          </span>
          {row.map((entry, entryIndex) => (
            <span key={entry.type}>
              {entryIndex > 0 ? <span> </span> : null}
              <TypeTag short type={entry.type} />
              <span
                bg={multiplierColor(entry.multiplier)}
                fg={colors.multiplierText}
              >
                {` ${formatMultiplier(entry.multiplier).padStart(3)} `}
              </span>
            </span>
          ))}
        </text>
      ))}
    </box>
  );
}

function formatMultiplier(multiplier: DamageTakenEntry["multiplier"]): string {
  if (multiplier === 0.25) {
    return "1/4";
  }

  if (multiplier === 0.5) {
    return "1/2";
  }

  return `${multiplier}x`;
}

function multiplierColor(multiplier: DamageTakenEntry["multiplier"]) {
  if (multiplier === 0) {
    return colors.multiplierImmune;
  }

  return multiplier > 1 ? colors.multiplierWeak : colors.multiplierResist;
}

function chunkEntries(entries: readonly DamageTakenEntry[], size: number) {
  const rows: DamageTakenEntry[][] = [];

  for (let index = 0; index < entries.length; index += size) {
    rows.push(entries.slice(index, index + size));
  }

  return rows;
}
