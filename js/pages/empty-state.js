/* Shared accessible empty-state page renderer. */
export function renderEmptyState(container, options) {
    const page = document.createElement("div");
    page.className = "section-page";

    const content = document.createElement("div");
    content.className = "section-page-content";

    const header = document.createElement("header");
    header.className = "section-page-header";

    const title = document.createElement("h1");
    title.className = "section-page-title";
    title.textContent = options.title;

    header.appendChild(title);

    const state = document.createElement("div");
    state.className = "empty-state";
    state.setAttribute("role", "status");
    state.setAttribute("aria-live", "polite");

    const message = document.createElement("p");
    message.className = "empty-state-message";
    message.textContent = options.message;

    const note = document.createElement("p");
    note.className = "empty-state-note";
    note.textContent = options.note;

    state.append(message, note);
    content.append(header, state);
    page.appendChild(content);
    container.replaceChildren(page);
}
