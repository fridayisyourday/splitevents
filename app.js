
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

            console.info("SplitEvents: Telegram initialized");
        } catch (error) {
            console.error(
                "SplitEvents: Telegram initialization error",
                error
            );
        }
    } else {
        console.info("SplitEvents: opened outside Telegram");
    }

    // =====================================
    // TELEGRAM USER DATA
    // =====================================

    const telegramUser = telegram?.initDataUnsafe?.user ?? null;

    function getTelegramDisplayName() {
        const firstName = telegramUser?.first_name || "";
        const lastName = telegramUser?.last_name || "";

        const fullName = [firstName, lastName]
            .filter(Boolean)
            .join(" ")
            .trim();

        return fullName || "Пользователь Telegram";
    }

    function getTelegramTag() {
        const username = String(
            telegramUser?.username || ""
        ).trim().replace(/^@/, "");

        return username ? "@" + username : "Тег не указан";
    }

    // Telegram может передать ссылку на фото профиля.
    // Если такой ссылки нет, будет показана заглушка.
    function getTelegramPhotoUrl() {
        const photoUrl = telegramUser?.photo_url;

        return typeof photoUrl === "string" && photoUrl.trim()
            ? photoUrl.trim()
            : "";
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

    const profileCard = document.getElementById("profile-card");

    const nicknameInput = document.getElementById("nickname-input");
    const nicknameEditButton = document.getElementById(
        "nickname-edit-button"
    );
    const nicknameEditIcon = document.querySelector(
        ".nickname-edit-icon"
    );
    const nicknameSaveIcon = document.querySelector(
        ".nickname-save-icon"
    );
    const telegramTag = document.getElementById("telegram-tag");

    const avatarImage = document.getElementById("profile-avatar-image");
    const avatarPlaceholder = document.getElementById(
        "profile-avatar-placeholder"
    );
    const bannerImage = document.getElementById("profile-banner-image");
    const bannerPlaceholder = document.getElementById(
        "profile-banner-placeholder"
    );

    const avatarUploadButton = document.getElementById(
        "avatar-upload-button"
    );
    const bannerUploadButton = document.getElementById(
        "banner-upload-button"
    );
    const avatarFileInput = document.getElementById("avatar-file-input");
    const bannerFileInput = document.getElementById("banner-file-input");
    const mediaStatus = document.getElementById("profile-media-status");

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
        !profileCard ||
        !nicknameInput ||
        !nicknameEditButton ||
        !nicknameEditIcon ||
        !nicknameSaveIcon ||
        !telegramTag ||
        !avatarImage ||
        !avatarPlaceholder ||
        !bannerImage ||
        !bannerPlaceholder ||
        !avatarUploadButton ||
        !bannerUploadButton ||
        !avatarFileInput ||
        !bannerFileInput ||
        !mediaStatus
    ) {
        console.error("SplitEvents: required page elements not found");
        return;
    }

    // =====================================
    // NICKNAME STORAGE
    // =====================================

    const NICKNAME_STORAGE_KEY = "splitevents.nickname.v1";

    function readSavedNickname() {
        try {
            return (
                window.localStorage.getItem(NICKNAME_STORAGE_KEY) || ""
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

    function writeSavedNickname(value) {
        try {
            if (value) {
                window.localStorage.setItem(
                    NICKNAME_STORAGE_KEY,
                    value
                );
            } else {
                window.localStorage.removeItem(NICKNAME_STORAGE_KEY);
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

    function getCurrentNickname() {
        return savedNickname || getTelegramDisplayName();
    }

    // =====================================
    // NICKNAME EDITING
    // =====================================

    function setNicknameEditMode(isEditing) {
        nicknameInput.readOnly = !isEditing;
        nicknameEditIcon.hidden = isEditing;
        nicknameSaveIcon.hidden = !isEditing;

        nicknameEditButton.setAttribute(
            "aria-label",
            isEditing ? "Сохранить изменения" : "Изменить профиль"
        );

        nicknameEditButton.title = isEditing
            ? "Сохранить изменения"
            : "Изменить профиль";
    }

    function startNicknameEditing() {
        setNicknameEditMode(true);
        setMediaEditMode(true);
        nicknameInput.focus();
        nicknameInput.select();
    }

    function saveNickname() {
        const newNickname = nicknameInput.value.trim();

        // Пустое поле означает возврат к имени из Telegram.
        savedNickname = newNickname;
        writeSavedNickname(savedNickname);

        nicknameInput.value = getCurrentNickname();
        setNicknameEditMode(false);
        setMediaEditMode(false);
    }

    function cancelNicknameEditing() {
        nicknameInput.value = getCurrentNickname();
        setNicknameEditMode(false);
        setMediaEditMode(false);
    }

    nicknameEditButton.addEventListener("click", function () {
        if (nicknameInput.readOnly) {
            startNicknameEditing();
        } else {
            saveNickname();
        }
    });

    nicknameInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            saveNickname();
        }

        if (event.key === "Escape") {
            event.preventDefault();
            cancelNicknameEditing();
        }
    });

    // =====================================
    // PROFILE IMAGE STORAGE (INDEXEDDB)
    // =====================================

    // Изображения сохраняются в IndexedDB браузера на этом устройстве.
    // Это не облачное хранилище: между устройствами они не синхронизируются.

    const PROFILE_DB_NAME = "splitevents-profile";
    const PROFILE_DB_VERSION = 1;
    const PROFILE_STORE_NAME = "images";

    let profileDatabasePromise = null;
    let currentAvatarObjectUrl = "";
    let currentBannerObjectUrl = "";
    let avatarRevision = 0;
    let bannerRevision = 0;

    function openProfileDatabase() {
        if (!("indexedDB" in window)) {
            return Promise.reject(
                new Error("Хранилище изображений недоступно в этом браузере.")
            );
        }

        if (profileDatabasePromise) {
            return profileDatabasePromise;
        }

        profileDatabasePromise = new Promise(function (resolve, reject) {
            const request = window.indexedDB.open(
                PROFILE_DB_NAME,
                PROFILE_DB_VERSION
            );

            request.onupgradeneeded = function () {
                const database = request.result;

                if (!database.objectStoreNames.contains(PROFILE_STORE_NAME)) {
                    database.createObjectStore(PROFILE_STORE_NAME);
                }
            };

            request.onsuccess = function () {
                resolve(request.result);
            };

            request.onerror = function () {
                reject(
                    request.error || new Error("Не удалось открыть хранилище.")
                );
            };

            request.onblocked = function () {
                reject(new Error("Хранилище изображений заблокировано."));
            };
        });

        return profileDatabasePromise;
    }

    async function saveProfileImage(key, blob) {
        const database = await openProfileDatabase();

        return new Promise(function (resolve, reject) {
            const transaction = database.transaction(
                PROFILE_STORE_NAME,
                "readwrite"
            );

            transaction.objectStore(PROFILE_STORE_NAME).put(blob, key);

            transaction.oncomplete = function () {
                resolve(true);
            };

            transaction.onerror = function () {
                reject(
                    transaction.error || new Error("Не удалось сохранить изображение.")
                );
            };

            transaction.onabort = function () {
                reject(
                    transaction.error || new Error("Сохранение изображения отменено.")
                );
            };
        });
    }

    async function loadProfileImage(key) {
        const database = await openProfileDatabase();

        return new Promise(function (resolve, reject) {
            const transaction = database.transaction(
                PROFILE_STORE_NAME,
                "readonly"
            );
            const request = transaction.objectStore(PROFILE_STORE_NAME).get(key);

            request.onsuccess = function () {
                resolve(request.result || null);
            };

            request.onerror = function () {
                reject(
                    request.error || new Error("Не удалось загрузить изображение.")
                );
            };
        });
    }

    // =====================================
    // IMAGE PROCESSING
    // =====================================

    // Уменьшаем большие изображения перед сохранением,
    // чтобы не занимать слишком много места в памяти браузера.

    function optimizeImageFile(file, maxDimension) {
        return new Promise(function (resolve, reject) {
            const objectUrl = URL.createObjectURL(file);
            const image = new Image();

            image.onload = function () {
                try {
                    const originalWidth = image.naturalWidth;
                    const originalHeight = image.naturalHeight;

                    if (!originalWidth || !originalHeight) {
                        URL.revokeObjectURL(objectUrl);
                        reject(new Error("Не удалось прочитать изображение."));
                        return;
                    }

                    const scale = Math.min(
                        1,
                        maxDimension / Math.max(originalWidth, originalHeight)
                    );

                    const canvas = document.createElement("canvas");
                    canvas.width = Math.max(1, Math.round(originalWidth * scale));
                    canvas.height = Math.max(1, Math.round(originalHeight * scale));

                    const context = canvas.getContext("2d");

                    if (!context) {
                        URL.revokeObjectURL(objectUrl);
                        reject(new Error("Не удалось обработать изображение."));
                        return;
                    }

                    context.drawImage(image, 0, 0, canvas.width, canvas.height);

                    canvas.toBlob(
                        function (blob) {
                            URL.revokeObjectURL(objectUrl);

                            if (!blob) {
                                reject(new Error("Не удалось подготовить изображение."));
                                return;
                            }

                            resolve(blob);
                        },
                        "image/jpeg",
                        0.88
                    );
                } catch (error) {
                    URL.revokeObjectURL(objectUrl);
                    reject(error);
                }
            };

            image.onerror = function () {
                URL.revokeObjectURL(objectUrl);
                reject(new Error("Файл не является поддерживаемым изображением."));
            };

            image.src = objectUrl;
        });
    }

    // =====================================
    // PROFILE IMAGE DISPLAY
    // =====================================

    function setAvatarSource(source, isObjectUrl) {
        if (currentAvatarObjectUrl) {
            URL.revokeObjectURL(currentAvatarObjectUrl);
            currentAvatarObjectUrl = "";
        }

        if (!source) {
            avatarImage.removeAttribute("src");
            avatarImage.hidden = true;
            avatarPlaceholder.hidden = false;
            return;
        }

        avatarImage.onerror = function () {
            avatarImage.hidden = true;
            avatarPlaceholder.hidden = false;
        };

        avatarImage.onload = function () {
            avatarImage.hidden = false;
            avatarPlaceholder.hidden = true;
        };

        avatarImage.src = source;

        if (isObjectUrl) {
            currentAvatarObjectUrl = source;
        }
    }

    function setBannerSource(source, isObjectUrl) {
        if (currentBannerObjectUrl) {
            URL.revokeObjectURL(currentBannerObjectUrl);
            currentBannerObjectUrl = "";
        }

        if (!source) {
            bannerImage.removeAttribute("src");
            bannerImage.hidden = true;
            bannerPlaceholder.hidden = false;
            return;
        }

        bannerImage.onerror = function () {
            bannerImage.hidden = true;
            bannerPlaceholder.hidden = false;
        };

        bannerImage.onload = function () {
            bannerImage.hidden = false;
            bannerPlaceholder.hidden = true;
        };

        bannerImage.src = source;

        if (isObjectUrl) {
            currentBannerObjectUrl = source;
        }
    }

    async function restoreProfileImages() {
        // Не даём первоначальной загрузке перезаписать фото,
        // если пользователь успел выбрать новое изображение.
        const avatarRevisionAtStart = avatarRevision;

        // Сначала восстанавливаем собственную загруженную аватарку.
        try {
            const savedAvatar = await loadProfileImage("avatar");

            if (avatarRevisionAtStart === avatarRevision) {
                if (savedAvatar) {
                    setAvatarSource(URL.createObjectURL(savedAvatar), true);
                } else {
                    setAvatarSource(getTelegramPhotoUrl(), false);
                }
            }
        } catch (error) {
            console.warn(
                "SplitEvents: could not restore avatar",
                error
            );

            if (avatarRevisionAtStart === avatarRevision) {
                setAvatarSource(getTelegramPhotoUrl(), false);
            }
        }

        // Баннер не берётся из Telegram: без загруженного изображения
        // остаётся светло-серая заглушка.
        const bannerRevisionAtStart = bannerRevision;

        try {
            const savedBanner = await loadProfileImage("banner");

            if (bannerRevisionAtStart === bannerRevision) {
                if (savedBanner) {
                    setBannerSource(URL.createObjectURL(savedBanner), true);
                } else {
                    setBannerSource("", false);
                }
            }
        } catch (error) {
            console.warn(
                "SplitEvents: could not restore banner",
                error
            );

            if (bannerRevisionAtStart === bannerRevision) {
                setBannerSource("", false);
            }
        }
    }

    // =====================================
    // PROFILE MEDIA EDITING
    // =====================================

    let isMediaEditing = false;

    function setMediaEditMode(isEditing) {
        isMediaEditing = isEditing;
        profileCard.classList.toggle("is-media-editing", isEditing);
    }

    avatarUploadButton.addEventListener("click", function () {
        if (isMediaEditing) {
            avatarFileInput.click();
        }
    });

    bannerUploadButton.addEventListener("click", function () {
        if (isMediaEditing) {
            bannerFileInput.click();
        }
    });

    function showMediaStatus(message) {
        mediaStatus.textContent = message;
        mediaStatus.hidden = !message;
    }

    async function handleImageSelection(event, imageType) {
        const input = event.currentTarget;
        const file = input.files && input.files[0];

        if (!file) {
            return;
        }

        if (!file.type || !file.type.startsWith("image/")) {
            window.alert("Пожалуйста, выбери файл изображения.");
            input.value = "";
            return;
        }

        const maxFileSize = 20 * 1024 * 1024;

        if (file.size > maxFileSize) {
            window.alert("Размер изображения не должен превышать 20 МБ.");
            input.value = "";
            return;
        }

        showMediaStatus("Обрабатываем изображение…");

        try {
            const maxDimension = imageType === "avatar" ? 900 : 1800;
            const optimizedBlob = await optimizeImageFile(file, maxDimension);
            const storageKey = imageType === "avatar" ? "avatar" : "banner";

            // Сохраняем файл в IndexedDB.
            await saveProfileImage(storageKey, optimizedBlob);

            const imageUrl = URL.createObjectURL(optimizedBlob);

            if (imageType === "avatar") {
                avatarRevision += 1;
                setAvatarSource(imageUrl, true);
                showMediaStatus("Аватарка сохранена на этом устройстве.");
            } else {
                bannerRevision += 1;
                setBannerSource(imageUrl, true);
                showMediaStatus("Баннер сохранён на этом устройстве.");
            }
        } catch (error) {
            console.error(
                "SplitEvents: image upload failed",
                error
            );

            showMediaStatus("");
            window.alert(
                "Не удалось сохранить изображение. Проверь доступность хранилища браузера и попробуй ещё раз."
            );
        } finally {
            input.value = "";
        }
    }

    avatarFileInput.addEventListener("change", function (event) {
        handleImageSelection(event, "avatar");
    });

    bannerFileInput.addEventListener("change", function (event) {
        handleImageSelection(event, "banner");
    });

    // =====================================
    // PROFILE RENDERING
    // =====================================

    function renderProfile() {
        nicknameInput.value = getCurrentNickname();
        telegramTag.textContent = getTelegramTag();

        setNicknameEditMode(false);
        setMediaEditMode(false);
        showMediaStatus("");
    }

    // =====================================
    // ROUTING
    // =====================================

    function getCurrentPage() {
        const route = window.location.hash
            .replace(/^#\/?/, "")
            .split(/[/?]/)[0];

        return route === "profile" ? "profile" : "home";
    }

    function renderPage(moveFocus = false) {
        const currentPage = getCurrentPage();
        const isProfile = currentPage === "profile";

        homePage.hidden = isProfile;
        profilePage.hidden = !isProfile;

        if (isProfile) {
            renderProfile();
        }

        // На странице профиля показываем дом, на главной — человека.
        profileIcon.hidden = isProfile;
        homeIcon.hidden = !isProfile;

        profileHomeButton.setAttribute(
            "aria-label",
            isProfile ? "На главную" : "Открыть профиль"
        );

        profileHomeButton.title = isProfile
            ? "На главную"
            : "Профиль";

        document.title = isProfile
            ? "Профиль — Сплит"
            : "Сплит — SplitEvents";

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

    profileHomeButton.addEventListener("click", function () {
        const currentPage = getCurrentPage();

        if (currentPage === "home") {
            navigateTo("profile");
        } else {
            navigateTo("home");
        }
    });

    // =====================================
    // BROWSER NAVIGATION
    // =====================================

    window.addEventListener("hashchange", function () {
        renderPage(true);
    });

    window.addEventListener("pageshow", function () {
        renderPage(false);
    });

    // =====================================
    // APPLICATION START
    // =====================================

    renderPage();
    restoreProfileImages();

    console.info("SplitEvents: application initialized");

})();
