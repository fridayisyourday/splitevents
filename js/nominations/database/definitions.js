/* Eligibility rules for each published nomination. Runtime selections live in state.js. */
import { NOMINEES } from "./nominees.js?v=20261127-2";
import { validateNominationDatabase } from "./validate.js?v=20261126-1";

const NOMINATION_RECORDS = [
    {
        id: "pumpkin-king",
        title: "PUMPKING",
        type: "individual",
        gender: "M",
        nomineeIds: ["burgomister", "dlv1190", "fridayisyourday", "otorgy"]
    },
    {
        id: "pumpkin-queen",
        title: "PUMPQUEEN",
        type: "individual",
        gender: "F",
        nomineeIds: ["vale", "holydark", "cyathere"]
    },
    {
        id: "duo-of-the-year",
        title: "DUO ГОДА",
        type: "duo",
        duoPairs: [
            { id: "burgomister-fridayisyourday", firstId: "burgomister", secondId: "fridayisyourday" },
            { id: "burgomister-holydark", firstId: "burgomister", secondId: "holydark" },
            { id: "burgomister-skatpoint", firstId: "burgomister", secondId: "skatpoint" },
            { id: "dlv1190-yaarbuzik", firstId: "dlv1190", secondId: "yaarbuzik" },
            { id: "holydark-fridayisyourday", firstId: "holydark", secondId: "fridayisyourday" },
            { id: "holydark-otorgy", firstId: "holydark", secondId: "otorgy" }
        ]
    },
    {
        id: "drip-of-the-year",
        title: "DRIP ГОДА",
        type: "image",
        gender: "I",
        nomineeIds: ["backrooms", "burgomister-42", "don-burger", "fridayisyourday-42", "windigo", "misterion", "shalker"]
    },
    {
        id: "nextgen",
        title: "NEXTGEN",
        type: "fixed",
        nomineeIds: ["tr1ckl", "theriazon", "fork", "yaarbuzik"]
    },
    {
        id: "nerd",
        title: "NERD",
        type: "individual",
        nomineeIds: ["dlv1190", "fridayisyourday", "otorgy", "vale"]
    },
    {
        id: "geek",
        title: "GEEK",
        type: "individual",
        nomineeIds: ["burgomister", "fridayisyourday", "holydark", "otorgy", "theriazon"]
    },
    {
        id: "gamer",
        title: "GAMER",
        type: "individual",
        nomineeIds: ["burgomister", "dlv1190", "theriazon"]
    },
    {
        id: "creator",
        title: "CREATOR",
        type: "individual",
        nomineeIds: ["burgomister", "cyathere", "fridayisyourday", "holydark", "vamorii"]
    },
    {
        id: "gnil",
        title: "ГНИЛЬ",
        type: "individual",
        nomineeIds: ["burgomister", "dlv1190", "fridayisyourday", "otorgy", "tr1ckl"]
    },
    {
        id: "mit",
        title: "МИТ",
        type: "image",
        gender: "I",
        nomineeIds: ["burgomister-dacha", "isada-birthday", "kemerovo-dumplings", "loft", "halloween"]
    },
    {
        id: "mem",
        title: "МЕМ",
        type: "image",
        gender: "I",
        nomineeIds: ["ip-picked", "a-vy-verite", "metaverse", "slenderman-mansion", "tadc-voiceover"]
    },
    {
        id: "mog",
        title: "MOG",
        type: "individual",
        nomineeIds: ["cyathere", "dlv1190", "holydark"]
    }
];

export const NOMINATION_DEFINITIONS = Object.freeze(
    NOMINATION_RECORDS.map((nomination) => Object.freeze({
        ...nomination,
        nomineeIds: nomination.nomineeIds
            ? Object.freeze([...nomination.nomineeIds])
            : undefined,
        duoPairs: nomination.duoPairs
            ? Object.freeze(nomination.duoPairs.map((pair) => Object.freeze({ ...pair })))
            : undefined
    }))
);

validateNominationDatabase(NOMINEES, NOMINATION_DEFINITIONS);
