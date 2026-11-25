
/* SplitEvents — client-side Mini App logic. */
(function () {
    "use strict";

    const $ = (id) => document.getElementById(id);
    const webApp = window.Telegram && window.Telegram.WebApp
        ? window.Telegram.WebApp
        : null;
    const user = webApp && webApp.initDataUnsafe
        ? webApp.initDataUnsafe.user || null
        : null;

    const el = {
        main: $("main-content"),
        header: document.querySelector(".site-header"),
        home: $("home-page"),
        profile: $("profile-page"),
        menuButton: $("menu-button"),
        menuOverlay: $("menu-overlay"),
        menuBackdrop: $("menu-backdrop"),
        menuPanel: $("menu-panel"),
        menuCloseButton: $("menu-close-button"),
        eventsNavButton: $("events-nav-button"),
        profileNavButton: $("profile-nav-button"),
        profileNavLabel: $("profile-nav-label"),
        menuProfileIcon: document.querySelector(".menu-profile-icon"),
        menuHomeIcon: document.querySelector(".menu-home-icon"),
        card: $("profile-card"),
        name: $("nickname-input"),
        editButton: $("nickname-edit-button"),
        editIcon: document.querySelector(".nickname-edit-icon"),
        saveIcon: document.querySelector(".nickname-save-icon"),
        tag: $("telegram-tag"),
        avatar: $("profile-avatar-image"),
        avatarPlaceholder: $("profile-avatar-placeholder"),
        banner: $("profile-banner-image"),
        bannerPlaceholder: $("profile-banner-placeholder"),
        avatarButton: $("avatar-upload-button"),
        bannerButton: $("banner-upload-button"),
        avatarInput: $("avatar-file-input"),
        bannerInput: $("banner-file-input"),
        status: $("profile-media-status"),
        themeMeta: document.querySelector('meta[name="theme-color"]')
    };

    const required = [
        "main", "header", "home", "profile", "menuButton", "menuOverlay",
        "menuBackdrop", "menuPanel", "menuCloseButton", "eventsNavButton",
        "profileNavButton", "profileNavLabel", "menuProfileIcon", "menuHomeIcon",
        "card", "name", "editButton", "editIcon", "saveIcon", "tag",
        "avatar", "avatarPlaceholder", "banner", "bannerPlaceholder",
        "avatarButton", "bannerButton", "avatarInput", "bannerInput", "status"
    ];
    const missing = required.filter((key) => !el[key]);

    if (missing.length) {
        console.error("SplitEvents: missing HTML elements:", missing.join(", "));
        return;
    }

    const userId = user && user.id !== undefined ? String(user.id) : "guest";
    const nicknameKey = `splitevents.nickname.v2.${userId}`;
    const legacyNicknameKey = "splitevents.nickname.v1";
    const imageKeyPrefix = `user-${userId}-`;

    let nickname = readNickname();
    let editing = false;
    let currentPage = null;
    let menuOpen = false;
    let menuCloseTimer = null;

    /* ---------------- Telegram integration ---------------- */

    function validColor(value, fallback) {
        return typeof value === "string" && /^#[\da-f]{6}$/i.test(value)
            ? value
            : fallback;
    }

    function applyTheme() {
        if (!webApp) return;
        const theme = webApp.themeParams || {};
        const background = validColor(theme.bg_color, "#ffffff");
        const header = validColor(theme.header_bg_color, background);

        try {
            if (typeof webApp.setBackgroundColor === "function") {
                webApp.setBackgroundColor(background);
            }
            if (typeof webApp.setHeaderColor === "function") {
                webApp.setHeaderColor(header);
            }
        } catch (error) {
            console.warn("SplitEvents: could not update Telegram colors", error);
        }

        if (el.themeMeta) el.themeMeta.content = header;
    }

    function updateViewport() {
        if (!webApp) return;
        const root = document.documentElement;
        const stableHeight = Number(webApp.viewportStableHeight);
        const viewportHeight = Number(webApp.viewportHeight);
        const height = stableHeight > 0 ? stableHeight : viewportHeight;

        if (Number.isFinite(height) && height > 0) {
            root.style.setProperty("--app-viewport-height", `${height}px`);
        }

        const safe = webApp.safeAreaInset || {};
        const contentSafe = webApp.contentSafeAreaInset || {};
        ["top", "right", "bottom", "left"].forEach((side) => {
            const safeValue = Number(safe[side]);
            const contentValue = Number(contentSafe[side]);
            root.style.setProperty(
                `--app-safe-${side}`,
                `${Number.isFinite(safeValue) && safeValue > 0 ? safeValue : 0}px`
            );
            root.style.setProperty(
                `--app-content-safe-${side}`,
                `${Number.isFinite(contentValue) && contentValue > 0 ? contentValue : 0}px`
            );
        });
    }

    function initTelegram() {
        if (!webApp) {
            console.info("SplitEvents: opened in a regular browser");
            return;
        }

        try {
            if (typeof webApp.ready === "function") webApp.ready();
        } catch (error) {
            console.warn("SplitEvents: Telegram ready() failed", error);
        }
        try {
            if (typeof webApp.expand === "function") webApp.expand();
        } catch (error) {
            console.warn("SplitEvents: Telegram expand() failed", error);
        }

        applyTheme();
        updateViewport();

        if (typeof webApp.onEvent === "function") {
            webApp.onEvent("themeChanged", applyTheme);
            webApp.onEvent("viewportChanged", updateViewport);
            webApp.onEvent("safeAreaChanged", updateViewport);
            webApp.onEvent("contentSafeAreaChanged", updateViewport);
        }

        if (webApp.BackButton && typeof webApp.BackButton.onClick === "function") {
            webApp.BackButton.onClick(() => {
                if (menuOpen) {
                    closeMenu(true);
                } else if (getCurrentPage() === "profile") {
                    navigateTo("home");
                }
            });
        }

        console.info(
            "SplitEvents: Telegram initialized",
            webApp.platform || "unknown",
            webApp.version || "unknown"
        );
    }

    function telegramName() {
        const first = user && user.first_name ? String(user.first_name) : "";
        const last = user && user.last_name ? String(user.last_name) : "";
        return [first, last].filter(Boolean).join(" ").trim()
            || "Пользователь Telegram";
    }

    function telegramTag() {
        const username = user && user.username
            ? String(user.username).trim().replace(/^@/, "")
            : "";
        return username ? `@${username}` : "Тег не указан";
    }

    function telegramPhotoUrl() {
        const value = user && user.photo_url ? String(user.photo_url).trim() : "";
        if (!value) return "";
        try {
            const url = new URL(value);
            return url.protocol === "https:" ? url.href : "";
        } catch (error) {
            return "";
        }
    }

    // initDataUnsafe is used only to display profile details. It is not trusted
    // for server-side authentication or authorization.

    /* ---------------- Nickname storage ---------------- */

    function readNickname() {
        try {
            const current = window.localStorage.getItem(nicknameKey);
            if (current !== null) return current.trim();

            // Migrate a nickname saved by the previous app version.
            const legacy = window.localStorage.getItem(legacyNicknameKey);
            if (legacy !== null && legacy.trim()) {
                window.localStorage.setItem(nicknameKey, legacy.trim());
                window.localStorage.removeItem(legacyNicknameKey);
                return legacy.trim();
            }
        } catch (error) {
            console.warn("SplitEvents: nickname storage unavailable", error);
        }
        return "";
    }

    function saveNickname(value) {
        try {
            if (value) window.localStorage.setItem(nicknameKey, value);
            else window.localStorage.removeItem(nicknameKey);
            return true;
        } catch (error) {
            console.warn("SplitEvents: could not save nickname", error);
            return false;
        }
    }

    function currentNickname() {
        return nickname || telegramName();
    }

    function showStatus(message) {
        el.status.textContent = message || "";
        el.status.hidden = !message;
    }

    function setEditing(enabled) {
        editing = Boolean(enabled);
        el.name.readOnly = !editing;
        el.editIcon.hidden = editing;
        el.saveIcon.hidden = !editing;
        el.card.classList.toggle("is-media-editing", editing);
        el.avatarButton.tabIndex = editing ? 0 : -1;
        el.bannerButton.tabIndex = editing ? 0 : -1;
        el.editButton.setAttribute(
            "aria-label",
            editing ? "Сохранить изменения" : "Изменить профиль"
        );
        el.editButton.title = editing ? "Сохранить изменения" : "Изменить профиль";

        if (!editing) {
            el.avatarInput.value = "";
            el.bannerInput.value = "";
        }
    }

    function startEditing() {
        showStatus("");
        el.name.value = currentNickname();
        setEditing(true);
        // Do not auto-focus the name field: mobile keyboards can cover the
        // avatar/banner upload controls inside Telegram's WebView.
    }

    function finishEditing(save) {
        if (save) {
            nickname = el.name.value.trim();
            const stored = saveNickname(nickname);
            el.name.value = currentNickname();
            setEditing(false);
            if (!stored) {
                showStatus("Имя изменено, но браузер не разрешил сохранить его после закрытия приложения.");
            }
        } else {
            el.name.value = currentNickname();
            setEditing(false);
            showStatus("");
        }
    }

    el.editButton.addEventListener("click", () => {
        if (editing) finishEditing(true);
        else startEditing();
    });

    el.name.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && editing) {
            event.preventDefault();
            finishEditing(true);
        } else if (event.key === "Escape" && editing) {
            event.preventDefault();
            finishEditing(false);
        }
    });

    /* ---------------- Image persistence ---------------- */

    const databaseName = "splitevents-profile";
    const storeName = "images";
    let databasePromise = null;
    const memoryImages = Object.create(null);

    function openDatabase() {
        if (!window.indexedDB) {
            return Promise.reject(new Error("IndexedDB is unavailable"));
        }
        if (databasePromise) return databasePromise;

        databasePromise = new Promise((resolve, reject) => {
            let request;
            try {
                request = window.indexedDB.open(databaseName, 1);
            } catch (error) {
                reject(error);
                return;
            }
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName);
                }
            };
            request.onsuccess = () => {
                const db = request.result;
                db.onversionchange = () => {
                    db.close();
                    databasePromise = null;
                };
                resolve(db);
            };
            request.onerror = () => reject(request.error || new Error("Database open failed"));
            request.onblocked = () => reject(new Error("Database open was blocked"));
        }).catch((error) => {
            databasePromise = null;
            throw error;
        });

        return databasePromise;
    }

    function readImage(key) {
        if (memoryImages[key]) return Promise.resolve(memoryImages[key]);
        return openDatabase().then((db) => new Promise((resolve, reject) => {
            let transaction;
            try {
                transaction = db.transaction(storeName, "readonly");
            } catch (error) {
                reject(error);
                return;
            }
            const request = transaction.objectStore(storeName).get(key);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error || new Error("Image read failed"));
        }));
    }

    function writeImage(key, blob) {
        memoryImages[key] = blob;
        return openDatabase().then((db) => new Promise((resolve, reject) => {
            let transaction;
            try {
                transaction = db.transaction(storeName, "readwrite");
            } catch (error) {
                reject(error);
                return;
            }
            transaction.objectStore(storeName).put(blob, key);
            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => reject(transaction.error || new Error("Image save failed"));
            transaction.onabort = () => reject(transaction.error || new Error("Image save aborted"));
        }));
    }

    const images = {
        avatar: {
            element: el.avatar,
            placeholder: el.avatarPlaceholder,
            key: `${imageKeyPrefix}avatar`,
            objectUrl: "",
            revision: 0,
            loadId: 0
        },
        banner: {
            element: el.banner,
            placeholder: el.bannerPlaceholder,
            key: `${imageKeyPrefix}banner`,
            objectUrl: "",
            revision: 0,
            loadId: 0
        }
    };

    function setImage(type, source, isObjectUrl) {
        const item = images[type];
        item.loadId += 1;
        const loadId = item.loadId;

        if (item.objectUrl) {
            URL.revokeObjectURL(item.objectUrl);
            item.objectUrl = "";
        }

        if (!source) {
            item.element.removeAttribute("src");
            item.element.hidden = true;
            item.placeholder.hidden = false;
            return;
        }

        item.element.onload = () => {
            if (loadId !== item.loadId) return;
            item.element.hidden = false;
            item.placeholder.hidden = true;
        };
        item.element.onerror = () => {
            if (loadId !== item.loadId) return;
            item.element.removeAttribute("src");
            item.element.hidden = true;
            item.placeholder.hidden = false;
            console.warn(`SplitEvents: ${type} image could not be loaded`);
        };

        item.element.src = source;
        if (isObjectUrl) item.objectUrl = source;
    }

    function optimizeImage(file, maxDimension) {
        return new Promise((resolve, reject) => {
            const sourceUrl = URL.createObjectURL(file);
            const image = new Image();
            image.onload = () => {
                try {
                    const width = image.naturalWidth;
                    const height = image.naturalHeight;
                    if (!width || !height) throw new Error("Invalid image dimensions");

                    const scale = Math.min(1, maxDimension / Math.max(width, height));
                    const canvas = document.createElement("canvas");
                    canvas.width = Math.max(1, Math.round(width * scale));
                    canvas.height = Math.max(1, Math.round(height * scale));
                    const context = canvas.getContext("2d");
                    if (!context || typeof canvas.toBlob !== "function") {
                        throw new Error("Canvas export is not supported");
                    }
                    context.drawImage(image, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error("Image conversion failed"));
                    }, "image/jpeg", 0.86);
                } catch (error) {
                    reject(error);
                } finally {
                    URL.revokeObjectURL(sourceUrl);
                }
            };
            image.onerror = () => {
                URL.revokeObjectURL(sourceUrl);
                reject(new Error("Unsupported image format"));
            };
            image.src = sourceUrl;
        });
    }

    async function restoreImages() {
        // Telegram photo is the immediate fallback; the user's upload wins if saved.
        setImage("avatar", telegramPhotoUrl(), false);

        const avatarRevision = images.avatar.revision;
        const bannerRevision = images.banner.revision;
        const results = await Promise.all([
            readImage(images.avatar.key).catch((error) => {
                console.warn("SplitEvents: avatar storage unavailable", error);
                return null;
            }),
            readImage(images.banner.key).catch((error) => {
                console.warn("SplitEvents: banner storage unavailable", error);
                return null;
            })
        ]);

        if (results[0] && avatarRevision === images.avatar.revision) {
            setImage("avatar", URL.createObjectURL(results[0]), true);
        }
        if (results[1] && bannerRevision === images.banner.revision) {
            setImage("banner", URL.createObjectURL(results[1]), true);
        }
    }

    /* ---------------- Image selection ---------------- */

    async function handleImage(input, type) {
        const file = input.files && input.files[0];
        if (!file) return;

        if (file.type && !file.type.startsWith("image/")) {
            showStatus("Выбери файл изображения.");
            input.value = "";
            return;
        }
        if (file.size > 20 * 1024 * 1024) {
            showStatus("Файл слишком большой. Максимальный размер — 20 МБ.");
            input.value = "";
            return;
        }

        input.disabled = true;
        showStatus("Обрабатываем изображение…");

        try {
            const blob = await optimizeImage(file, type === "avatar" ? 900 : 1800);
            const item = images[type];
            item.revision += 1;

            let persisted = true;
            try {
                await writeImage(item.key, blob);
            } catch (error) {
                persisted = false;
                console.warn("SplitEvents: persistent image storage unavailable", error);
            }

            setImage(type, URL.createObjectURL(blob), true);
            showStatus(persisted
                ? "Изображение сохранено на этом устройстве."
                : "Изображение установлено, но не сохранится после закрытия приложения.");
        } catch (error) {
            console.error(`SplitEvents: ${type} upload failed`, error);
            showStatus("Не удалось обработать файл. Попробуй JPEG, PNG или WebP.");
        } finally {
            input.disabled = false;
            input.value = "";
        }
    }

    function openPicker(input) {
        if (editing && !input.disabled) input.click();
    }

    el.avatarButton.addEventListener("click", () => openPicker(el.avatarInput));
    el.bannerButton.addEventListener("click", () => openPicker(el.bannerInput));
    el.avatarInput.addEventListener("change", () => handleImage(el.avatarInput, "avatar"));
    el.bannerInput.addEventListener("change", () => handleImage(el.bannerInput, "banner"));

    /* ---------------- Pages and navigation ---------------- */

    function getCurrentPage() {
        const hash = window.location.hash || "#/";
        const route = hash.replace(/^#\/?/, "").split(/[/?]/)[0];
        return route === "profile" ? "profile" : "home";
    }

    function updateBackButton(isProfile) {
        const backButton = webApp && webApp.BackButton;
        if (!backButton) return;

        try {
            if ((isProfile || menuOpen) && typeof backButton.show === "function") {
                backButton.show();
            } else if (!isProfile && !menuOpen && typeof backButton.hide === "function") {
                backButton.hide();
            }
        } catch (error) {
            console.warn("SplitEvents: Telegram BackButton update failed", error);
        }
    }

    /* ---------------- Side navigation drawer ---------------- */

    function updateMenuNavigation() {
        const isProfile = getCurrentPage() === "profile";
        const isHome = !isProfile;

        el.profileNavLabel.textContent = isProfile ? "Главная" : "Профиль";
        el.menuProfileIcon.hidden = isProfile;
        el.menuHomeIcon.hidden = !isProfile;

        if (isHome) {
            el.eventsNavButton.setAttribute("aria-current", "page");
        } else {
            el.eventsNavButton.removeAttribute("aria-current");
        }
    }

    function openMenu() {
        if (menuOpen) return;

        if (menuCloseTimer !== null) {
            window.clearTimeout(menuCloseTimer);
            menuCloseTimer = null;
        }

        menuOpen = true;
        el.menuOverlay.hidden = false;
        el.menuButton.setAttribute("aria-expanded", "true");
        document.body.classList.add("menu-open");
        el.header.inert = true;
        el.main.inert = true;
        el.header.setAttribute("aria-hidden", "true");
        el.main.setAttribute("aria-hidden", "true");
        updateBackButton(getCurrentPage() === "profile");

        // Reflow allows the drawer to animate from its closed position.
        void el.menuOverlay.offsetWidth;
        window.requestAnimationFrame(() => {
            if (!menuOpen) return;
            el.menuOverlay.classList.add("is-open");
            el.eventsNavButton.focus();
        });
    }

    function closeMenu(restoreFocus) {
        if (!menuOpen && el.menuOverlay.hidden) return;

        menuOpen = false;
        el.menuOverlay.classList.remove("is-open");
        el.menuButton.setAttribute("aria-expanded", "false");
        document.body.classList.remove("menu-open");
        el.header.inert = false;
        el.main.inert = false;
        el.header.removeAttribute("aria-hidden");
        el.main.removeAttribute("aria-hidden");
        updateBackButton(getCurrentPage() === "profile");

        if (restoreFocus) {
            el.menuButton.focus({ preventScroll: true });
        }

        if (menuCloseTimer !== null) {
            window.clearTimeout(menuCloseTimer);
        }

        menuCloseTimer = window.setTimeout(() => {
            if (!menuOpen) el.menuOverlay.hidden = true;
            menuCloseTimer = null;
        }, 240);
    }

    function getDrawerFocusables() {
        return Array.from(
            el.menuPanel.querySelectorAll(
                'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
        ).filter((element) => !element.hidden && element.getClientRects().length > 0);
    }

    function handleDrawerKeydown(event) {
        if (!menuOpen) return;

        if (event.key === "Escape") {
            event.preventDefault();
            closeMenu(true);
            return;
        }

        if (event.key !== "Tab") return;

        const focusables = getDrawerFocusables();
        if (!focusables.length) {
            event.preventDefault();
            el.menuPanel.focus();
            return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    el.menuButton.addEventListener("click", () => {
        if (menuOpen) closeMenu(true);
        else openMenu();
    });

    el.menuBackdrop.addEventListener("click", () => closeMenu(true));
    el.menuCloseButton.addEventListener("click", () => closeMenu(true));
    document.addEventListener("keydown", handleDrawerKeydown);

    el.eventsNavButton.addEventListener("click", () => {
        closeMenu(false);
        navigateTo("home");
    });

    el.profileNavButton.addEventListener("click", () => {
        const destination = getCurrentPage() === "profile" ? "home" : "profile";
        closeMenu(false);
        navigateTo(destination);
    });

    function renderProfile() {
        el.name.value = currentNickname();
        el.tag.textContent = telegramTag();
        setEditing(false);
        showStatus("");
    }

    function renderPage(moveFocus) {
        const page = getCurrentPage();
        const isProfile = page === "profile";
        const changed = page !== currentPage;

        el.home.hidden = isProfile;
        el.profile.hidden = !isProfile;
        document.title = isProfile ? "Профиль — Сплит" : "Сплит — SplitEvents";

        if (changed && isProfile) renderProfile();
        if (changed && !isProfile && editing) finishEditing(false);

        currentPage = page;
        updateMenuNavigation();
        updateBackButton(isProfile);
        if (moveFocus) el.main.focus({ preventScroll: true });
    }

    function navigateTo(page) {
        const target = page === "profile" ? "#/profile" : "#/";
        if (window.location.hash === target) renderPage(true);
        else window.location.hash = target;
    }

    window.addEventListener("hashchange", () => {
        if (menuOpen) closeMenu(false);
        renderPage(true);
    });
    window.addEventListener("pageshow", () => {
        updateViewport();
        renderPage(false);
    });

    /* ---------------- Start ---------------- */

    initTelegram();
    renderPage(false);
    restoreImages();
    console.info("SplitEvents: application ready");
})();
