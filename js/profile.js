/* Profile view, editing, and profile image selection. */
import {
    readNickname,
    writeNickname,
    readImage,
    writeImage,
    optimizeImage
} from "./storage.js?v=20261126-1";

const $ = (id) => document.getElementById(id);

export function createProfile({
    userId,
    getTelegramName,
    getTelegramTag,
    getTelegramPhotoUrl,
    saveDisplayName
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
        bannerInput: $("banner-file-input"),
        status: $("profile-media-status")
    };

    const missing = Object.entries(el)
        .filter(([, value]) => !value)
        .map(([name]) => name);

    if (missing.length) {
        throw new Error(`Profile elements not found: ${missing.join(", ")}`);
    }

    let nickname = readNickname(userId);
    let editing = false;
    let nameInput = null;
    let pendingServerProfile = null;

    const imageKeyPrefix = `user-${userId}-`;
    const images = {
        avatar: createImageState(el.avatar, el.avatarPlaceholder, `${imageKeyPrefix}avatar`),
        banner: createImageState(el.banner, el.bannerPlaceholder, `${imageKeyPrefix}banner`)
    };

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

    function showStatus(message) {
        el.status.textContent = message || "";
        el.status.hidden = !message;
    }

    function createNicknameInput() {
        const input = document.createElement("input");
        input.id = "nickname-input";
        input.className = "profile-nickname profile-nickname--editing";
        input.type = "text";
        input.maxLength = 64;
        input.autocomplete = "nickname";
        input.setAttribute("aria-label", "Отображаемое имя");
        input.value = currentNickname();
        input.addEventListener("keydown", (event) => {
            if (!editing) return;

            if (event.key === "Enter") {
                event.preventDefault();
                finishEditing(true);
            } else if (event.key === "Escape") {
                event.preventDefault();
                finishEditing(false);
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
        el.editButton.setAttribute(
            "aria-label",
            editing ? "Сохранить изменения" : "Изменить профиль"
        );
        el.editButton.title = editing
            ? "Сохранить изменения"
            : "Изменить профиль";

        if (!editing) {
            el.avatarInput.value = "";
            el.bannerInput.value = "";
        }
    }

    function startEditing() {
        showStatus("");
        setEditing(true);
        // Поле появляется по нажатию на карандаш; клавиатура не открывается
        // автоматически, чтобы не перекрыть кнопки загрузки изображений.
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
        if (
            !serverProfile ||
            !Object.prototype.hasOwnProperty.call(serverProfile, "display_name")
        ) {
            return;
        }

        pendingServerProfile = serverProfile;
        if (!editing) applyPendingServerProfile();
    }

    async function finishEditing(save) {
        if (save) {
            nickname = nameInput ? nameInput.value.trim() : currentNickname();
            const savedNickname = nickname;
            const stored = writeNickname(userId, nickname);
            pendingServerProfile = null;
            setEditing(false);

            if (typeof saveDisplayName === "function") {
                el.editButton.disabled = true;

                try {
                    const serverProfile = await saveDisplayName(savedNickname);
                    if (serverProfile) applyServerProfile(serverProfile);

                    showStatus(
                        stored
                            ? "Имя сохранено."
                            : "Имя сохранено в общей базе, но не на этом устройстве."
                    );
                } catch (error) {
                    console.warn("SplitEvents: display name sync failed", error);
                    showStatus(
                        stored
                            ? "Имя сохранено только на этом устройстве. Не удалось синхронизировать его с общей базой."
                            : "Не удалось сохранить имя. Проверь подключение и попробуй ещё раз."
                    );
                } finally {
                    el.editButton.disabled = false;
                }
            } else if (!stored) {
                showStatus(
                    "Имя изменено, но браузер не разрешил сохранить его после закрытия приложения."
                );
            }
        } else {
            setEditing(false);
            if (pendingServerProfile) applyPendingServerProfile();
            showStatus("");
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
            console.warn(`SplitEvents: ${type} image could not be loaded`);
        };

        item.element.src = source;
        if (isObjectUrl) item.objectUrl = source;
    }

    async function loadImages() {
        // Показываем Telegram-фото сразу, если Web App передал ссылку.
        setImage("avatar", getTelegramPhotoUrl(), false);

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

        if (savedAvatar && avatarRevision === images.avatar.revision) {
            setImage("avatar", URL.createObjectURL(savedAvatar), true);
        }

        if (savedBanner && bannerRevision === images.banner.revision) {
            setImage("banner", URL.createObjectURL(savedBanner), true);
        }
    }

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

        const item = images[type];
        const revision = ++item.revision;
        input.disabled = true;
        showStatus("Обрабатываем изображение…");

        try {
            const blob = await optimizeImage(
                file,
                type === "avatar" ? 900 : 1800
            );

            // Если пользователь выбрал другое изображение, старый результат не применяем.
            if (revision !== item.revision) return;

            let persisted = true;
            try {
                await writeImage(item.key, blob);
            } catch (error) {
                persisted = false;
                console.warn("SplitEvents: image storage unavailable", error);
            }

            if (revision !== item.revision) return;

            setImage(type, URL.createObjectURL(blob), true);
            showStatus(
                persisted
                    ? "Изображение сохранено на этом устройстве."
                    : "Изображение установлено, но не сохранится после закрытия приложения."
            );
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

    el.editButton.addEventListener("click", () => {
        if (editing) finishEditing(true);
        else startEditing();
    });

    el.avatarButton.addEventListener("click", () => openPicker(el.avatarInput));
    el.bannerButton.addEventListener("click", () => openPicker(el.bannerInput));
    el.avatarInput.addEventListener("change", () => handleImage(el.avatarInput, "avatar"));
    el.bannerInput.addEventListener("change", () => handleImage(el.bannerInput, "banner"));

    function render() {
        if (pendingServerProfile) applyPendingServerProfile();
        el.nameDisplay.textContent = currentNickname();
        el.tag.textContent = getTelegramTag();
        setEditing(false);
        showStatus("");
    }

    function leave() {
        if (editing) finishEditing(false);
    }

    return {
        render,
        leave,
        loadImages,
        getSavedNickname: () => nickname,
        applyServerProfile
    };
}
