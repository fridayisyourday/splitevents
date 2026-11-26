/* Shared horizontal event-card template. New events provide data, not markup. */
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

function createEyeIcon(isHidden) {
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

    if (isHidden) {
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

function createCountdownPart(part, unit) {
    const group = createElement("span", "event-countdown-part");
    const value = createElement("span", "event-countdown-value", "00");
    value.dataset.countdownPart = part;
    const suffix = createElement("span", "event-countdown-unit", unit);
    group.append(value, suffix);
    return group;
}

function formatPart(value) {
    return String(value).padStart(2, "0");
}

export function createEventCard(event, { onToggleHidden, onParticipate, isHidden = false } = {}) {
    const card = createElement("article", "event-card");
    card.dataset.eventId = event.id;

    const safeId = String(event.id).replace(/[^a-z0-9_-]/gi, "-");
    const titleId = "event-title-" + safeId;
    const descriptionId = "event-description-" + safeId;
    card.setAttribute("aria-labelledby", titleId);

    const artwork = createElement("div", "event-card-artwork");
    artwork.setAttribute("aria-hidden", "true");

    if (event.image) {
        const image = createElement("img", "event-card-image");
        image.src = event.image;
        image.alt = "";
        image.width = 1200;
        image.height = 480;
        image.loading = "lazy";
        image.decoding = "async";
        artwork.appendChild(image);
    }

    const wash = createElement("div", "event-card-wash");
    wash.setAttribute("aria-hidden", "true");

    const content = createElement("div", "event-card-content");
    const title = createElement("h2", "event-card-title", event.title);
    title.id = titleId;

    const description = createElement(
        "p",
        "event-card-description",
        event.description || ""
    );
    description.id = descriptionId;

    const meta = createElement("div", "event-card-meta");
    const date = createElement("time", "event-card-date", event.dateLabel || "");
    if (event.endsAt) {
        const parsedDate = new Date(event.endsAt);
        if (Number.isFinite(parsedDate.getTime())) {
            date.dateTime = parsedDate.toISOString();
        }
    }

    const separator = createElement("span", "event-card-meta-separator", "•");
    separator.setAttribute("aria-hidden", "true");

    const countdown = createElement("span", "event-card-countdown");
    countdown.setAttribute("role", "timer");
    countdown.setAttribute("aria-label", "Время до окончания события");
    countdown.setAttribute("aria-live", "off");
    countdown.append(
        createCountdownPart("days", "д"),
        createCountdownPart("hours", "ч"),
        createCountdownPart("minutes", "м"),
        createCountdownPart("seconds", "с")
    );
    meta.append(date, separator, countdown);

    const actions = createElement("div", "event-card-actions");
    const action = createElement(
        "button",
        "event-card-action ui-button ui-button--primary",
        event.actionLabel || "Принять участие"
    );
    action.type = "button";
    action.setAttribute("aria-describedby", descriptionId);
    action.title = "Открыть голосование";
    action.addEventListener("click", () => {
        if (typeof onParticipate === "function") {
            onParticipate(event);
        }
    });

    const visibilityButton = createElement(
        "button",
        "event-card-visibility-action ui-button ui-button--icon ui-button--secondary ui-button--round"
    );
    visibilityButton.type = "button";

    function updateVisibilityButton() {
        const label = isHidden ? "Вернуть событие" : "Скрыть событие";
        visibilityButton.setAttribute("aria-label", label);
        visibilityButton.title = label;
        visibilityButton.replaceChildren(createEyeIcon(isHidden));
    }

    updateVisibilityButton();
    visibilityButton.addEventListener("click", () => {
        if (typeof onToggleHidden === "function") {
            onToggleHidden(event.id, !isHidden);
        }
    });

    actions.append(action, visibilityButton);
    content.append(title, description, meta, actions);
    card.append(artwork, wash, content);

    const endTime = new Date(event.endsAt).getTime();
    const countdownValues = {
        days: countdown.querySelector('[data-countdown-part="days"]'),
        hours: countdown.querySelector('[data-countdown-part="hours"]'),
        minutes: countdown.querySelector('[data-countdown-part="minutes"]'),
        seconds: countdown.querySelector('[data-countdown-part="seconds"]')
    };

    function updateCountdown(now = Date.now()) {
        if (!Number.isFinite(endTime)) {
            Object.values(countdownValues).forEach((node) => {
                node.textContent = "-";
            });
            card.classList.remove("is-event-ended");
            return;
        }

        const remaining = Math.max(0, endTime - now);
        const totalSeconds = Math.floor(remaining / 1000);
        const values = {
            days: Math.floor(totalSeconds / 86400),
            hours: Math.floor((totalSeconds % 86400) / 3600),
            minutes: Math.floor((totalSeconds % 3600) / 60),
            seconds: totalSeconds % 60
        };

        countdownValues.days.textContent = String(values.days);
        countdownValues.hours.textContent = formatPart(values.hours);
        countdownValues.minutes.textContent = formatPart(values.minutes);
        countdownValues.seconds.textContent = formatPart(values.seconds);

        card.classList.toggle("is-event-ended", remaining === 0);
    }

    updateCountdown();

    return { element: card, updateCountdown };
}