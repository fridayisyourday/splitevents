/* SplitEvents — application entry point. */
import {
    initTelegram,
    setTelegramBackButtonVisible,
    getTelegramUserId,
    getTelegramName,
    getTelegramTag,
    getTelegramPhotoUrl
} from "./js/telegram.js?v=20261126-1";
import { createMenu } from "./js/menu.js?v=20261126-2";
import { createProfile } from "./js/profile.js?v=20261126-1";
import { renderEventsPage } from "./js/pages/events.js?v=20261126-3";
import { EVENTS } from "./js/events/data.js?v=20261126-1";
import {
    getUnreadEventsCount,
    markEventsAsSeen
} from "./js/events/read-state.js?v=20261126-1";
import { renderServersPage } from "./js/pages/servers.js?v=20261126-2";

const pageElements = {
    home: document.getElementById("home-page"),
    profile: document.getElementById("profile-page"),
    events: document.getElementById("events-page"),
    servers: document.getElementById("servers-page")
};
const mainContent = document.getElementById("main-content");

const missingPages = Object.entries(pageElements)
    .filter(([, element]) => !element)
    .map(([page]) => page);

if (missingPages.length || !mainContent) {
    console.error(
        "SplitEvents: required page containers are missing:",
        missingPages
    );
} else {
    let currentPage = null;
    let menu = null;

    const telegramUserId = getTelegramUserId();
    const profile = createProfile({
        userId: telegramUserId,
        getTelegramName,
        getTelegramTag,
        getTelegramPhotoUrl
    });

    // The event list is data-driven; each item uses the same card template.
    const eventsPage = renderEventsPage(pageElements.events, EVENTS);
    renderServersPage(pageElements.servers);

    function getCurrentPage() {
        const route = (window.location.hash || "#/")
            .replace(/^#\/?/, "")
            .split(/[/?]/)[0];

        return Object.prototype.hasOwnProperty.call(pageElements, route)
            ? route
            : "home";
    }

    function updateTelegramBackButton() {
        const shouldShow = Boolean(
            (menu && menu.isOpen()) || getCurrentPage() !== "home"
        );
        setTelegramBackButtonVisible(shouldShow);
    }

    function navigateTo(page) {
        const allowedPages = Object.keys(pageElements);
        const safePage = allowedPages.includes(page) ? page : "home";
        const target = safePage === "home" ? "#/" : "#/" + safePage;

        if (window.location.hash === target) {
            renderPage(true);
        } else {
            window.location.hash = target;
        }
    }

    menu = createMenu({
        onNavigate: navigateTo,
        onStateChange: updateTelegramBackButton
    });
    menu.updateUnreadEventsCount(getUnreadEventsCount(EVENTS, telegramUserId));

    function renderPage(moveFocus = false) {
        const page = getCurrentPage();
        const changed = page !== currentPage;

        if (changed && currentPage === "profile" && page !== "profile") {
            profile.leave();
        }

        if (changed && currentPage === "events" && page !== "events") {
            eventsPage.stop();
        }

        Object.entries(pageElements).forEach(([pageName, element]) => {
            element.hidden = pageName !== page;
        });

        if (changed && page === "profile") {
            profile.render();
        }

        currentPage = page;
        menu.updateForPage(page);

        if (changed && page === "events") {
            markEventsAsSeen(EVENTS, telegramUserId);
            menu.updateUnreadEventsCount(getUnreadEventsCount(EVENTS, telegramUserId));
            eventsPage.start();
        }

        updateTelegramBackButton();

        const pageTitles = {
            home: "Сплит — SplitEvents",
            profile: "Профиль — Сплит",
            events: "Текущие события — Сплит",
            servers: "Сервера — Сплит"
        };
        document.title = pageTitles[page];

        if (moveFocus) {
            mainContent.focus({ preventScroll: true });
        }

        console.info("SplitEvents: current page — " + page);
    }

    initTelegram({
        onBack: () => {
            if (menu && menu.isOpen()) {
                menu.close(true);
                return;
            }

            if (getCurrentPage() !== "home") {
                navigateTo("home");
            }
        }
    });

    menu.bind();

    window.addEventListener("hashchange", () => {
        if (menu && menu.isOpen()) {
            menu.close(false);
        }
        renderPage(true);
    });

    window.addEventListener("pageshow", () => {
        renderPage(false);
    });

    renderPage(false);
    profile.loadImages();

    console.info("SplitEvents: application ready");
}
