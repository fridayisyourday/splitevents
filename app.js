
/* =================================
   SplitEvents — Application
   ================================= */

(function () {
    const tg = window.Telegram?.WebApp;

    // Проверяем, открыто ли приложение внутри Telegram
    if (!tg) {
        console.info("SplitEvents: opened outside Telegram");
        return;
    }

    // Сообщаем Telegram, что приложение готово
    tg.ready();

    // Раскрываем приложение на доступную высоту
    tg.expand();

    // Устанавливаем белый фон
    if (typeof tg.setBackgroundColor === "function") {
        tg.setBackgroundColor("#ffffff");
    }

    // Устанавливаем белый цвет верхней панели
    if (typeof tg.setHeaderColor === "function") {
        tg.setHeaderColor("#ffffff");
    }

    console.info("SplitEvents initialized");
})();
