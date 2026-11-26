/* Profile view, editing, and profile image selection. */
import {
    readNickname,
    writeNickname,
    readImage,
    writeImage,
    optimizeImage
} from "./storage.js?v=20261126-1";

const $ = (id) => document.getElementById(id);

const DISPLAY_NAME_ERRORS = Object.freeze({
    invalid_telegram_init_data: "telegram не смог подтвердить данные входа. закрой и снова открой мини-приложение.",
    bot_token_invalid: "серверная авторизация настроена неверно. сообщи администратору.",
    bot_token_wrong_bot: "серверная авторизация подключена к другому боту. сообщи администратору.",
    telegram_api_unavailable: "telegram временно недоступен. попробуй сохранить имя позже.",
    signature_mismatch: "подпись данных telegram не прошла проверку. закрой и снова открой мини-приложение.",
    missing_hash: "telegram не передал подпись данных входа. перезапусти мини-приложение.",
    invalid_hash_format: "telegram передал данные входа в неверном формате. перезапусти мини-приложение.",
    invalid_auth_date: "не удалось проверить время авторизации. перезапусти мини-приложение.",
    auth_data_expired: "срок действия данных входа истёк. закрой и снова открой мини-приложение.",
    invalid_user_data: "telegram передал некорректные данные пользователя. перезапусти мини-приложение.",
    missing_telegram_init_data: "не удалось получить данные входа. открой мини-приложение через бота.",
    database_unavailable: "общая база данных временно недоступна. попробуй позже.",
    telegram_auth_not_configured: "серверная авторизация временно недоступна. попробуй позже.",
    display_name_too_long: "имя должно содержать не более 64 символов.",
    invalid_display_name: "не удалось сохранить это имя. проверь текст и попробуй ещё раз.",
    invalid_profile_payload: "сервер получил некорректные данные профиля. попробуй ещё раз.",
    media_storage_not_configured: "хранилище изображений ещё не подключено. попробуй позже.",
    media_storage_unavailable: "не удалось загрузить изображение на сервер. попробуй ещё раз.",
    invalid_media_type: "не удалось определить тип изображения.",
    invalid_media_payload: "не удалось прочитать выбранное изображение.",
    missing_image_file: "изображение не было передано на сервер.",
    image_too_large: "изображение слишком большое. попробуй выбрать файл поменьше.",
    unsupported_image_format: "поддерживаются изображения jpeg, png и webp.",
    invalid_media_response: "сервер сохранил изображение, но не вернул ссылку. попробуй обновить профиль."
});

function getDisplayNameError(error) {
    const reason = error && typeof error.message === "string"
        ? error.message
        : "";

    return DISPLAY_NAME_ERRORS[reason]
        || "не удалось связаться с сервером. проверь подключение и попробуй ещё раз.";
}

