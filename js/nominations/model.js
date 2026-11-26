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
        if (nomination.type === "duo") {
            return Boolean(nomination.selectedPairId)
                && getDuoPairs(nomination).some(function (pair) {
                    return pair.id === nomination.selectedPairId;
                });
        }

        if (nomination.type === "image") {
            if (nomination.suggestionMode === "voted") {
                return Boolean((nomination.suggestedText || "").trim());
            }
            return Boolean(nomination.selectedId)
                && nomination.nomineeIds.includes(nomination.selectedId);
        }

        return Boolean(
            (nomination.selectedId && nomineeById.has(nomination.selectedId))
            || (nomination.selectedFromPoolId && nomineeById.has(nomination.selectedFromPoolId))
        );
    }

    function isBallotComplete(nominations) {
        return nominations.length > 0 && nominations.every(nominationHasVote);
    }

    function buildBallotPayload(nominations) {
        return {
            createdAt: new Date().toISOString(),
            nominations: nominations.map(function (nomination) {
                if (nomination.type === "duo") {
                    const pair = getDuoPairs(nomination).find(function (item) {
                        return item.id === nomination.selectedPairId;
                    });
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
                    return {
                        id: nomination.id,
                        title: nomination.title,
                        type: "image",
                        selection: {
                            kind: "suggestion",
                            value: nomination.suggestedText.trim()
                        }
                    };
                }

                const personId = nomination.selectedId || nomination.selectedFromPoolId;
                const person = personId ? nomineeById.get(personId) : null;
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
            const selectedId = nomination.selectedId || nomination.selectedFromPoolId;
            return {
                id: nomination.id,
                title: nomination.title,
                type: nomination.type || "individual",
                eligibleNominees: nomination.type === "duo" ? [] : [
                    ...nomination.nomineeIds.map(function (id) {
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
        isBallotComplete,
        buildBallotPayload,
        buildNominationSnapshot
    };
}
