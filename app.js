
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
    // TELEGRAM USER DATA
    // =====================================

    const telegramUser = telegram?.initDataUnsafe?.user ?? null;

    // Имя и фамилия пользователя из Telegram

    function getTelegramDisplayName() {
        const firstName = telegramUser?.first_name || "";
        const lastName = telegramUser?.last_name || "";

        const fullName = [firstName, lastName]
            .filter(Boolean)
            .join(" ")
            .trim();

        return fullName || "Пользователь Telegram";
    }

    // Telegram-тег пользователя

    function getTelegramTag() {
        const username = String(
            telegramUser?.username || ""
        ).trim().replace(/^@/, "");

        return username
            ? "@" + username
            : "Тег не указан";
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

    // =====================================
    // PROFILE ELEMENTS
    // =====================================

    const nicknameInput = document.getElementById(
        "nickname-input"
    );

    const nicknameEditButton = document.getElementById(
        "nickname-edit-button"
    );

    const nicknameEditIcon = document.querySelector(
        ".nickname-edit-icon"
    );

    const nicknameSaveIcon = document.querySelector(
        ".nickname-save-icon"
    );

    const telegramTag = document.getElementById(
        "telegram-tag"
    );

    // =====================================
    // CHECK REQUIRED ELEMENTS
    // =====================================

    if (
        !mainContent ||
        !homePage ||
        !profilePage ||
        !profileHomeButton ||
        !profileIcon ||
        !homeIcon ||
        !nicknameInput ||
        !nicknameEditButton ||
        !nicknameEditIcon ||
        !nicknameSaveIcon ||
        !telegramTag
    ) {
        console.error(
            "SplitEvents: required page elements not found"
        );

        return;
    }

    // =====================================
    // NICKNAME STORAGE
    // =====================================

    const NICKNAME_STORAGE_KEY = "splitevents.nickname.v1";

    // Получаем сохранённый ник

    function readSavedNickname() {
        try {
            return (
                window.localStorage.getItem(
                    NICKNAME_STORAGE_KEY
                ) || ""
            ).trim();

        } catch (error) {
            console.warn(
                "SplitEvents: could not read saved nickname",
                error
            );

            return "";
        }
    }

    let savedNickname = readSavedNickname();

    // Сохраняем ник.
    // Пустое значение удаляет пользовательский ник.

    function writeSavedNickname(value) {
        try {
            if (value) {
                window.localStorage.setItem(
                    NICKNAME_STORAGE_KEY,
                    value
                );
            } else {
                window.localStorage.removeItem(
                    NICKNAME_STORAGE_KEY
                );
            }

            return true;

        } catch (error) {
            console.warn(
                "SplitEvents: could not save nickname",
                error
            );

            return false;
        }
    }

    // Текущий ник с учётом пользовательского изменения

    function getCurrentNickname() {
        return savedNickname || getTelegramDisplayName();
    }

    // =====================================
    // PROFILE RENDERING
    // =====================================

    function setNicknameEditMode(isEditing) {
        nicknameInput.readOnly = !isEditing;

        nicknameEditIcon.hidden = isEditing;
        nicknameSaveIcon.hidden = !isEditing;

        nicknameEditButton.setAttribute(
            "aria-label",
            isEditing ? "Сохранить ник" : "Изменить ник"
        );

        nicknameEditButton.title = isEditing
            ? "Сохранить ник"
            : "Изменить ник";
    }

    function renderProfile() {
        nicknameInput.value = getCurrentNickname();

        telegramTag.textContent = getTelegramTag();

        setNicknameEditMode(false);
    }

    // =====================================
    // NICKNAME EDITING
    // =====================================

    function startNicknameEditing() {
        setNicknameEditMode(true);

        nicknameInput.focus();
        nicknameInput.select();
    }

    function saveNickname() {
        const newNickname = nicknameInput.value.trim();

        // Пустое поле означает возврат к имени Telegram

        savedNickname = newNickname;

        writeSavedNickname(savedNickname);

        // Обновляем отображение

        nicknameInput.value = getCurrentNickname();

        setNicknameEditMode(false);
    }

    function cancelNicknameEditing() {
        nicknameInput.value = getCurrentNickname();

        setNicknameEditMode(false);
    }

    // Нажатие на карандаш или галочку

    nicknameEditButton.addEventListener(
        "click",
        function () {
            if (nicknameInput.readOnly) {
                startNicknameEditing();
            } else {
                saveNickname();
            }
        }
    );

    // Enter — сохранить ник.
    // Escape — отменить редактирование.

    nicknameInput.addEventListener(
        "keydown",
        function (event) {
            if (event.key === "Enter") {
                event.preventDefault();

                saveNickname();
            }

            if (event.key === "Escape") {
                event.preventDefault();

                cancelNicknameEditing();
            }
        }
    );

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

        // При открытии профиля обновляем данные

        if (isProfile) {
            renderProfile();
        }

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
