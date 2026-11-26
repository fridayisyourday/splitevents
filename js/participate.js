/* SQUASH! participation page bootstrap. */
import { initTelegram } from "./telegram.js?v=20261126-2";
import { EVENTS } from "./events/data.js?v=20261126-5";
import { createAwardsWidget } from "./awards-widget.js?v=20261126-2";

initTelegram();

const params = new URLSearchParams(window.location.search);
const eventId = params.get("event");
const event = EVENTS.find(function (item) {
    return item.id === eventId;
}) || null;

const title = document.getElementById("participation-title");
const description = document.getElementById("participation-description");
const date = document.getElementById("participation-date");
const awardsSection = document.getElementById("awards-section");
const awardsRoot = document.getElementById("awards-widget");
const errorState = document.getElementById("participation-error");

if (event && event.id === "squash-award-2026") {
    title.textContent = event.title;
    description.textContent = event.description;
    date.textContent = event.dateLabel || "";
    document.title = event.title + " — Friends Awards 2026 | Сплит";

    createAwardsWidget(awardsRoot);
} else {
    awardsSection.hidden = true;
    errorState.hidden = false;
    title.textContent = "Участие в событии";
    description.textContent = "";
    date.hidden = true;
    document.title = "Событие не найдено | Сплит";
}
