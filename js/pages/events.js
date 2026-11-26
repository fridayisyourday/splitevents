/* Events page — supports showing and hiding the user's hidden events. */
import { createElement, createEyeIcon } from "../dom.js?v=20261126-1";
import { createEventCard } from "./event-card.js?v=20261126-14";
import {
    createPageShell,
    createEmptyStateElement
} from "./page-shell.js?v=20261126-2";

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
    const list = createElement("div", "events-list");
    list.setAttribute("aria-label", "Список событий");

    const hiddenIds = options.hiddenEventIds instanceof Set
        ? options.hiddenEventIds
        : new Set(options.hiddenEventIds || []);
    const cards = new Map();
    const visibilityButton = createElement(
        "button",
        "events-visibility-toggle ui-button ui-button--secondary"
    );
    const footer = createElement("div", "events-page-footer");

    visibilityButton.type = "button";
    visibilityButton.setAttribute("aria-pressed", "false");
    footer.appendChild(visibilityButton);

    let showingHidden = false;
    let timerId = null;
    let isStarted = false;

    function updateVisibilityButton() {
        const label = showingHidden
            ? "Скрыть скрытые"
            : "Показать скрытые";
        const disabled = hiddenIds.size === 0 && !showingHidden;

        visibilityButton.disabled = disabled;
        visibilityButton.title = disabled
            ? "Скрытых событий пока нет"
            : label + " события";
        visibilityButton.setAttribute("aria-label", label + " события");
        visibilityButton.setAttribute("aria-pressed", String(showingHidden));
        visibilityButton.replaceChildren(
            createEyeIcon(showingHidden),
            createElement("span", "", label)
        );
    }

    function showEmptyState() {
        shell.body.classList.add("section-page-body--center");
        shell.body.replaceChildren(createEmptyEventsState());
    }

    function updateCountdowns() {
        cards.forEach((card) => card.updateCountdown());
    }

    function stopTimer() {
        if (timerId !== null) {
            window.clearInterval(timerId);
            timerId = null;
        }
    }

    function startTimer() {
        stopTimer();
        if (isStarted && cards.size > 0) {
            updateCountdowns();
            timerId = window.setInterval(updateCountdowns, 1000);
        }
    }

    function renderCards() {
        stopTimer();
        cards.clear();
        list.replaceChildren();
        shell.body.classList.remove("section-page-body--center");
        shell.body.replaceChildren();

        events
            .filter((event) => showingHidden || !hiddenIds.has(event.id))
            .forEach((event) => {
                const isHidden = hiddenIds.has(event.id);
                const card = createEventCard(event, {
                    isHidden,
                    onParticipate: options.onParticipateEvent,
                    onToggleHidden: (eventId, shouldHide) => {
                        const result = typeof options.onToggleHidden === "function"
                            ? options.onToggleHidden(eventId, shouldHide)
                            : true;

                        if (result !== false) {
                            if (shouldHide) {
                                hiddenIds.add(eventId);
                            } else {
                                hiddenIds.delete(eventId);
                            }

                            updateVisibilityButton();
                            renderCards();
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

        shell.body.appendChild(footer);
        startTimer();
    }

    visibilityButton.addEventListener("click", () => {
        if (visibilityButton.disabled) return;
        showingHidden = !showingHidden;
        updateVisibilityButton();
        renderCards();
    });

    updateVisibilityButton();
    renderCards();
    container.replaceChildren(shell.page);

    return {
        start() {
            isStarted = true;
            startTimer();
        },
        stop() {
            isStarted = false;
            stopTimer();
        }
    };
}
