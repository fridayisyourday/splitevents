/* SplitEvents — application entry point. */
import {
    initTelegram,
    setTelegramBackButtonVisible,
    getTelegramUserId,
    getTelegramInitData
} from "./js/telegram.js?v=20261126-6";
import { createNotifications } from "./js/notifications.js?v=20261126-2";
import { createFriendsPage } from "./js/pages/friends.js?v=20261126-4";
import { createUserProfilePage } from "./js/pages/user-profile.js?v=20261126-3";
import { renderEventsPage } from "./js/pages/events.js?v=20261126-18";
import { EVENTS } from "./js/events/data.js?v=20261126-10";
import { getHiddenEventIds, hideEvent, unhideEvent } from "./js/events/hidden-state.js?v=20261126-3";
import {
    getActiveEventsCount,
    getNextActiveEventExpiry
} from "./js/events/active-state.js?v=20261126-2";
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
    let currentPage = null;
    let currentRouteKey = "";
    let menuOpen = false;
    let activeEventsBadgeTimeout = null;

    createNominationsWidget(document.getElementById("vote-widget"));

    const telegramUserId = getTelegramUserId();
    const telegramInitData = getTelegramInitData();

    const friendsPage = createFriendsPage(pageElements.friends, {
        initData: telegramInitData,
        onOpenUser: (publicId) => {
            window.location.hash = "#/users/" + encodeURIComponent(publicId);
        }
    });
    const userProfilePage = createUserProfilePage(pageElements.users, {
        initData: telegramInitData
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
        const hiddenEventIds = getHiddenEventIds(telegramUserId);
        const activeCount = getActiveEventsCount(EVENTS, hiddenEventIds);
        window.dispatchEvent(new CustomEvent("splitevents:menu-badge", {
            detail: { count: activeCount }
        }));
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

    function getPublicUserId() {
        const match = (window.location.hash || "").match(/^#\/users\/([0-9a-f]{32})(?:[/?]|$)/i);
        return match ? match[1] : "";
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

    updateActiveEventsBadge();

    function renderPage(moveFocus = false) {
        const page = getCurrentPage();
        const publicUserId = page === "users" ? getPublicUserId() : "";
        const routeKey = page === "users" ? "users:" + publicUserId : page;
        const changed = routeKey !== currentRouteKey;

        if (changed && currentPage === "events" && page !== "events") {
            eventsPage.stop();
        }

        if (changed && currentPage === "friends" && page !== "friends") {
            friendsPage.stop();
        }

        if (changed && currentPage === "users" && page !== "users") {
            userProfilePage.stop();
        }

        Object.entries(pageElements).forEach(([pageName, element]) => {
            element.hidden = pageName !== page;
        });

        currentPage = page;
        window.dispatchEvent(new CustomEvent("splitevents:menu-page", {
            detail: { page }
        }));

        if (changed && page === "events") {
            eventsPage.start();
        }

        if (changed && page === "friends") {
            friendsPage.start();
        }

        if (changed && page === "users") {
            userProfilePage.load(publicUserId);
        }

        currentRouteKey = routeKey;
        updateActiveEventsBadge();

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
        updateActiveEventsBadge();
        renderPage(false);
    });

    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) updateActiveEventsBadge();
    });

    renderPage(false);

}
