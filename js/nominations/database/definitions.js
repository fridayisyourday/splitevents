/* Eligibility rules for each published nomination. Runtime selections live in state.js. */
import { NOMINEES } from "./nominees.js?v=20261126-1";
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
