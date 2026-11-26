/* Build independent mutable vote state from immutable database definitions. */
import { NOMINATION_DEFINITIONS } from "./database/definitions.js?v=20261126-1";

export function createNominationState() {
    return NOMINATION_DEFINITIONS.map((definition) => ({
        ...definition,
        nomineeIds: definition.nomineeIds ? [...definition.nomineeIds] : undefined,
        duoPairs: definition.duoPairs
            ? definition.duoPairs.map((pair) => ({ ...pair }))
            : undefined,
        selectedId: null,
        selectedFromPoolId: null,
        selectedPairId: null,
        suggestionMode: definition.type === "image" ? "idle" : undefined,
        suggestionDraft: "",
        suggestedText: "",
        page: 0
    }));
}
