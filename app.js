/* SplitEvents — application entry point. */
import {
    initTelegram,
    setTelegramBackButtonVisible
} from "./js/telegram.js?v=20261126-6";
import { createNotifications } from "./js/notifications.js?v=20261126-2";
import { renderServersPage } from "./js/pages/servers.js?v=20261126-4";
import { createNominationsWidget } from "./js/nominations.js?v=20261126-19";

const pageElements = {
    home: document.getElementById("home-page"),
    profile: document.getElementById("profile-page"),
    friends: document.getElementById("friends-page"),
    users: document.getElementById("user-profile-page"),
    events: document.getElementById("events-page"),
    servers: document.getElementById("servers-page"),
    nominations: document.getElementById("nominations-page")
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
    const notifications = createNotifications(document.getElementById("notification-region"));
    window.addEventListener("splitevents:notification", (event) => {
        const notification = event.detail || {};
        if (notification.type === "error") {
            notifications.error(notification.message, notification.detail);
        } else if (notification.type === "warning") {
            notifications.warning(notification.message, notification.detail);
        }
    });
    let menuOpen = false;

    createNominationsWidget(document.getElementById("vote-widget"));

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
            menuOpen || getCurrentPage() !== "home"
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

    window.addEventListener("splitevents:menu-state", (event) => {
        menuOpen = Boolean(event.detail?.open);
        updateTelegramBackButton();
    });

    // Ask the mounted Vue header for its current state in case it was opened
    // before the legacy page controllers finished initializing.
    window.dispatchEvent(new CustomEvent("splitevents:menu-command", {
        detail: { action: "sync-state" }
    }));

    window.addEventListener("splitevents:rerender", () => renderPage(true));

    function renderPage(moveFocus = false) {
        const page = getCurrentPage();
        Object.entries(pageElements).forEach(([pageName, element]) => {
            element.hidden = pageName !== page;
        });

        window.dispatchEvent(new CustomEvent("splitevents:menu-page", {
            detail: { page }
        }));


        updateTelegramBackButton();

        const pageTitles = {
            home: "Сплит — SplitEvents",
            profile: "Профиль — Сплит",
            friends: "Друзья — Сплит",
            users: "Профиль — Сплит",
            events: "Текущие события — Сплит",
            servers: "Сервера — Сплит",
            nominations: "НОМИНАЦИИ 2026 — Сплит"
        };
        document.title = pageTitles[page];

        if (moveFocus) {
            mainContent.focus({ preventScroll: true });
        }
    }

    initTelegram({
        onBack: () => {
            if (menuOpen) {
                window.dispatchEvent(new CustomEvent("splitevents:menu-command", {
                    detail: { action: "close", restoreFocus: true }
                }));
                return;
            }

            const page = getCurrentPage();
            if (page === "users") {
                navigateTo("friends");
            } else if (page === "nominations") {
                navigateTo("events");
            } else if (page !== "home") {
                navigateTo("home");
            }
        }
    });

    window.addEventListener("hashchange", () => {
        if (menuOpen) {
            window.dispatchEvent(new CustomEvent("splitevents:menu-command", {
                detail: { action: "close", restoreFocus: false }
            }));
        }
        renderPage(true);
    });

    window.addEventListener("pageshow", () => {
        renderPage(false);
    });

    renderPage(false);

}
