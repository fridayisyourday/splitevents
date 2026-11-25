/* Shared horizontal event-card template. New events provide data, not markup. */
function createElement(tagName, className, text) {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
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

export function createEventCard(event) {
    const card = createElement("article", "event-card");
    card.dataset.eventId = event.id;

    const safeId = String(event.id).replace(/[^a-z0-9_-]/gi, "-");
    const titleId = "event-title-" + safeId;
    const descriptionId = "event-description-" + safeId;
    card.setAttribute("aria-labelledby", titleId);

    // Artwork stays as a background layer. Without an image it uses the
    // exact same placeholder token as an empty profile banner.
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

    const action = createElement(
        "button",
        "event-card-action",
        event.actionLabel || "Принять участие"
    );
    action.type = "button";
    action.disabled = true;
    action.setAttribute("aria-describedby", descriptionId);
    action.title = "Участие пока не подключено";

    content.append(title, description, meta, action);
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

        const ended = remaining === 0;
        card.classList.toggle("is-event-ended", ended);
    }

    updateCountdown();

    return {
        element: card,
        updateCountdown
    };
}