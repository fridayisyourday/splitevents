/* Shared empty-state renderer, used by every section page. */
import {
    createPageShell,
    createEmptyStateElement
} from "./page-shell.js?v=20261126-2";

export function renderEmptyState(container, options) {
    const shell = createPageShell({
        title: options.title,
        pageClass: options.pageClass || "",
        contentClass: options.contentClass || ""
    });

    shell.body.classList.add("section-page-body--center");
    shell.body.appendChild(createEmptyStateElement({
        message: options.message,
        note: options.note
    }));

    container.replaceChildren(shell.page);
}