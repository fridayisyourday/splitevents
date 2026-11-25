/* Shared event card template. All future events use this renderer. */
function createElement(tagName, className, text) {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function safeId(value) {
    return String(value).replace(/[^a-z0-9_-]/gi, "-");
}

function createCountdownCell(part, label) {
    const cell = createElement("div", "event-countdown-cell");
    const value = createElement("span", "event-countdown-value", "00");
    value.dataset.countdownPart = part;
    const caption = createElement("span", "event-countdown-unit", label);
    cell.append(value, caption);
    return cell;
}

function formatPart(value) {
    return String(value).padStart(2, "0");
}

export function createEventCard(event) {
    const card = createElement("article", "event-card");
    card.dataset.eventId = event.id;

    const titleId = "event-title-" + safeId(event.id);
    const descriptionId = "event-description-" + safeId(event.id);
    const actionNoteId = "event-action-note-" + safeId(event.id);
    card.setAttribute("aria-labelledby", titleId);

    const poster = createElement("div", "event-card-poster");
    const image = createElement("img", "event-card-image");
    image.src = event.image;
    image.alt = event.imageAlt || "";
    image.width = 960;
    image.height = 540;
    image.loading = "lazy";
    image.decoding = "async";

    const posterShade = createElement("div", "event-card-poster-shade");
    const posterCopy = createElement("div", "event-card-poster-copy");
    posterCopy.append(
        createElement("span", "event-card-poster-brand", event.brand || "SplitEvents"),
        createElement("span", "event-card-poster-title", "SQUASH"),
        createElement("span", "event-card-poster-subtitle", "AWARD 2026")
    );
    poster.append(image, posterShade, posterCopy);

    const body = createElement("div", "event-card-body");
    const topLine = createElement("div", "event-card-topline");
    topLine.append(
        createElement("span", "event-card-category", event.category || "Событие"),
        createElement("span", "event-card-index", "EVENT  /  " + event.id.toUpperCase().replace(/-/g, " "))
    );

    const title = createElement("h2", "event-card-title", event.title);
    title.id = titleId;

    const details = createElement("div", "event-card-details");
    const dateBlock = createElement("div", "event-date-block");
    dateBlock.append(
        createElement("span", "event-detail-label", "ДАТА СОБЫТИЯ"),
        createElement("strong", "event-date-value", event.dateLabel)
    );

    const countdown = createElement("div", "event-countdown");
    const countdownHeader = createElement("span", "event-detail-label", "ДО ЗАВЕРШЕНИЯ");
    const countdownGrid = createElement("div", "event-countdown-grid");
    countdownGrid.append(
        createCountdownCell("days", "дней"),
        createCountdownCell("hours", "часов"),
        createCountdownCell("minutes", "минут"),
        createCountdownCell("seconds", "секунд")
    );
    const countdownNote = createElement("span", "event-countdown-note", "до конца события:)");
    const countdownStatus = createElement("span", "event-countdown-status");
    countdownStatus.setAttribute("aria-live", "polite");
    countdown.append(countdownHeader, countdownGrid, countdownNote, countdownStatus);
    details.append(dateBlock, countdown);

    const description = createElement("p", "event-card-description");
    description.id = descriptionId;
    const lead = createElement("strong", "event-card-description-lead", event.descriptionLead || "");
    description.append(lead, document.createTextNode(event.descriptionText || ""));

    const footer = createElement("div", "event-card-footer");
    const action = createElement("button", "event-card-action", event.actionLabel || "Принять участие");
    action.type = "button";
    action.disabled = true;
    action.setAttribute("aria-describedby", actionNoteId);

    const actionNote = createElement("p", "event-card-action-note", event.actionNote || "Участие пока недоступно.");
    actionNote.id = actionNoteId;
    footer.append(action, actionNote);

    body.append(topLine, title, details, description, footer);
    card.append(poster, body);

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
                node.textContent = "—";
            });
            countdownStatus.textContent = "Дата события не задана";
            return;
        }

        const remaining = Math.max(0, endTime - now);
        const totalSeconds = Math.floor(remaining / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        countdownValues.days.textContent = String(days);
        countdownValues.hours.textContent = formatPart(hours);
        countdownValues.minutes.textContent = formatPart(minutes);
        countdownValues.seconds.textContent = formatPart(seconds);

        countdownStatus.textContent = remaining === 0 ? "Событие завершилось" : "";
        card.classList.toggle("is-event-ended", remaining === 0);
    }

    updateCountdown();

    return {
        element: card,
        updateCountdown
    };
}
