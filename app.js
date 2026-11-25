/* SplitEvents — application entry point. */
import {
    initTelegram,
    setTelegramBackButtonVisible,
    getTelegramUserId,
    getTelegramName,
    getTelegramTag,
    getTelegramPhotoUrl
} from "./js/telegram.js?v=20261125-4";
import { createMenu } from "./js/menu.js?v=20261125-4";
import { createProfile } from "./js/profile.js?v=20261125-4";

const homePage = document.getElementById("home-page");
const profilePage = document.getElementById("profile-page");
const serversPage = document.getElementById("servers-page");
const mainContent = document.getElementById("main-content");

if (!homePage || !profilePage || !serversPage || !mainContent) {
    console.error("SplitEvents: one or more page containers were not found.");
} else {
    let currentPage = null;
    let menu = null;

    const profile = createProfile({
        userId: getTelegramUserId(),
        getTelegramName,
        getTelegramTag,
        getTelegramPhotoUrl
    });

    function getCurrentPage() {
        const route = (window.location.hash || "#/")
            .replace(/^#\/?/, "")
            .split(/[/?]/)[0];

        if (route === "profile" || route === "servers") return route;
        return "home";
    }

    function updateTelegramBackButton() {
        const shouldShow = Boolean(
            (menu && menu.isOpen()) || getCurrentPage() !== "home"
        );
        setTelegramBackButtonVisible(shouldShow);
    }

    function navigateTo(page) {
        const allowedPages = ["home", "profile", "servers"];
        const safePage = allowedPages.includes(page) ? page : "home";
        const target = safePage === "home" ? "#/" : `#/${safePage}`;

        if (window.location.hash === target) {
            renderPage(true);
        } else {
            window.location.hash = target;
        }
    }

    menu = createMenu({
        getCurrentPage,
        onNavigate: navigateTo,
        onStateChange: updateTelegramBackButton
    });

    function renderPage(moveFocus = false) {
        const page = getCurrentPage();
        const changed = page !== currentPage;

        if (changed && currentPage === "profile" && page !== "profile") {
            profile.leave();
        }

        homePage.hidden = page !== "home";
        profilePage.hidden = page !== "profile";
        serversPage.hidden = page !== "servers";

        if (changed && page === "profile") {
            profile.render();
        }

        currentPage = page;
        menu.updateForPage(page);
        updateTelegramBackButton();

        document.title = page === "profile"
            ? "Профиль — Сплит"
            : page === "servers"
                ? "Сервера — Сплит"
                : "Сплит — SplitEvents";

        if (moveFocus) {
            mainContent.focus({ preventScroll: true });
        }

        console.info(`SplitEvents: current page — ${page}`);
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

    menu.bind({
        onProfileOrHome: () => {
            navigateTo(getCurrentPage() === "profile" ? "home" : "profile");
        }
    });

    window.addEventListener("hashchange", () => {
        if (menu && menu.isOpen()) menu.close(false);
        renderPage(true);
    });

    window.addEventListener("pageshow", () => {
        renderPage(false);
    });

    renderPage(false);
    profile.loadImages();

    console.info("SplitEvents: application ready");
}
