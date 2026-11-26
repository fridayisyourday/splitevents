/* Shared page structure for all top-level content sections. */
import { createElement } from "../dom.js?v=20261126-1";
export function createPageShell({ title, pageClass = "", contentClass = "" }) {
    const page = createElement(
        "div",
        ["section-page", pageClass].filter(Boolean).join(" ")
    );
    const content = createElement(
        "div",
        ["section-page-content", contentClass].filter(Boolean).join(" ")
    );
    const header = createElement("header", "section-page-header");
    const heading = createElement("h1", "section-page-title", title);
    const body = createElement("div", "section-page-body");

    header.appendChild(heading);
    content.append(header, body);
    page.appendChild(content);

    return { page, content, header, heading, body };
}

export function createEmptyStateElement({ message, note }) {
    const state = createElement("div", "empty-state");
    state.setAttribute("role", "status");
    state.setAttribute("aria-live", "polite");

    if (message) {
        state.appendChild(createElement("p", "empty-state-message", message));
    }

    if (note) {
        state.appendChild(createElement("p", "empty-state-note", note));
    }

    return state;
}