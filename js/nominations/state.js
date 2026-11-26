/* Build independent mutable vote state from immutable database definitions. */
import { NOMINATION_DEFINITIONS } from "./database/definitions.js?v=20261127-2";

export function createNominationState() {
    return NOMINATION_DEFINITIONS.map((definition) => {
        const state = {
            ...definition,
            nomineeIds: definition.nomineeIds ? [...definition.nomineeIds] : undefined,
            duoPairs: definition.duoPairs
                ? definition.duoPairs.map((pair) => ({ ...pair }))
                : undefined,
            selectedId: null,
            page: 0
        };

        if (definition.type === "individual") {
            state.selectedFromPoolId = null;
        } else if (definition.type === "duo") {
            state.selectedPairId = null;
        } else if (definition.type === "image") {
            state.suggestionMode = "idle";
            state.suggestionDraft = "";
            state.suggestedText = "";
        }

        return state;
    });
}
