import { RGBA } from "@opentui/core";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { colors, textStyles } from "./design-tokens";

const maxDebugQueries = 5;
const debugPanelWidth = 50;
const debugPanelBackground = RGBA.fromHex("#111022");
const debugPanelTitle = RGBA.fromHex("#ffff00");

type QueryDebugEntry = {
  error: string;
  fetchStatus: string;
  id: string;
  key: string;
  observers: number;
  status: string;
  updated: string;
};

export function QueryDebugPanel() {
  const queryClient = useQueryClient();
  const entries = useQueryDebugEntries(queryClient);

  return <QueryDebugPanelView entries={entries} />;
}

export function QueryDebugPanelView({
  entries,
}: {
  entries: readonly QueryDebugEntry[];
}) {
  return (
    <box
      backgroundColor={debugPanelBackground}
      style={{
        flexDirection: "column",
        height: maxDebugQueries + 2,
        overflow: "hidden",
        padding: 1,
        position: "absolute",
        right: 2,
        top: 1,
        width: debugPanelWidth,
        zIndex: 250,
      }}
    >
      <text fg={debugPanelTitle} attributes={textStyles.active}>
        Query Debug
      </text>
      <text>Queries: {entries.length.toString()}</text>
      {entries.map((entry) => (
        <text key={entry.id}>
          <span>{entry.status.padEnd(7)}</span>
          <span> </span>
          <span fg={colors.muted}>{entry.fetchStatus.padEnd(7)}</span>
          <span> </span>
          <span>{entry.observers.toString().padStart(2)}</span>
          <span> </span>
          <span fg={colors.muted}>{entry.updated.padEnd(8)}</span>
          <span> </span>
          <span>{entry.key}</span>
          {entry.error.length === 0 ? null : (
            <span fg={colors.muted}> {entry.error}</span>
          )}
        </text>
      ))}
    </box>
  );
}

function useQueryDebugEntries(queryClient: QueryClient): QueryDebugEntry[] {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    return queryClient.getQueryCache().subscribe(() => {
      setRevision((current) => current + 1);
    });
  }, [queryClient]);

  return queryDebugEntries(queryClient, revision);
}

function queryDebugEntries(
  queryClient: QueryClient,
  _revision: number,
): QueryDebugEntry[] {
  return queryClient
    .getQueryCache()
    .findAll()
    .toSorted(
      (left, right) => right.state.dataUpdatedAt - left.state.dataUpdatedAt,
    )
    .slice(0, maxDebugQueries)
    .map((query) => ({
      error: queryErrorMessage(query.state.error),
      fetchStatus: query.state.fetchStatus,
      id: query.queryHash,
      key: formatQueryKey(query.queryKey),
      observers: query.getObserversCount(),
      status: query.state.status,
      updated: formatUpdatedAt(query.state.dataUpdatedAt),
    }));
}

function formatQueryKey(queryKey: readonly unknown[]): string {
  return JSON.stringify(queryKey).slice(0, 24);
}

function formatUpdatedAt(updatedAt: number): string {
  if (updatedAt === 0) {
    return "never";
  }

  return `${Math.max(0, Math.round((Date.now() - updatedAt) / 1000)).toString()}s ago`;
}

function queryErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.slice(0, 20);
  }

  return "";
}
