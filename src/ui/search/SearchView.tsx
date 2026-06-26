import { minimumSearchQueryLength, searchResults } from "../../search";
import { InstructionFooter, KeyHints, PokedexHeader } from "../components";
import { colors, textStyles } from "../design-tokens";

export function SearchView({
  query,
  selectedIndex,
}: {
  query: string;
  selectedIndex: number;
}) {
  const results = searchResults(query, selectedIndex);
  const queryLabel = query.length === 0 ? "Search Pokemon species..." : query;
  const hasSearchableQuery = query.trim().length >= minimumSearchQueryLength;

  return (
    <box
      style={{
        alignItems: "center",
        flexDirection: "column",
        justifyContent: "center",
        padding: 1,
        height: "100%",
        position: "relative",
      }}
    >
      <box style={{ position: "relative", width: 56 }}>
        <box
          border
          borderColor={colors.accent}
          borderStyle="rounded"
          style={{ flexDirection: "column", paddingX: 1, width: 56 }}
        >
          <text
            attributes={
              query.length === 0 ? textStyles.muted : textStyles.active
            }
            {...(query.length === 0 ? { fg: colors.muted } : {})}
          >{`> ${queryLabel}`}</text>
        </box>
        <PokedexHeader />
        {hasSearchableQuery ? (
          <box
            style={{
              flexDirection: "column",
              left: 0,
              position: "absolute",
              top: 3,
              width: 56,
              zIndex: 100,
            }}
          >
            {results.length === 0 ? (
              <text fg={colors.muted} attributes={textStyles.muted}>
                No species match this query.
              </text>
            ) : null}
            {results.map((result) => {
              const label = ` #${result.dexNumbers[1] ?? result.dexNumbers[0]} ${result.name}`;

              return (
                <text
                  key={result.slug}
                  attributes={
                    result.selected ? textStyles.selected : textStyles.normal
                  }
                  {...(result.selected
                    ? { bg: colors.selected, fg: colors.selectedText }
                    : {})}
                >
                  {result.selected ? label.padEnd(56) : label}
                </text>
              );
            })}
          </box>
        ) : null}
      </box>

      <InstructionFooter>
        <KeyHints
          hints={[
            { key: "type", action: "filter" },
            { key: "ctrl+u", action: "clear" },
            { key: "ctrl+j/k", action: "move" },
            { key: "enter", action: "open" },
            { key: "esc", action: "exit" },
          ]}
        />
      </InstructionFooter>
    </box>
  );
}
