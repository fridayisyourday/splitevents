
/* =========================================
   SplitEvents
   Application Entry Point
   ========================================= */

(function () {
    "use strict";

    // Получаем объект Telegram Mini Apps
    const telegram = window.Telegram?.WebApp;

    // =====================================
    // ОКРУЖЕНИЕ
    // =====================================

    if (!telegram) {
        console.info(
            "SplitEvents: приложение открыто вне Telegram"
        );

        return;
    }

    // =====================================
    // ИНИЦИАЛИЗАЦИЯ TELEGRAM
    // =====================================

    try {
        // Сообщаем Telegram о готовности приложения
        if (typeof telegram.ready === "function") {
            telegram.ready();
        }

        // Раскрываем Mini App на максимальную высоту
        if (typeof telegram.expand === "function") {
            telegram.expand();
        }

        // Устанавливаем светлую цветовую схему
        if (typeof telegram.setBackgroundColor === "function") {
            telegram.setBackgroundColor("#ffffff");
        }

        if (typeof telegram.setHeaderColor === "function") {
            telegram.setHeaderColor("#ffffff");
        }

        console.info(
            "SplitEvents: Telegram initialized successfully"
        );

    } catch (error) {
        console.error(
            "SplitEvents: Telegram initialization error",
            error
        );
    }

    // =====================================
    // ПОДГОТОВКА ПРИЛОЖЕНИЯ
    // =====================================

    function initializeApp() {
        const app = document.getElementById("app");

        if (!app) {
            console.error(
                "SplitEvents: application root not found"
            );

            return;
        }

        console.info(
            "SplitEvents: application initialized"
        );
    }

    initializeApp();

})();
