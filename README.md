# pkdx

[![npm](https://img.shields.io/npm/v/%40fbb.sh%2Fpkdx?logo=npm)](https://www.npmjs.com/package/@fbb.sh/pkdx)
[![size](https://img.shields.io/npm/unpacked-size/%40fbb.sh%2Fpkdx?logo=npm&label=size)](https://www.npmjs.com/package/@fbb.sh/pkdx)
[![license](https://img.shields.io/npm/l/%40fbb.sh%2Fpkdx)](LICENSE)
[![coverage](docs/coverage.svg)](docs/coverage.svg)

`pkdx` is a terminal Pokédex for quickly looking up Pokémon species without leaving the command line.

It supports fuzzy species search, form selection, shiny sprites, damage matchups, abilities, evolutions, and flavor text.

## Requirements

- macOS, Linux, WSL, Git Bash, or Windows PowerShell/CMD
- A modern terminal such as Kitty, Ghostty, WezTerm, Alacritty, or iTerm2
- Internet access

## Install

```bash
npm install -g @fbb.sh/pkdx
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

## Credits

- [PokeAPI](https://pokeapi.co/) for Pokémon data.
- [PokéSprite](https://github.com/msikma/pokesprite) and [PokeAPI Sprites](https://github.com/PokeAPI/sprites) for sprite artwork.
- PokéSprite credits Nintendo/Creatures Inc./GAME FREAK Inc. as the source of the original sprites, [@Dada78641](https://twitter.com/dada78641) for shiny sprites, Project Pokémon contributors Zhorken and Kaphotics for raw sprite rips, and its community contributors for later form and game updates.
- PokeAPI Sprites credits the Smogon community for custom sprites, [@DevMike123](https://github.com/DevMike123), [@JoseBaGra](https://github.com/JoseBaGra), and Pokétwo for custom shiny official artwork, [KingOfThe-X-Roads](https://www.deviantart.com/kingofthe-x-roads) for generation 9 front sprites, and [Kyle Dovey](https://github.com/kyledovey) for generation 9 back, shiny, and Z-A Mega sprites.
- [OpenTUI](https://github.com/anomalyco/opentui) for the terminal UI runtime.
- [Pokémon Database](https://pokemondb.net/) for external Pokédex links.

## License

MIT. See [`LICENSE`](LICENSE).
