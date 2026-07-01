import { RGBA } from "@opentui/core";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import {
  queryCacheStorageStats,
  type QueryCacheStorageStats,
} from "#src/query-cache.ts";
import { colors, textStyles } from "./design-tokens";

const cachePanelBackground = RGBA.fromHex("#111022");
const cachePanelTitle = RGBA.fromHex("#ffff00");
const cachePanelWidth = 72;

export function CacheDebugPanel() {
  const queryClient = useQueryClient();
  const [stats, setStats] = useState<QueryCacheStorageStats | undefined>();
  const refreshStats = useCallback(() => {
    void queryCacheStorageStats().then(setStats);
  }, []);

  useEffect(() => {
    refreshStats();
    return queryClient.getQueryCache().subscribe(refreshStats);
  }, [queryClient, refreshStats]);

  return <CacheDebugPanelView stats={stats} />;
}

export function CacheDebugPanelView({
  stats,
}: {
  stats: QueryCacheStorageStats | undefined;
}) {
  return (
    <box
      backgroundColor={cachePanelBackground}
      style={{
        flexDirection: "column",
        height: 7,
        overflow: "hidden",
        padding: 1,
        position: "absolute",
        right: 2,
        top: 10,
        width: cachePanelWidth,
        zIndex: 250,
      }}
    >
      {stats === undefined ? (
        <text fg={cachePanelTitle} attributes={textStyles.active}>
          Cache Debug loading...
        </text>
      ) : (
        <CacheDebugStatsRows stats={stats} />
      )}
    </box>
  );
}

function CacheDebugStatsRows({ stats }: { stats: QueryCacheStorageStats }) {
  return (
    <box style={{ flexDirection: "column", height: 5 }}>
      <CacheDebugRow
        active
        label="storage"
        value={`${stats.mode}, ${stats.queryCount.toString()} queries, ${formatBytes(stats.totalBytes)} total`}
      />
      <CacheDebugRow
        label="files"
        value={`db ${formatBytes(stats.databaseBytes)}, wal ${formatBytes(stats.walBytes)}, shm ${formatBytes(stats.shmBytes)}`}
      />
      <CacheDebugRow
        label="schema"
        value={`${stats.buster}, max ${stats.maxAgeDays.toString()}d`}
      />
      <CacheDebugRow label="prefix" value={stats.prefix} />
      <text fg={stats.error === undefined ? colors.muted : colors.error}>
        {stats.error ?? formatShardCounts(stats.shardCounts)}
      </text>
    </box>
  );
}

function CacheDebugRow({
  active = false,
  label,
  value,
}: {
  active?: boolean;
  label: string;
  value: string;
}) {
  return (
    <text fg={active ? cachePanelTitle : colors.muted} style={{ height: 1 }}>
      {`${label.padEnd(8)} ${value}`}
    </text>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes.toString()} B`;
  }

  const kibibytes = bytes / 1024;
  if (kibibytes < 1024) {
    return `${kibibytes.toFixed(1)} KiB`;
  }

  return `${(kibibytes / 1024).toFixed(1)} MiB`;
}

function formatShardCounts(
  shardCounts: QueryCacheStorageStats["shardCounts"],
): string {
  const entries = Object.entries(shardCounts);
  if (entries.length === 0) {
    return "shards none";
  }

  return `shards ${entries
    .map(
      ([shard, count]) =>
        `${shard.replace("generation-", "g")}:${count.toString()}`,
    )
    .join(" ")}`;
}
