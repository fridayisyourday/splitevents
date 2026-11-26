/* Fail early when the static nominee catalogue references unknown or duplicate IDs. */
const VALID_GENDERS = new Set(["F", "M", "I"]);
const VALID_NOMINATION_TYPES = new Set(["individual", "duo", "image", "fixed"]);

export function validateNominationDatabase(nominees, nominations) {
    const errors = [];
    const nomineeIds = new Set();

    nominees.forEach((person, index) => {
        const label = "Номинант #" + (index + 1);
        if (!person || typeof person.id !== "string" || !person.id.trim()) {
            errors.push(label + ": отсутствует id");
            return;
        }
        if (nomineeIds.has(person.id)) {
            errors.push(label + ": повторяется id " + person.id);
        }
        nomineeIds.add(person.id);

        if (typeof person.name !== "string" || !person.name.trim()) {
            errors.push(label + ": отсутствует имя");
        }
        if (!VALID_GENDERS.has(person.gender)) {
            errors.push(label + ": неизвестная категория gender");
        }
    });

    const nominationIds = new Set();
    nominations.forEach((nomination, index) => {
        const label = "Номинация #" + (index + 1);
        if (!nomination || typeof nomination.id !== "string" || !nomination.id.trim()) {
            errors.push(label + ": отсутствует id");
            return;
        }
        if (nominationIds.has(nomination.id)) {
            errors.push(label + ": повторяется id " + nomination.id);
        }
        nominationIds.add(nomination.id);

        if (typeof nomination.title !== "string" || !nomination.title.trim()) {
            errors.push(label + ": отсутствует заголовок");
        }

        const type = nomination.type || "individual";
        if (!VALID_NOMINATION_TYPES.has(type)) {
            errors.push(label + ": неизвестный тип " + type);
        }

        if (nomination.gender && !VALID_GENDERS.has(nomination.gender)) {
            errors.push(label + ": неизвестная категория gender");
        }

        if (type === "duo") {
            const pairIds = new Set();
            (nomination.duoPairs || []).forEach((pair) => {
                if (!pair || typeof pair.id !== "string" || !pair.id.trim()) {
                    errors.push(nomination.id + ": у пары отсутствует id");
                    return;
                }
                if (pairIds.has(pair.id)) {
                    errors.push(nomination.id + ": повторяется id пары " + pair.id);
                }
                pairIds.add(pair.id);

                [pair.firstId, pair.secondId].forEach((id) => {
                    if (!nomineeIds.has(id)) {
                        errors.push(nomination.id + ": неизвестный номинант " + id);
                    }
                });
                if (pair.firstId === pair.secondId) {
                    errors.push(nomination.id + ": пара не может состоять из одного человека");
                }
            });
        } else {
            const eligibleIds = nomination.nomineeIds || [];
            if (!Array.isArray(eligibleIds) || eligibleIds.length === 0) {
                errors.push(nomination.id + ": не задан список допустимых номинантов");
                return;
            }
            const eligibleSeen = new Set();
            eligibleIds.forEach((id) => {
                if (!nomineeIds.has(id)) {
                    errors.push(nomination.id + ": неизвестный номинант " + id);
                }
                if (eligibleSeen.has(id)) {
                    errors.push(nomination.id + ": повторяется номинант " + id);
                }
                eligibleSeen.add(id);
            });
        }
    });

    if (errors.length) {
        throw new Error("База номинантов некорректна:\n- " + errors.join("\n- "));
    }

    return true;
}
