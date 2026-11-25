/* Servers page. */
import { renderEmptyState } from "./empty-state.js?v=20261126-2";

export function renderServersPage(container) {
    renderEmptyState(container, {
        title: "Сервера",
        message: "нет активных серверов",
        note: "оставайтесь с нами!"
    });
}
