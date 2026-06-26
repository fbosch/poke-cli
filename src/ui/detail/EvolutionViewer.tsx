import type {
  PokemonEvolution,
  PokemonEvolutionChain,
} from "../../pokemon-detail";
import { KeyHints, Modal, keyHintsWidth } from "../components";
import { colors, textStyles } from "../design-tokens";

const closeHints = [{ key: "e/esc", action: "close" }] as const;

type EvolutionChartLink = {
  end: number;
  name: string;
  start: number;
};

type EvolutionChartRow = {
  links: EvolutionChartLink[];
  text: string;
};

export function EvolutionViewer({
  evolutionChain,
  onSelectSpecies,
}: {
  evolutionChain: PokemonEvolutionChain;
  onSelectSpecies: (name: string) => void;
}) {
  const rows = buildEvolutionChartRows(evolutionChain);

  return (
    <Modal
      right={<KeyHints hints={closeHints} />}
      rightWidth={keyHintsWidth(closeHints)}
      title="Evolution"
      width={96}
    >
      <box
        style={{
          alignSelf: "center",
          flexDirection: "column",
          width: Math.min(chartWidth(rows), 90),
        }}
      >
        {rows.map((row, index) => (
          <EvolutionChartTextRow
            key={index.toString()}
            onSelectSpecies={onSelectSpecies}
            row={row}
          />
        ))}
      </box>
    </Modal>
  );
}

function EvolutionChartTextRow({
  onSelectSpecies,
  row,
}: {
  onSelectSpecies: (name: string) => void;
  row: EvolutionChartRow;
}) {
  const chunks = splitEvolutionChartRow(row);

  return (
    <box style={{ flexDirection: "row" }}>
      {chunks.map((chunk, index) => {
        const name = chunk.name;
        if (name === undefined) {
          return (
            <text key={index.toString()} fg={colors.muted}>
              {chunk.text}
            </text>
          );
        }

        const clickProps = { onMouseDown: () => onSelectSpecies(name) };
        return (
          <text
            key={index.toString()}
            attributes={textStyles.active}
            fg={colors.keyHint}
            {...clickProps}
          >
            {chunk.text}
          </text>
        );
      })}
    </box>
  );
}

export function buildEvolutionFlowchartLines(
  evolutionChain: PokemonEvolutionChain,
): string[] {
  return buildEvolutionChartRows(evolutionChain).map((row) => row.text);
}

function buildEvolutionChartRows(
  evolutionChain: PokemonEvolutionChain,
): EvolutionChartRow[] {
  return [
    pokemonNameRow(evolutionChain.root.name, ""),
    ...childEvolutionRows(evolutionChain.root.evolvesTo, ""),
  ];
}

function childEvolutionRows(
  evolutions: readonly PokemonEvolution[],
  prefix: string,
): EvolutionChartRow[] {
  const methodWidth = Math.max(
    0,
    ...evolutions.map((evolution) => evolutionMethodLabel(evolution).length),
  );

  return evolutions.flatMap((evolution, index) => {
    const isLast = index === evolutions.length - 1;
    const branch = isLast ? "└─" : "├─";
    const childPrefix = `${prefix}${isLast ? "   " : "│  "}`;
    const method = evolutionMethodLabel(evolution).padEnd(methodWidth);
    const textBeforeName = `${prefix}${branch} ${method} ─▶ `;
    const row = pokemonNameRow(evolution.name, textBeforeName);

    return [row, ...childEvolutionRows(evolution.evolvesTo, childPrefix)];
  });
}

function evolutionMethodLabel(evolution: PokemonEvolution): string {
  const method = evolution.method ?? "evolves";

  if (method.startsWith("use item, ")) {
    return `[${method.slice("use item, ".length)}]`;
  }

  return `[${method.replaceAll(", ", " + ")}]`;
}

function pokemonNameRow(name: string, prefix: string): EvolutionChartRow {
  return {
    links: [{ end: prefix.length + name.length, name, start: prefix.length }],
    text: `${prefix}${name}`,
  };
}

function splitEvolutionChartRow(row: EvolutionChartRow) {
  const chunks: { name?: string; text: string }[] = [];
  let cursor = 0;

  for (const link of row.links.toSorted(
    (left, right) => left.start - right.start,
  )) {
    if (cursor < link.start) {
      chunks.push({ text: row.text.slice(cursor, link.start) });
    }

    chunks.push({
      name: link.name,
      text: row.text.slice(link.start, link.end),
    });
    cursor = link.end;
  }

  if (cursor < row.text.length) {
    chunks.push({ text: row.text.slice(cursor) });
  }

  return chunks.length === 0 ? [{ text: row.text }] : chunks;
}

function chartWidth(rows: readonly EvolutionChartRow[]): number {
  return Math.max(1, ...rows.map((row) => row.text.length));
}
