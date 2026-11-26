/* SplitEvents — application entry point. */
import {
    initTelegram,
    setTelegramBackButtonVisible,
    getTelegramUserId,
    getTelegramName,
    getTelegramTag,
    getTelegramPhotoUrl
} from "./js/telegram.js?v=20261126-4";
import { createMenu } from "./js/menu.js?v=20261126-4";
import { createProfile } from "./js/profile.js?v=20261126-2";
import { renderEventsPage } from "./js/pages/events.js?v=20261126-16";
import { EVENTS } from "./js/events/data.js?v=20261126-9";
import { getHiddenEventIds, hideEvent, unhideEvent } from "./js/events/hidden-state.js?v=20261126-3";
import {
    getActiveEventsCount,
    getNextActiveEventExpiry
} from "./js/events/active-state.js?v=20261126-2";
import { renderServersPage } from "./js/pages/servers.js?v=20261126-4";
import { createNominationsWidget } from "./js/nominations.js?v=20261126-14";

const pageElements = {
    home: document.getElementById("home-page"),
    profile: document.getElementById("profile-page"),
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
    let currentPage = null;
    let menu = null;
    let activeEventsBadgeTimeout = null;

    createNominationsWidget(document.getElementById("vote-widget"));

    const telegramUserId = getTelegramUserId();
    const profile = createProfile({
        userId: telegramUserId,
        getTelegramName,
        getTelegramTag,
        getTelegramPhotoUrl
    });

    function scheduleActiveEventsBadgeUpdate(hiddenEventIds) {
        if (activeEventsBadgeTimeout !== null) {
            window.clearTimeout(activeEventsBadgeTimeout);
            activeEventsBadgeTimeout = null;
        }

        const nextExpiry = getNextActiveEventExpiry(EVENTS, hiddenEventIds);
        if (!Number.isFinite(nextExpiry)) return;

        const delay = Math.min(
            Math.max(0, nextExpiry - Date.now() + 50),
            2_147_483_647
        );
        activeEventsBadgeTimeout = window.setTimeout(() => {
            activeEventsBadgeTimeout = null;
            updateActiveEventsBadge();
        }, delay);
    }

    function updateActiveEventsBadge() {
        if (!menu) return;

        const hiddenEventIds = getHiddenEventIds(telegramUserId);
        const activeCount = getActiveEventsCount(EVENTS, hiddenEventIds);
        menu.updateActiveEventsCount(activeCount);
        scheduleActiveEventsBadgeUpdate(hiddenEventIds);
    }

    // The event list uses a shared card template and per-user hidden state.
    const eventsPage = renderEventsPage(pageElements.events, EVENTS, {
        hiddenEventIds: getHiddenEventIds(telegramUserId),
        onToggleHidden: (eventId, shouldHide) => {
            const changed = shouldHide
                ? hideEvent(eventId, telegramUserId)
                : unhideEvent(eventId, telegramUserId);
            updateActiveEventsBadge();
            return changed;
        },
        onParticipateEvent: (event) => {
            const destination = "#/nominations?event=" + encodeURIComponent(event.id);
            if (window.location.hash === destination) {
                renderPage(true);
            } else {
                window.location.hash = destination;
            }
        }
    });
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
    updateActiveEventsBadge();

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
            eventsPage.start();
        }

        updateActiveEventsBadge();

        updateTelegramBackButton();

        const pageTitles = {
            home: "Сплит — SplitEvents",
            profile: "Профиль — Сплит",
            events: "Текущие события — Сплит",
            servers: "Сервера — Сплит",
            nominations: "НОМИНАЦИИ 2026 — Сплит"
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

            const page = getCurrentPage();
            if (page === "nominations") {
                navigateTo("events");
            } else if (page !== "home") {
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
        updateActiveEventsBadge();
        renderPage(false);
    });

    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) updateActiveEventsBadge();
    });

    renderPage(false);
    profile.loadImages();

    console.info("SplitEvents: application ready");
}
