/* Pure nomination and ballot calculations, independent of the DOM. */
export function createNominationModel({ nomineeById, compareNames }) {
    function getDuoPairs(nomination) {
        return (nomination.duoPairs || []).map(function (pair) {
            return {
                id: pair.id,
                first: nomineeById.get(pair.firstId),
                second: nomineeById.get(pair.secondId)
            };
        }).filter(function (pair) {
            return pair.first && pair.second;
        }).sort(function (first, second) {
            return compareNames(first.first, second.first)
                || compareNames(first.second, second.second);
        });
    }

    function selectedDuo(nomination) {
        if (!nomination || nomination.type !== "duo" || !nomination.selectedPairId) {
            return null;
        }
        return getDuoPairs(nomination).find(function (pair) {
            return pair.id === nomination.selectedPairId;
        }) || null;
    }

    function nominationHasVote(nomination) {
        if (!nomination) return false;

        if (nomination.type === "duo") {
            return Boolean(nomination.selectedPairId)
                && getDuoPairs(nomination).some(function (pair) {
                    return pair.id === nomination.selectedPairId;
                });
        }

        const eligibleIds = Array.isArray(nomination.nomineeIds)
            ? nomination.nomineeIds
            : [];

        if (nomination.type === "image") {
            if (nomination.suggestionMode === "voted") {
                return typeof nomination.suggestedText === "string"
                    && Boolean(nomination.suggestedText.trim());
            }
            return Boolean(nomination.selectedId)
                && eligibleIds.includes(nomination.selectedId)
                && nomineeById.has(nomination.selectedId);
        }

        if (nomination.selectedFromPoolId) {
            return nomination.type === "individual"
                && nomineeById.has(nomination.selectedFromPoolId);
        }

        return Boolean(nomination.selectedId)
            && eligibleIds.includes(nomination.selectedId)
            && nomineeById.has(nomination.selectedId);
    }

    function isBallotComplete(nominations) {
        return Array.isArray(nominations)
            && nominations.length > 0
            && nominations.every(nominationHasVote);
    }

    function buildBallotPayload(nominations) {
        return {
            createdAt: new Date().toISOString(),
            nominations: nominations.map(function (nomination) {
                if (nomination.type === "duo") {
                    const pair = selectedDuo(nomination);
                    return {
                        id: nomination.id,
                        title: nomination.title,
                        type: "duo",
                        selection: pair ? {
                            pairId: pair.id,
                            nominees: [pair.first.name, pair.second.name]
                        } : null
                    };
                }

                if (nomination.type === "image" && nomination.suggestionMode === "voted") {
                    const value = typeof nomination.suggestedText === "string"
                        ? nomination.suggestedText.trim()
                        : "";
                    return {
                        id: nomination.id,
                        title: nomination.title,
                        type: "image",
                        selection: value ? {
                            kind: "suggestion",
                            value
                        } : null
                    };
                }

                const personId = nomination.selectedFromPoolId || nomination.selectedId;
                const person = nominationHasVote(nomination) && personId
                    ? nomineeById.get(personId)
                    : null;

                return {
                    id: nomination.id,
                    title: nomination.title,
                    type: nomination.type || "individual",
                    selection: person ? {
                        kind: "nominee",
                        nomineeId: person.id,
                        nomineeName: person.name,
                        addedFromCommonPool: Boolean(nomination.selectedFromPoolId)
                    } : null
                };
            })
        };
    }

    function buildNominationSnapshot(nominations) {
        return nominations.map(function (nomination) {
            const pair = selectedDuo(nomination);
            const selectedId = nomination.selectedFromPoolId || nomination.selectedId;
            const eligibleIds = Array.isArray(nomination.nomineeIds)
                ? nomination.nomineeIds
                : [];

            return {
                id: nomination.id,
                title: nomination.title,
                type: nomination.type || "individual",
                eligibleNominees: nomination.type === "duo" ? [] : [
                    ...eligibleIds.map(function (id) {
                        return nomineeById.get(id);
                    }).filter(Boolean),
                    ...(nomination.selectedFromPoolId
                        ? [nomineeById.get(nomination.selectedFromPoolId)].filter(Boolean)
                        : [])
                ],
                eligiblePairs: nomination.type === "duo"
                    ? getDuoPairs(nomination).map(function (item) {
                        return { id: item.id, first: item.first, second: item.second };
                    })
                    : [],
                selectedNominee: selectedId ? nomineeById.get(selectedId) || null : null,
                selectedSuggestion: nomination.suggestionMode === "voted"
                    ? nomination.suggestedText
                    : null,
                selectedPair: pair
                    ? { id: pair.id, first: pair.first, second: pair.second }
                    : null
            };
        });
    }

    return {
        getDuoPairs,
        selectedDuo,
        nominationHasVote,
        isBallotComplete,
        buildBallotPayload,
        buildNominationSnapshot
    };
}
