# Benchmark Baseline

Captured: 2026-06-27
Command: `bun run bench`
Network: disabled by `test/support/disable-network.ts`

| Suite | Benchmark | Iterations | Duration ms | Ops/sec |
| --- | --- | ---: | ---: | ---: |
| app-state | search-text-input | 500000 | 128.81 | 3881805 |
| app-state | search-selection-down | 500000 | 195.99 | 2551098 |
| app-state | detail-toggle-shiny | 500000 | 39.05 | 12804975 |
| app-state | detail-cycle-description | 500000 | 25.69 | 19459304 |
| app-state | detail-load-species-transition | 500000 | 29.10 | 17182398 |
| detail-building | build-forms-pikachu | 100000 | 38.30 | 2610883 |
| detail-building | build-forms-charizard | 100000 | 52.82 | 1893109 |
| detail-building | build-default-detail-pikachu | 100000 | 228.17 | 438273 |
| detail-building | build-form-detail-charizard-mega-x | 100000 | 219.93 | 454694 |
| evolution-chart | linear-pikachu-chain | 500000 | 270.55 | 1848063 |
| evolution-chart | branching-eevee-chain | 500000 | 2943.89 | 169843 |
| pokeapi-validation | pokemon | 100000 | 166.28 | 601410 |
| pokeapi-validation | species | 100000 | 197.71 | 505780 |
| pokeapi-validation | evolutionChain | 100000 | 179.39 | 557443 |
| query-cache-storage | file-storage-read-small | 1000 | 23.86 | 41918 |
| query-cache-storage | file-storage-read-large | 1000 | 93.10 | 10741 |
| query-cache-storage | file-storage-write-small | 1000 | 27.53 | 36329 |
| query-cache-storage | file-storage-write-large | 1000 | 182.43 | 5482 |
| search | single-char-p | 100 | 0.06 | 1623930 |
| search | name-pikachu | 100 | 0.04 | 2549460 |
| search | alias-pika | 100 | 0.04 | 2681468 |
| search | dex-001 | 100 | 0.03 | 3046830 |
| search | symbol-nidoran | 100 | 0.05 | 1902732 |
| search | punctuation-mr-mime | 100 | 0.09 | 1094200 |
| search | late-dex-pecharunt | 100 | 0.07 | 1461155 |
| search | exact-name | 100 | 0.02 | 4461099 |
| search | exact-dex | 100 | 0.02 | 6534239 |
| search | exact-miss | 100 | 0.01 | 6888476 |
| sprite-rendering | xterm-color-index | 500 | 1.86 | 268188 |
| sprite-rendering | render-png-small-16x16 | 500 | 26.08 | 19173 |
| sprite-rendering | render-png-medium-64x64 | 500 | 100.18 | 4991 |
| startup | import-search-module | 25 | 528.72 | 47 |
| startup | import-ui-root | 25 | 7354.81 | 3 |
| startup | create-initial-search-state | 25 | 1448.29 | 17 |
| startup | create-initial-detail-state | 25 | 1652.06 | 15 |
| type-matchups | single-electric | 1000000 | 610.26 | 1638640 |
| type-matchups | dual-water-flying | 1000000 | 919.20 | 1087906 |
| type-matchups | dual-fire-flying | 1000000 | 961.14 | 1040428 |
| type-matchups | dual-ghost-steel | 1000000 | 956.92 | 1045014 |
