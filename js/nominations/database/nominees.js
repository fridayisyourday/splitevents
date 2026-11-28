/* Canonical list of people who can appear in nomination choices. */
import { getNomineeAvatarUrl } from "../../media.js?v=20261127-3";
const NOMINEE_RECORDS = [
    { id: "fridayisyourday", name: "fridayisyourday", gender: "M", avatar: getNomineeAvatarUrl("fridayisyourday") },
    { id: "burgomister", name: "Burgomister", gender: "M", avatar: getNomineeAvatarUrl("burgomister") },
    { id: "holydark", name: "HolyDark", gender: "F", avatar: getNomineeAvatarUrl("holydark") },
    { id: "cyathere", name: "cyathere", gender: "F", avatar: getNomineeAvatarUrl("cyathere") },
    { id: "vale", name: "Vale", gender: "F", avatar: getNomineeAvatarUrl("vale") },
    { id: "vamorii", name: "vamorii", gender: "F", avatar: getNomineeAvatarUrl("vamorii") },
    { id: "theriazon", name: "theriazon", gender: "M", avatar: getNomineeAvatarUrl("theriazon") },
    { id: "otorgy", name: "Otorgy", gender: "M", avatar: getNomineeAvatarUrl("otorgy") },
    { id: "skatpoint", name: "skatpoint", gender: "M", avatar: getNomineeAvatarUrl("skatpoint") },
    { id: "fork", name: "fork", gender: "F", avatar: getNomineeAvatarUrl("fork") },
    { id: "dlv1190", name: "DLV1190", gender: "M", avatar: getNomineeAvatarUrl("dlv1190") },
    { id: "isada", name: "Isada", gender: "M", avatar: getNomineeAvatarUrl("isada") },
    { id: "yaarbuzik", name: "yaarbuzik", gender: "M", avatar: getNomineeAvatarUrl("yaarbuzik") },
    { id: "tr1ckl", name: "tr1ckl", gender: "M", avatar: getNomineeAvatarUrl("tr1ckl") },
    { id: "don-burger", name: "Дон Бургер", gender: "I", avatar: getNomineeAvatarUrl("don-burger") },
    { id: "backrooms", name: "BACKROOMS", gender: "I", avatar: getNomineeAvatarUrl("backrooms") },
    { id: "burgomister-42", name: "Burgomister 42", gender: "I", avatar: getNomineeAvatarUrl("burgomister-42") },
    { id: "fridayisyourday-42", name: "fridayisyourday 42", gender: "I", avatar: getNomineeAvatarUrl("fridayisyourday-42") },
    { id: "shalker", name: "Шалкер", gender: "I", avatar: getNomineeAvatarUrl("shalker") },
    { id: "misterion", name: "Мистерион", gender: "I", avatar: getNomineeAvatarUrl("misterion") },
    { id: "windigo", name: "Виндиго", gender: "I", avatar: getNomineeAvatarUrl("windigo") },

    { id: "halloween", name: "Хеллоуин", gender: "I", avatar: getNomineeAvatarUrl("halloween") },
    { id: "isada-birthday", name: "День Рождения Isada", gender: "I", avatar: getNomineeAvatarUrl("isada-birthday") },
    { id: "loft", name: "Лофт", gender: "I", avatar: getNomineeAvatarUrl("loft") },
    { id: "kemerovo-dumplings", name: "Кемеровские пельмени", gender: "I", avatar: getNomineeAvatarUrl("kemerovo-dumplings") },
    { id: "burgomister-dacha", name: "Дача Burgomister", gender: "I", avatar: getNomineeAvatarUrl("burgomister-dacha") },
    { id: "slenderman-mansion", name: "Особняк Слендермена", gender: "I", avatar: getNomineeAvatarUrl("slenderman-mansion") },
    { id: "a-vy-verite", name: "А вы верити?", gender: "I", avatar: getNomineeAvatarUrl("a-vy-verite") },
    { id: "tadc-voiceover", name: "Переозвучка TADC", gender: "I", avatar: getNomineeAvatarUrl("tadc-voiceover") },
    { id: "metaverse", name: "Метавселенная", gender: "I", avatar: getNomineeAvatarUrl("metaverse") },
    { id: "ip-picked", name: "IP подобрал", gender: "I", avatar: getNomineeAvatarUrl("ip-picked") }
];

const GENDER_ORDER = Object.freeze({ F: 0, M: 1, I: 2 });
const nameCollator = new Intl.Collator("en", {
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
