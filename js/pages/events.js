/* Events page — renders a list using the shared event card template. */
import { createEventCard } from "./event-card.js?v=20261126-2";

function createElement(tagName, className, text) {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

export function renderEventsPage(container, events = []) {
    const page = createElement("div", "section-page events-page");
    const content = createElement("div", "section-page-content events-page-content");
    const header = createElement("header", "section-page-header events-page-header");
    const title = createElement("h1", "section-page-title", "Текущие события");
    header.appendChild(title);

    const list = createElement("div", "events-list");
    list.setAttribute("aria-label", "Список событий");

    const cards = events.map((event) => createEventCard(event));
    cards.forEach((card) => list.appendChild(card.element));

    if (cards.length === 0) {
        const empty = createElement("div", "empty-state");
        empty.setAttribute("role", "status");
        empty.append(
            createElement("p", "empty-state-message", "пока ничего нет"),
            createElement("p", "empty-state-note", "оставайтесь с нами!")
        );
        list.appendChild(empty);
    }

    content.append(header, list);
    page.appendChild(content);
    container.replaceChildren(page);

    let timerId = null;

    function updateCountdowns() {
        cards.forEach((card) => card.updateCountdown());
    }

    return {
        start() {
            if (timerId !== null) window.clearInterval(timerId);
            updateCountdowns();
            if (cards.length) timerId = window.setInterval(updateCountdowns, 1000);
        },
        stop() {
            if (timerId !== null) {
                window.clearInterval(timerId);
                timerId = null;
            }
        }
    };
}
