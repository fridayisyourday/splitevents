/* Events page. */
import { renderEmptyState } from "./empty-state.js?v=20261126-2";

export function renderEventsPage(container) {
    renderEmptyState(container, {
        title: "Текущие события",
        message: "пока ничего нет",
        note: "оставайтесь с нами!"
    });
}
