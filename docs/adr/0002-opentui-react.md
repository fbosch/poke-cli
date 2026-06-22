# Use OpenTUI React for the terminal UI

The Terminal Pokédex App will use OpenTUI with its React reconciler for the interactive terminal interface. This keeps the rebuild in the TypeScript ecosystem while avoiding the mutable Blessed node model from the original implementation; direct OpenTUI core, Ink, Blessed, and Bubble Tea were considered, but OpenTUI React best matches the desired TUI-first product with declarative Search and Detail screens.
