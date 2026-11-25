
/* =========================================
   SplitEvents
   Application Entry Point
   ========================================= */

(function () {
    "use strict";

    // =====================================
    // TELEGRAM INITIALIZATION
    // =====================================

    const telegram = window.Telegram?.WebApp;

    if (telegram) {
        try {
            telegram.ready();
            telegram.expand();

            if (typeof telegram.setBackgroundColor === "function") {
                telegram.setBackgroundColor("#ffffff");
            }

            if (typeof telegram.setHeaderColor === "function") {
                telegram.setHeaderColor("#ffffff");
            }

            console.info(
                "SplitEvents: Telegram initialized"
            );

        } catch (error) {
            console.error(
                "SplitEvents: Telegram initialization error",
                error
            );
        }
    } else {
        console.info(
            "SplitEvents: opened outside Telegram"
        );
    }

    // =====================================
    // PAGE ELEMENTS
    // =====================================

    const mainContent = document.getElementById("main-content");

    const homePage = document.getElementById("home-page");

    const profilePage = document.getElementById("profile-page");

    const profileHomeButton = document.getElementById(
        "profile-home-button"
    );

    const profileIcon = profileHomeButton?.querySelector(
        ".profile-icon"
    );

    const homeIcon = profileHomeButton?.querySelector(
        ".home-icon"
    );

    // Проверка необходимых элементов

    if (
        !mainContent ||
        !homePage ||
        !profilePage ||
        !profileHomeButton ||
        !profileIcon ||
        !homeIcon
    ) {
        console.error(
            "SplitEvents: required page elements not found"
        );

        return;
    }

    // =====================================
    // ROUTING
    // =====================================

    function getCurrentPage() {
        const route = window.location.hash
            .replace(/^#\/?/, "")
            .split(/[/?]/)[0];

        return route === "profile"
            ? "profile"
            : "home";
    }

    // =====================================
    // RENDER PAGE
    // =====================================

    function renderPage(moveFocus = false) {
        const currentPage = getCurrentPage();

        const isProfile = currentPage === "profile";

        // Переключение страниц

        homePage.hidden = isProfile;
        profilePage.hidden = !isProfile;

        // Переключение иконок

        profileIcon.hidden = isProfile;
        homeIcon.hidden = !isProfile;

        // Доступность кнопки

        profileHomeButton.setAttribute(
            "aria-label",
            isProfile
                ? "На главную"
                : "Открыть профиль"
        );

        profileHomeButton.title = isProfile
            ? "На главную"
            : "Профиль";

        // Заголовок страницы

        document.title = isProfile
            ? "Профиль — Сплит"
            : "Сплит — SplitEvents";

        // Перемещение фокуса

        if (moveFocus) {
            mainContent.focus({
                preventScroll: true
            });
        }

        console.info(
            "SplitEvents: current page — " + currentPage
        );
    }

    // =====================================
    // NAVIGATION
    // =====================================

    function navigateTo(page) {
        const destination = page === "profile"
            ? "#/profile"
            : "#/";

        if (window.location.hash === destination) {
            renderPage(true);
            return;
        }

        window.location.hash = destination;
    }

    // =====================================
    // PROFILE / HOME BUTTON
    // =====================================

    profileHomeButton.addEventListener(
        "click",
        function () {
            const currentPage = getCurrentPage();

            if (currentPage === "home") {
                navigateTo("profile");
            } else {
                navigateTo("home");
            }
        }
    );

    // =====================================
    // BROWSER NAVIGATION
    // =====================================

    window.addEventListener(
        "hashchange",
        function () {
            renderPage(true);
        }
    );

    window.addEventListener(
        "pageshow",
        function () {
            renderPage(false);
        }
    );

    // =====================================
    // APPLICATION START
    // =====================================

    renderPage();

    console.info(
        "SplitEvents: application initialized"
    );

})();
