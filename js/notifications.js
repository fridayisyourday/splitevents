import { createIcon } from "./dom.js?v=20261126-2";

/* Accessible, reusable notifications for errors and warnings. */
const MAX_VISIBLE_NOTIFICATIONS = 3;
const DEFAULT_DURATION = 8000;

export function createNotifications(region) {
    let container = region;

    if (!container) {
        container = document.createElement("div");
        container.id = "notification-region";
        container.className = "notification-region";
        container.setAttribute("aria-label", "уведомления");
        document.body.appendChild(container);
    }

    const active = new Map();
    let nextId = 0;

    function dismiss(id) {
        const notification = active.get(id);
        if (!notification) return;

        window.clearTimeout(notification.timeout);
        notification.element.remove();
        active.delete(id);
    }

    function show(type, message, detail = "") {
        const text = typeof message === "string" ? message.trim() : "";
        if (!text) return null;

        while (active.size >= MAX_VISIBLE_NOTIFICATIONS) {
            dismiss(active.keys().next().value);
        }

        const id = ++nextId;
        const element = document.createElement("article");
        element.className = "app-notification app-notification--" + type;
        element.setAttribute("role", type === "error" ? "alert" : "status");

        const symbol = document.createElement("span");
        symbol.className = "app-notification__symbol";
        symbol.setAttribute("aria-hidden", "true");
        symbol.appendChild(createIcon(type === "error" ? "x" : "info"));

        const content = document.createElement("div");
        content.className = "app-notification__content";

        const title = document.createElement("p");
        title.className = "app-notification__title";
        title.textContent = text;
        content.appendChild(title);

        if (typeof detail === "string" && detail.trim()) {
            const description = document.createElement("p");
            description.className = "app-notification__detail";
            description.textContent = detail.trim();
            content.appendChild(description);
        }

        const closeButton = document.createElement("button");
        closeButton.className = "app-notification__close";
        closeButton.type = "button";
        closeButton.setAttribute("aria-label", "закрыть уведомление");
        closeButton.appendChild(createIcon("x"));
        closeButton.addEventListener("click", () => dismiss(id));

        element.append(symbol, content, closeButton);
        container.appendChild(element);

        const timeout = window.setTimeout(
            () => dismiss(id),
            DEFAULT_DURATION
        );
        active.set(id, { element, timeout });

        return id;
    }

    return {
        error(message, detail) {
            return show("error", message, detail);
        },
        warning(message, detail) {
            return show("warning", message, detail);
        },
        clear() {
            Array.from(active.keys()).forEach(dismiss);
        }
    };
}
