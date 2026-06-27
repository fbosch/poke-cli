import type { PokemonForm } from "#src/pokemon-detail.ts";
import { KeyHints, Modal, keyHintsWidth } from "../components";
import { colors } from "../design-tokens";

const formSelectorHeight = 12;
const formSelectorWidth = 44;
const formSelectorListWidth = formSelectorWidth - 4;
const formSelectorHints = [
  { key: "j/k", action: "move" },
  { key: "enter", action: "select" },
] as const;

export function FormSelector({
  currentForm,
  forms,
  onClose,
  selectedIndex,
}: {
  currentForm: PokemonForm;
  forms: readonly PokemonForm[];
  onClose?: () => void;
  selectedIndex: number;
}) {
  const options = forms.map((form) => ({
    description: "",
    name: `${form.pokemonName === currentForm.pokemonName ? "*" : " "} ${form.displayName}`,
    value: form.pokemonName,
  }));

  return (
    <Modal
      right={<KeyHints hints={formSelectorHints} />}
      rightWidth={keyHintsWidth(formSelectorHints)}
      title="Forms"
      width={formSelectorWidth}
      {...(onClose === undefined ? {} : { onClose })}
    >
      <select
        height={Math.min(forms.length, formSelectorHeight)}
        options={options}
        selectedBackgroundColor={colors.selected}
        selectedIndex={selectedIndex}
        showScrollIndicator={forms.length > formSelectorHeight}
        selectedTextColor={colors.selectedText}
        showDescription={false}
        textColor={colors.keyHint}
        width={formSelectorListWidth}
      />
    </Modal>
  );
}
