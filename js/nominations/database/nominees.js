/* Canonical list of people who can appear in nomination choices. */
const NOMINEE_RECORDS = [
    { id: "fridayisyourday", name: "fridayisyourday", gender: "M", avatar: "" },
    { id: "burgomister", name: "Burgomister", gender: "M", avatar: "" },
    { id: "holydark", name: "HolyDark", gender: "F", avatar: "" },
    { id: "cyathere", name: "cyathere", gender: "F", avatar: "" },
    { id: "vale", name: "Vale", gender: "F", avatar: "" },
    { id: "theriazon", name: "theriazon", gender: "M", avatar: "" },
    { id: "otorgy", name: "Otorgy", gender: "M", avatar: "" },
    { id: "skatpoint", name: "skatpoint", gender: "M", avatar: "" },
    { id: "fork", name: "fork", gender: "F", avatar: "" },
    { id: "dlv1190", name: "DLV1190", gender: "M", avatar: "" },
    { id: "isada", name: "Isada", gender: "M", avatar: "" },
    { id: "yaarbuzik", name: "yaarbuzik", gender: "M", avatar: "" },
    { id: "tr1ckl", name: "tr1ckl", gender: "M", avatar: "" },
    { id: "don-burger", name: "Дон Бургер", gender: "I", avatar: "" },
    { id: "backrooms", name: "BACKROOMS", gender: "I", avatar: "" },
    { id: "burgomister-42", name: "Burgomister 42", gender: "I", avatar: "" },
    { id: "fridayisyourday-42", name: "fridayisyourday 42", gender: "I", avatar: "" },
    { id: "shalker", name: "Шалкер", gender: "I", avatar: "" },
    { id: "misterion", name: "Мистерион", gender: "I", avatar: "" },
    { id: "windigo", name: "Виндиго", gender: "I", avatar: "" }
];

const GENDER_ORDER = Object.freeze({ F: 0, M: 1, I: 2 });
const nameCollator = new Intl.Collator("ru", {
    sensitivity: "base",
    numeric: true
});

export function compareNames(first, second) {
    return nameCollator.compare(first.name, second.name);
}

export const NOMINEES = Object.freeze(
    [...NOMINEE_RECORDS]
        .sort((first, second) => (
            GENDER_ORDER[first.gender] - GENDER_ORDER[second.gender]
            || compareNames(first, second)
        ))
        .map((person) => Object.freeze({ ...person }))
);

/* Read-only by convention: consumers use get/has and never mutate the map. */
export const nomineeById = new Map(
    NOMINEES.map((person) => [person.id, person])
);
