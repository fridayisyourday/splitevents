/* Servers page — shared page shell and shared empty state. */
import { renderEmptyState } from "./empty-state.js?v=20261126-4";

export function renderServersPage(container) {
    renderEmptyState(container, {
        title: "Сервера",
        message: "нет активных серверов",
        note: "оставайтесь с нами!"
    });
}