export function createProfile({
    userId,
    getTelegramName,
    getTelegramTag,
    getTelegramPhotoUrl,
    saveDisplayName,
    saveProfileImage,
    notifications
}) {
    const el = {
        card: $("profile-card"),
        nameDisplay: $("nickname-display"),
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
        bannerInput: $("banner-file-input")
    };

    const missing = Object.entries(el)
        .filter(([, value]) => !value)
        .map(([name]) => name);

    if (missing.length) {
        throw new Error("Profile elements not found: " + missing.join(", "));
    }

    const notifyError = (message, detail) => {
        if (notifications && typeof notifications.error === "function") {
            notifications.error(message, detail);
        }
    };
    const notifyWarning = (message, detail) => {
        if (notifications && typeof notifications.warning === "function") {
            notifications.warning(message, detail);
        }
    };

    let nickname = readNickname(userId);
    let editing = false;
    let savingName = false;
    let nameInput = null;
    let pendingServerProfile = null;

    const imageKeyPrefix = "user-" + userId + "-";
    const images = {
        avatar: createImageState(el.avatar, el.avatarPlaceholder, imageKeyPrefix + "avatar"),
        banner: createImageState(el.banner, el.bannerPlaceholder, imageKeyPrefix + "banner")
    };
    const remoteImages = { avatar: "", banner: "" };

    function createImageState(element, placeholder, key) {
        return {
            element,
            placeholder,
            key,
            objectUrl: "",
            revision: 0,
            loadId: 0
        };
    }

    function currentNickname() {
        return nickname || getTelegramName();
    }

    function createNicknameInput() {
        const input = document.createElement("input");
        input.id = "nickname-input";
        input.className = "profile-nickname profile-nickname--editing";
        input.type = "text";
        input.maxLength = 64;
        input.autocomplete = "nickname";
        input.setAttribute("aria-label", "отображаемое имя");
        input.value = currentNickname();

        input.addEventListener("keydown", (event) => {
            if (!editing) return;

            if (event.key === "Enter") {
                event.preventDefault();
                void finishEditing(true);
            } else if (event.key === "Escape") {
                event.preventDefault();
                void finishEditing(false);
            }
        });

        return input;
    }

    function setEditing(enabled) {
        editing = Boolean(enabled);

        if (editing && !nameInput) {
            nameInput = createNicknameInput();
            el.nameDisplay.replaceWith(nameInput);
        } else if (!editing && nameInput) {
            el.nameDisplay.textContent = currentNickname();
            nameInput.replaceWith(el.nameDisplay);
            nameInput = null;
        } else if (!editing) {
            el.nameDisplay.textContent = currentNickname();
        }

        el.editIcon.hidden = editing;
        el.saveIcon.hidden = !editing;
        el.card.classList.toggle("is-media-editing", editing);
        el.avatarButton.tabIndex = editing ? 0 : -1;
        el.bannerButton.tabIndex = editing ? 0 : -1;

        const actionLabel = editing ? "сохранить изменения" : "изменить профиль";
        el.editButton.setAttribute("aria-label", actionLabel);
        el.editButton.title = actionLabel;

        if (!editing) {
            el.avatarInput.value = "";
            el.bannerInput.value = "";
        }
    }

    function startEditing() {
        if (savingName) return;
        setEditing(true);
    }

    function applyPendingServerProfile() {
        if (!pendingServerProfile) return;

        nickname = typeof pendingServerProfile.display_name === "string"
            ? pendingServerProfile.display_name
            : "";
        writeNickname(userId, nickname);
        pendingServerProfile = null;
        el.nameDisplay.textContent = currentNickname();
    }

    function applyServerProfile(serverProfile) {
        if (!serverProfile || typeof serverProfile !== "object") return;

        if (Object.prototype.hasOwnProperty.call(serverProfile, "display_name")) {
            pendingServerProfile = serverProfile;
            if (!editing) applyPendingServerProfile();
        }

        for (const type of ["avatar", "banner"]) {
            const value = serverProfile[type + "_url"];
            if (typeof value === "string" && value.startsWith("https://")) {
                remoteImages[type] = value;
            }
        }
    }

    async function finishEditing(save) {
        if (!save) {
            setEditing(false);
            if (pendingServerProfile) applyPendingServerProfile();
            return;
        }

        if (!editing || savingName) return;

        nickname = nameInput ? nameInput.value.trim() : currentNickname();
        const savedNickname = nickname;
        const storedLocally = writeNickname(userId, savedNickname);

        pendingServerProfile = null;
        setEditing(false);

        if (typeof saveDisplayName !== "function") {
            notifyError(
                "не удалось синхронизировать имя",
                storedLocally
                    ? "изменение осталось только на этом устройстве. открой мини-приложение через telegram, чтобы синхронизировать его."
                    : "не удалось сохранить изменение. открой мини-приложение через telegram и попробуй ещё раз."
            );
            return;
        }

        savingName = true;
        el.editButton.disabled = true;

        try {
            const serverProfile = await saveDisplayName(savedNickname);
            if (serverProfile) applyServerProfile(serverProfile);

            if (!storedLocally) {
                notifyWarning(
                    "не удалось сохранить имя на этом устройстве",
                    "браузер не смог сохранить его на этом устройстве. при следующем открытии имя загрузится с сервера."
                );
            }
        } catch (error) {
            console.warn("SplitEvents: display name sync failed", error);
            notifyError(
                "не удалось синхронизировать имя",
                (storedLocally
                    ? "имя осталось только на этом устройстве. "
                    : "имя не удалось сохранить. ")
                    + getDisplayNameError(error)
            );
        } finally {
            savingName = false;
            el.editButton.disabled = false;
        }
    }

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
            console.warn("SplitEvents: " + type + " image could not be loaded");
        };

        item.element.src = source;
        if (isObjectUrl) item.objectUrl = source;
    }

    async function loadImages(serverProfile = null) {
        if (serverProfile) applyServerProfile(serverProfile);

        setImage("avatar", remoteImages.avatar || getTelegramPhotoUrl(), false);

        const avatarRevision = images.avatar.revision;
        const bannerRevision = images.banner.revision;

        const [savedAvatar, savedBanner] = await Promise.all([
            readImage(images.avatar.key).catch((error) => {
                console.warn("SplitEvents: avatar storage unavailable", error);
                return null;
            }),
            readImage(images.banner.key).catch((error) => {
                console.warn("SplitEvents: banner storage unavailable", error);
                return null;
            })
        ]);

        if (!remoteImages.avatar && savedAvatar && avatarRevision === images.avatar.revision) {
            setImage("avatar", URL.createObjectURL(savedAvatar), true);
        }

        if (remoteImages.banner) {
            setImage("banner", remoteImages.banner, false);
        } else if (savedBanner && bannerRevision === images.banner.revision) {
            setImage("banner", URL.createObjectURL(savedBanner), true);
        }
    }

    async function handleImage(input, type) {
        const file = input.files && input.files[0];
        if (!file) return;

        if (file.type && !file.type.startsWith("image/")) {
            notifyError("этот файл не является изображением", "выбери файл изображения в поддерживаемом формате.");
            input.value = "";
            return;
        }

        if (file.size > 20 * 1024 * 1024) {
            notifyError("файл слишком большой", "максимальный размер изображения — 20 мб.");
            input.value = "";
            return;
        }

        const item = images[type];
        const revision = ++item.revision;
        input.disabled = true;

        try {
            const blob = await optimizeImage(file, type === "avatar" ? 900 : 1800);

            if (revision !== item.revision) return;

            if (typeof saveProfileImage !== "function") {
                throw new Error("missing_telegram_init_data");
            }

            const serverProfile = await saveProfileImage(type, blob);
            const remoteUrl = serverProfile && serverProfile[type + "_url"];
            if (typeof remoteUrl !== "string" || !remoteUrl.startsWith("https://")) {
                throw new Error("invalid_media_response");
            }

            if (revision !== item.revision) return;

            remoteImages[type] = remoteUrl;
            setImage(type, remoteUrl, false);

            try {
                await writeImage(item.key, blob);
            } catch (error) {
                console.warn("SplitEvents: local image cache unavailable", error);
                notifyWarning(
                    "изображение сохранено на сервере",
                    "но не удалось сохранить его в локальный кэш устройства."
                );
            }
        } catch (error) {
            console.error("SplitEvents: " + type + " upload failed", error);
            const reason = error && typeof error.message === "string"
                ? error.message
                : "";
            const messages = {
                media_storage_not_configured: "хранилище изображений ещё не подключено.",
                media_storage_unavailable: "не удалось загрузить изображение на сервер. проверь подключение и попробуй ещё раз.",
                image_too_large: "изображение слишком большое. выбери файл поменьше.",
                unsupported_image_format: "поддерживаются изображения jpeg, png и webp.",
                missing_telegram_init_data: "открой мини-приложение через telegram и попробуй ещё раз."
            };
            notifyError(
                "не удалось сохранить изображение",
                messages[reason] || "попробуй выбрать другое изображение в формате jpeg, png или webp."
            );
        } finally {
            input.disabled = false;
            input.value = "";
        }
    }

    function openPicker(input) {
        if (editing && !input.disabled) input.click();
    }

    el.editButton.addEventListener("click", () => {
        if (editing) void finishEditing(true);
        else startEditing();
    });

    el.avatarButton.addEventListener("click", () => openPicker(el.avatarInput));
    el.bannerButton.addEventListener("click", () => openPicker(el.bannerInput));
    el.avatarInput.addEventListener("change", () => void handleImage(el.avatarInput, "avatar"));
    el.bannerInput.addEventListener("change", () => void handleImage(el.bannerInput, "banner"));

    function render() {
        if (pendingServerProfile) applyPendingServerProfile();
        el.nameDisplay.textContent = currentNickname();
        el.tag.textContent = getTelegramTag();
        setEditing(false);
    }

    function leave() {
        if (editing) void finishEditing(false);
    }

    return {
        render,
        leave,
        loadImages,
        getSavedNickname: () => nickname,
        applyServerProfile
    };
}
