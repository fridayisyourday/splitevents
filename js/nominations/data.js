/* Static nomination catalog and per-widget voting state factory. */

const NOMINEE_DATA = [
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

const NOMINATION_TEMPLATES = [
    {
        id: "pumpkin-king",
        title: "PUMPKIN KING",
        gender: "M",
        logo: "",
        nomineeIds: ["burgomister", "dlv1190", "fridayisyourday", "otorgy"],
        selectedId: null,
        selectedFromPoolId: null,
        page: 0
    },
    {
        id: "pumpkin-queen",
        title: "PUMPKIN QUEEN",
        gender: "F",
        logo: "",
        nomineeIds: ["vale", "holydark", "cyathere"],
        selectedId: null,
        selectedFromPoolId: null,
        page: 0
    },
    {
        id: "duo-of-the-year",
        title: "DUO ГОДА",
        type: "duo",
        logo: "",
        duoPairs: [
            { id: "burgomister-fridayisyourday", firstId: "burgomister", secondId: "fridayisyourday" },
            { id: "burgomister-holydark", firstId: "burgomister", secondId: "holydark" },
            { id: "burgomister-skatpoint", firstId: "burgomister", secondId: "skatpoint" },
            { id: "dlv1190-yaarbuzik", firstId: "dlv1190", secondId: "yaarbuzik" },
            { id: "holydark-fridayisyourday", firstId: "holydark", secondId: "fridayisyourday" },
            { id: "holydark-otorgy", firstId: "holydark", secondId: "otorgy" }
        ],
        selectedPairId: null,
        page: 0
    },
    {
        id: "drip-of-the-year",
        title: "DRIP ГОДА",
        type: "image",
        gender: "I",
        logo: "",
        nomineeIds: ["backrooms", "burgomister-42", "don-burger", "fridayisyourday-42", "windigo", "misterion", "shalker"],
        selectedId: null,
        suggestionMode: "idle",
        suggestionDraft: "",
        suggestedText: "",
        page: 0
    },
    {
        id: "nextgen",
        title: "NEXTGEN",
        type: "fixed",
        logo: "",
        nomineeIds: ["tr1ckl", "theriazon", "fork", "yaarbuzik"],
        selectedId: null,
        page: 0
    }
];

const compareNames = function (first, second) {
    return first.name.localeCompare(second.name, "en", {
        sensitivity: "base",
        numeric: true
    });
};
const genderOrder = { F: 0, M: 1, I: 2 };

NOMINEE_DATA.sort(function (first, second) {
    return genderOrder[first.gender] - genderOrder[second.gender]
        || compareNames(first, second);
});

export const NOMINEES = Object.freeze(NOMINEE_DATA.map(function (person) {
    return Object.freeze(person);
}));

export const nomineeById = new Map(NOMINEES.map(function (person) {
    return [person.id, person];
}));

export { compareNames };

export function createNominationState() {
    return NOMINATION_TEMPLATES.map(function (nomination) {
        return {
            ...nomination,
            nomineeIds: nomination.nomineeIds ? [...nomination.nomineeIds] : undefined,
            duoPairs: nomination.duoPairs
                ? nomination.duoPairs.map(function (pair) { return { ...pair }; })
                : undefined
        };
    });
}
