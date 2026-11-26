/* Events page — supports showing and hiding the user's hidden events. */
import { createEventCard } from "./event-card.js?v=20261126-7";
import {
    createPageShell,
    createEmptyStateElement
} from "./page-shell.js?v=20261126-1";

function createElement(tagName, className, text) {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function createSvgElement(tagName, attributes = {}) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tagName);
    Object.entries(attributes).forEach(([name, value]) => {
        node.setAttribute(name, value);
    });
    return node;
}

function createVisibilityIcon(showingHidden) {
    const svg = createSvgElement("svg", {
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "1.8",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "aria-hidden": "true",
        focusable: "false"
    });

    svg.appendChild(createSvgElement("path", {
        d: "M2.5 12s3.4-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.4 6.5-9.5 6.5S2.5 12 2.5 12Z"
    }));

    if (showingHidden) {
        svg.appendChild(createSvgElement("path", {
            d: "M4 4L20 20"
        }));
    } else {
        svg.appendChild(createSvgElement("circle", {
            cx: "12",
            cy: "12",
            r: "2.8"
        }));
    }

    return svg;
}

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

    visibilityButton.type = "button";
    visibilityButton.setAttribute("aria-pressed", "false");
    shell.header.appendChild(visibilityButton);

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
            createVisibilityIcon(showingHidden),
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
                const card = createEventCard(event, {
                    showHideAction: !hiddenIds.has(event.id),
                    onHide: (eventId) => {
                        const wasAlreadyHidden = hiddenIds.has(eventId);
                        const result = wasAlreadyHidden
                            ? true
                            : typeof options.onHideEvent === "function"
                                ? options.onHideEvent(eventId)
                                : true;

                        if (result !== false) {
                            hiddenIds.add(eventId);
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
