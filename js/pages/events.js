/* Events page — renders visible events using the shared card template. */
import { createEventCard } from "./event-card.js?v=20261126-5";

function createElement(tagName, className, text) {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function createEmptyState() {
    const empty = createElement("div", "empty-state");
    empty.setAttribute("role", "status");
    empty.append(
        createElement("p", "empty-state-message", "пока ничего нет"),
        createElement("p", "empty-state-note", "оставайтесь с нами!")
    );
    return empty;
}

export function renderEventsPage(container, events = [], options = {}) {
    const page = createElement("div", "section-page events-page");
    const content = createElement("div", "section-page-content events-page-content");
    const header = createElement("header", "section-page-header events-page-header");
    const title = createElement("h1", "section-page-title", "Текущие события");
    header.appendChild(title);

    const list = createElement("div", "events-list");
    list.setAttribute("aria-label", "Список событий");

    const hiddenIds = options.hiddenEventIds instanceof Set
        ? options.hiddenEventIds
        : new Set(options.hiddenEventIds || []);
    const cards = new Map();

    function removeEventCard(eventId) {
        const card = cards.get(eventId);
        if (!card) return false;

        card.element.remove();
        cards.delete(eventId);

        if (cards.size === 0) {
            if (timerId !== null) {
                window.clearInterval(timerId);
                timerId = null;
            }
            list.replaceChildren(createEmptyState());
        }
        return true;
    }

    events
        .filter((event) => !hiddenIds.has(event.id))
        .forEach((event) => {
            const card = createEventCard(event, {
                onHide: (eventId) => {
                    const result = typeof options.onHideEvent === "function"
                        ? options.onHideEvent(eventId)
                        : true;

                    if (result !== false) {
                        removeEventCard(eventId);
                    }
                }
            });
            cards.set(event.id, card);
            list.appendChild(card.element);
        });

    if (cards.size === 0) {
        list.appendChild(createEmptyState());
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
            if (cards.size) timerId = window.setInterval(updateCountdowns, 1000);
        },
        stop() {
            if (timerId !== null) {
                window.clearInterval(timerId);
                timerId = null;
            }
        }
    };
}