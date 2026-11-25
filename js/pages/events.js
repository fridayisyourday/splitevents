/* Events page — renders visible events with the shared page shell and card template. */
import { createEventCard } from "./event-card.js?v=20261126-6";
import {
    createPageShell,
    createEmptyStateElement
} from "./page-shell.js?v=20261126-1";

function createEmptyEventsState() {
    return createEmptyStateElement({
        message: "пока ничего нет",
        note: "оставайтесь с нами!"
    });
}

export function renderEventsPage(container, events = [], options = {}) {
    const shell = createPageShell({
        title: "Текущие события",
        pageClass: "events-page",
        contentClass: "events-page-content"
    });
    const list = document.createElement("div");
    list.className = "events-list";
    list.setAttribute("aria-label", "Список событий");

    const hiddenIds = options.hiddenEventIds instanceof Set
        ? options.hiddenEventIds
        : new Set(options.hiddenEventIds || []);
    const cards = new Map();
    let timerId = null;

    function showEmptyState() {
        shell.body.classList.add("section-page-body--center");
        shell.body.replaceChildren(createEmptyEventsState());
    }

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
            showEmptyState();
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

    if (cards.size > 0) {
        shell.body.appendChild(list);
    } else {
        showEmptyState();
    }

    container.replaceChildren(shell.page);

    function updateCountdowns() {
        cards.forEach((card) => card.updateCountdown());
    }

    return {
        start() {
            if (timerId !== null) window.clearInterval(timerId);
            updateCountdowns();
            if (cards.size > 0) {
                timerId = window.setInterval(updateCountdowns, 1000);
            }
        },
        stop() {
            if (timerId !== null) {
                window.clearInterval(timerId);
                timerId = null;
            }
        }
    };
}