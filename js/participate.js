/* Temporary participation page. The full flow will be built in a later step. */
import { initTelegram } from "./telegram.js?v=20261126-2";
import { EVENTS } from "./events/data.js?v=20261126-5";

initTelegram();

const params = new URLSearchParams(window.location.search);
const eventId = params.get("event");
const event = EVENTS.find((item) => item.id === eventId) || null;

const title = document.getElementById("participation-title");
const message = document.getElementById("participation-message");
const note = document.getElementById("participation-note");

if (event) {
    title.textContent = "Участие: " + event.title;
    message.textContent = "Страница участия готовится";
    note.textContent = "Скоро здесь появится информация о том, как присоединиться к событию «" + event.title + "».";
    document.title = event.title + " — участие | Сплит";
} else {
    message.textContent = "Страница участия скоро появится";
    note.textContent = "Выберите событие на основной странице SplitEvents.";
}
