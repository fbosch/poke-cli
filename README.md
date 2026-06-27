# pkdx

`pkdx` is a terminal Pokédex app for searching Pokémon species and browsing detail views in an interactive terminal UI.

It supports fuzzy species search, form selection, shiny sprites, damage matchups, abilities, evolutions, and flavor text.

## Requirements

- A terminal that can run OpenTUI applications
- Network access for uncached PokeAPI and sprite requests

## Install

```bash
npm install -g pkdx
```

## Run

Start the app:

```bash
pkdx
```

Start with an initial query:

```bash
pkdx pikachu
```

Useful flags:

- `--images=ascii` renders sprites as ASCII fallback output.
- `--images=builtin` uses OpenTUI image rendering. This is the default.
- `--debug` opens OpenTUI's debug overlay and enables debug error logging paths.

## Controls

Search:

- Type to search Pokémon species by name, slug, dex number, or alias.
- `Up` / `Down` or `Ctrl+k` / `Ctrl+j` moves the selected result.
- `Enter` opens the selected species detail view.
- `Backspace` edits the query.
- `Ctrl+u` clears the query.
- `Ctrl+c` exits.

Detail:

- `h` / `Left` and `l` / `Right` move through the National Dex.
- `/` returns to search.
- `s` toggles shiny sprite rendering.
- `f` opens or toggles available forms.
- `d` cycles flavor text entries.
- `a` opens ability details.
- `e` opens evolution details.
- `o` opens the species entry on Pokémon Database in a browser.
- `r` retries after a detail loading error.
- `Esc` closes an open overlay.
- `Ctrl+c` exits.

## Cache

Non-development runs cache API and sprite data under `${XDG_CACHE_HOME:-~/.cache}/pkdx/tanstack-query`.

## License

No license file is currently present.
