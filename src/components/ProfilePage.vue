<script setup>
import { nextTick, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import {
    readNickname,
    writeNickname,
    readImage,
    writeImage,
    optimizeImage
} from "../../js/storage.js?v=20261126-1";
import {
    syncTelegramUser,
    updateTelegramDisplayName,
    uploadProfileImage
} from "../../js/api.js?v=20261127-1";
import { notifyError, notifySuccess } from "../../js/notifications.js?v=20261127-1";
import {
    getTelegramUserId,
    getTelegramName,
    getTelegramTag,
    getTelegramPhotoUrl,
    getTelegramInitData
} from "../../js/telegram.js?v=20261126-6";
import { getSafeProfileImageUrl } from "../../js/pages/profile-presentation.js?v=20261127-1";
import { getCurrentPage } from "../../js/navigation.js?v=20261127-1";

const userId = getTelegramUserId();
const telegramName = getTelegramName();
const telegramTag = getTelegramTag();
const telegramPhotoUrl = getTelegramPhotoUrl();
const telegramInitData = getTelegramInitData();

const nickname = ref(readNickname(userId));
const editing = ref(false);
const draftName = ref(nickname.value || telegramName);
const savingName = ref(false);
const nameInput = ref(null);
const avatarSource = ref("");
const bannerSource = ref("");
const uploadStates = reactive({ avatar: "idle", banner: "idle" });
const avatarFileInput = ref(null);
const bannerFileInput = ref(null);
const fileInputs = { avatar: avatarFileInput, banner: bannerFileInput };

const imageKeys = {
    avatar: "user-" + userId + "-avatar",
    banner: "user-" + userId + "-banner"
};
const imageRevisions = { avatar: 0, banner: 0 };
const remoteImages = { avatar: "", banner: "" };
const objectUrls = { avatar: "", banner: "" };

let profileSyncPromise = Promise.resolve(null);
let pendingServerProfile = null;
let disposed = false;

function displayName() {
    return nickname.value || telegramName;
}

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

function setImageSource(type, source, isObjectUrl = false) {
    if (objectUrls[type]) {
        URL.revokeObjectURL(objectUrls[type]);
        objectUrls[type] = "";
    }
    if (isObjectUrl && source) objectUrls[type] = source;
    if (type === "avatar") avatarSource.value = source || "";
    else bannerSource.value = source || "";
}

function applyServerProfile(serverProfile) {
    if (!serverProfile || typeof serverProfile !== "object") return;

    if (Object.prototype.hasOwnProperty.call(serverProfile, "display_name")) {
        if (editing.value || savingName.value) {
            pendingServerProfile = serverProfile;
        } else {
            nickname.value = typeof serverProfile.display_name === "string"
                ? serverProfile.display_name
                : "";
            writeNickname(userId, nickname.value);
        }
    }

    for (const type of ["avatar", "banner"]) {
        if (imageRevisions[type] > 0) continue;
        const safeUrl = getSafeProfileImageUrl(serverProfile[type + "_url"]);
        if (safeUrl) remoteImages[type] = safeUrl;
    }
}

function applyPendingServerProfile() {
    if (!pendingServerProfile) return;
    const pending = pendingServerProfile;
    pendingServerProfile = null;
    applyServerProfile(pending);
}

function enterEditing() {
    if (savingName.value) return;
    draftName.value = displayName();
    editing.value = true;
    nextTick(() => {
        nameInput.value?.focus();
        nameInput.value?.select();
    });
}

function cancelEditing() {
    if (!editing.value) return;
    editing.value = false;
    draftName.value = displayName();
    for (const type of ["avatar", "banner"]) {
        if (fileInputs[type].value) fileInputs[type].value.value = "";
    }
    applyPendingServerProfile();
}

async function saveName() {
    if (!editing.value || savingName.value) return;

    const savedNickname = String(draftName.value || "").trim();
    const storedLocally = writeNickname(userId, savedNickname);
    nickname.value = savedNickname;
    editing.value = false;
    pendingServerProfile = null;

    if (!telegramInitData) {
        notifyError(
            "не удалось синхронизировать имя",
            storedLocally
                ? "изменение осталось только на этом устройстве. открой мини-приложение через telegram, чтобы синхронизировать его."
                : "не удалось сохранить изменение. открой мини-приложение через telegram и попробуй ещё раз."
        );
        return;
    }

    savingName.value = true;
    try {
        await profileSyncPromise;
        pendingServerProfile = null;
        const serverProfile = await updateTelegramDisplayName(
            telegramInitData,
            savedNickname
        );
        if (serverProfile) applyServerProfile(serverProfile);

        if (!storedLocally) {
            notifyError(
                "не удалось сохранить имя на этом устройстве",
                "браузер не смог сохранить его на этом устройстве. при следующем открытии имя загрузится с сервера."
            );
        }
    } catch (error) {
        pendingServerProfile = null;
        console.warn("SplitEvents: display name sync failed", error);
        notifyError(
            "не удалось синхронизировать имя",
            (storedLocally
                ? "имя осталось только на этом устройстве. "
                : "имя не удалось сохранить. ")
                + getDisplayNameError(error)
        );
    } finally {
        savingName.value = false;
        applyPendingServerProfile();
    }
}

function setUploadState(type, state) {
    uploadStates[type] = state;
}

function chooseImage(type) {
    if (!editing.value || uploadStates[type] !== "idle") return;
    fileInputs[type].value?.click();
}

function telegramPhotoFallback() {
    try {
        const url = new URL(telegramPhotoUrl);
        return url.protocol === "https:" ? url.href : "";
    } catch {
        return "";
    }
}

async function loadImages(serverProfile = null) {
    if (serverProfile) applyServerProfile(serverProfile);
    const avatarRevision = imageRevisions.avatar;
    const bannerRevision = imageRevisions.banner;

    const [savedAvatar, savedBanner] = await Promise.all([
        readImage(imageKeys.avatar).catch((error) => {
            console.warn("SplitEvents: avatar storage unavailable", error);
            return null;
        }),
        readImage(imageKeys.banner).catch((error) => {
            console.warn("SplitEvents: banner storage unavailable", error);
            return null;
        })
    ]);

    if (disposed) return;

    if (avatarRevision === imageRevisions.avatar) {
        if (remoteImages.avatar) {
            setImageSource("avatar", remoteImages.avatar);
        } else if (savedAvatar) {
            setImageSource("avatar", URL.createObjectURL(savedAvatar), true);
        } else {
            setImageSource("avatar", telegramPhotoFallback());
        }
    }

    if (bannerRevision === imageRevisions.banner) {
        if (remoteImages.banner) {
            setImageSource("banner", remoteImages.banner);
        } else if (savedBanner) {
            setImageSource("banner", URL.createObjectURL(savedBanner), true);
        } else {
            setImageSource("banner", "");
        }
    }
}

function imageAccessibleLabel(type) {
    const label = type === "avatar" ? "аватарку" : "баннер";
    if (uploadStates[type] === "loading") return "загрузка: " + label;
    return "загрузить " + label;
}

async function handleImageSelection(type, event) {
    const input = event.target;
    const file = input.files && input.files[0];
    if (!file) return;

    const revision = ++imageRevisions[type];
    setUploadState(type, "loading");

    try {
        if (file.type && !file.type.startsWith("image/")) {
            throw new Error("unsupported_image_file");
        }
        if (file.size > 20 * 1024 * 1024) {
            throw new Error("image_too_large_input");
        }

        const blob = await optimizeImage(file, type === "avatar" ? 900 : 1800);
        if (revision !== imageRevisions[type] || disposed) return;

        if (!telegramInitData) throw new Error("missing_telegram_init_data");
        if (blob.size > 5 * 1024 * 1024) throw new Error("image_too_large");

        const serverProfile = await uploadProfileImage(telegramInitData, type, blob);
        const remoteUrl = getSafeProfileImageUrl(serverProfile && serverProfile[type + "_url"]);
        if (!remoteUrl) throw new Error("invalid_media_response");
        if (revision !== imageRevisions[type] || disposed) return;

        remoteImages[type] = remoteUrl;
        setImageSource(type, remoteUrl);

        let cachedLocally = true;
        try {
            await writeImage(imageKeys[type], blob);
        } catch (error) {
            cachedLocally = false;
            console.warn("SplitEvents: local image cache unavailable", error);
        }

        setUploadState(type, "idle");
        notifySuccess(
            type === "avatar" ? "аватар обновлён" : "баннер обновлён",
            cachedLocally
                ? ""
                : "изображение сохранено на сервере, но не попало в локальный кэш устройства."
        );
    } catch (error) {
        console.error("SplitEvents: " + type + " upload failed", error);
        const reason = error && typeof error.message === "string"
            ? error.message
            : "";
        const messages = {
            unsupported_image_file: "выбери файл изображения в поддерживаемом формате.",
            image_too_large_input: "файл слишком большой. максимальный размер исходного изображения — 20 мб.",
            media_storage_not_configured: "хранилище изображений ещё не подключено.",
            media_storage_unavailable: "не удалось загрузить изображение на сервер. проверь подключение и попробуй ещё раз.",
            image_too_large: "изображение слишком большое. выбери файл поменьше.",
            unsupported_image_format: "поддерживаются изображения jpeg, png и webp.",
            missing_telegram_init_data: "открой мини-приложение через telegram и попробуй ещё раз."
        };

        if (revision === imageRevisions[type] && !disposed) {
            setUploadState(type, "idle");
        }
        notifyError(
            "не удалось сохранить изображение",
            messages[reason] || "попробуй выбрать другое изображение в формате jpeg, png или webp."
        );
    } finally {
        input.disabled = false;
        input.value = "";
    }
}

function handleImageError(type) {
    console.warn("SplitEvents: " + type + " image could not be loaded");
    setImageSource(type, "");
    notifyError(
        type === "avatar" ? "не удалось отобразить аватар" : "не удалось отобразить баннер",
        "попробуй обновить профиль или выбрать другое изображение."
    );
}

function handleRouteChange() {
    if (getCurrentPage() !== "profile" && editing.value) cancelEditing();
}

onMounted(() => {
    avatarSource.value = telegramPhotoFallback();

    if (telegramInitData) {
        profileSyncPromise = syncTelegramUser(telegramInitData, nickname.value)
            .then((serverProfile) => {
                applyServerProfile(serverProfile);
                return serverProfile;
            })
            .catch((error) => {
                console.warn("SplitEvents: Telegram account sync failed", error);
                return null;
            });
    }

    void profileSyncPromise.then((serverProfile) => loadImages(serverProfile)).catch((error) => {
        console.error("SplitEvents: profile images failed to load", error);
        notifyError(
            "не удалось загрузить изображения профиля",
            "попробуй перезапустить приложение."
        );
    });

    window.addEventListener("hashchange", handleRouteChange);
});

onBeforeUnmount(() => {
    disposed = true;
    window.removeEventListener("hashchange", handleRouteChange);
    for (const type of ["avatar", "banner"]) {
        if (objectUrls[type]) URL.revokeObjectURL(objectUrls[type]);
    }
});
</script>

<template>
    <section id="profile-page" class="page-view" aria-label="Профиль">
        <article
            id="profile-card"
            class="profile-card"
            :class="{ 'is-media-editing': editing }"
        >
            <div class="profile-cover" id="profile-cover">
                <div
                    class="profile-banner-placeholder"
                    id="profile-banner-placeholder"
                    aria-hidden="true"
                ></div>

                <img
                    v-if="bannerSource"
                    id="profile-banner-image"
                    class="profile-banner-image"
                    :src="bannerSource"
                    alt=""
                    @error="handleImageError('banner')"
                >

                <div class="profile-media-shade" aria-hidden="true"></div>

                <button
                    id="banner-upload-button"
                    class="profile-media-upload-button banner-upload-button ui-button ui-button--icon ui-button--round ui-button--media"
                    type="button"
                    :aria-label="imageAccessibleLabel('banner')"
                    :title="uploadStates.banner === 'loading' ? 'загрузка' : imageAccessibleLabel('banner')"
                    :tabindex="editing ? 0 : -1"
                    :disabled="uploadStates.banner !== 'idle'"
                    :aria-busy="uploadStates.banner === 'loading' ? 'true' : undefined"
                    :data-upload-state="uploadStates.banner === 'idle' ? undefined : uploadStates.banner"
                    @click="chooseImage('banner')"
                >
                    <svg class="lucide-icon profile-media-icon profile-media-icon--plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="#icon-plus"></use></svg>
                    <svg class="lucide-icon profile-media-icon profile-media-icon--spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="#icon-loader-circle"></use></svg>
                </button>

                <div class="profile-avatar" id="profile-avatar">
                    <img
                        v-if="avatarSource"
                        id="profile-avatar-image"
                        class="profile-avatar-image"
                        :src="avatarSource"
                        alt="фотография профиля"
                        referrerpolicy="no-referrer"
                        @error="handleImageError('avatar')"
                    >

                    <div
                        v-else
                        id="profile-avatar-placeholder"
                        class="profile-avatar-placeholder"
                        aria-hidden="true"
                    >
                        <svg class="lucide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="#icon-user-round"></use></svg>
                    </div>

                    <div class="profile-media-shade" aria-hidden="true"></div>

                    <button
                        id="avatar-upload-button"
                        class="profile-media-upload-button avatar-upload-button ui-button ui-button--icon ui-button--round ui-button--media"
                        type="button"
                        :aria-label="imageAccessibleLabel('avatar')"
                        :title="uploadStates.avatar === 'loading' ? 'загрузка' : imageAccessibleLabel('avatar')"
                        :tabindex="editing ? 0 : -1"
                        :disabled="uploadStates.avatar !== 'idle'"
                        :aria-busy="uploadStates.avatar === 'loading' ? 'true' : undefined"
                        :data-upload-state="uploadStates.avatar === 'idle' ? undefined : uploadStates.avatar"
                        @click="chooseImage('avatar')"
                    >
                        <svg class="lucide-icon profile-media-icon profile-media-icon--plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="#icon-plus"></use></svg>
                        <svg class="lucide-icon profile-media-icon profile-media-icon--spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="#icon-loader-circle"></use></svg>
                    </button>
                </div>
            </div>

            <div class="profile-details">
                <div class="profile-name-row">
                    <input
                        v-if="editing"
                        id="nickname-input"
                        ref="nameInput"
                        v-model="draftName"
                        class="profile-nickname profile-nickname--editing"
                        type="text"
                        maxlength="64"
                        autocomplete="nickname"
                        aria-label="отображаемое имя"
                        :disabled="savingName"
                        @keydown.enter.prevent="saveName"
                        @keydown.esc.prevent="cancelEditing"
                    >

                    <span
                        v-else
                        id="nickname-display"
                        class="profile-nickname"
                    >{{ displayName() }}</span>

                    <button
                        id="nickname-edit-button"
                        class="profile-edit-button ui-button ui-button--icon ui-button--secondary"
                        type="button"
                        :aria-label="editing ? 'сохранить изменения' : 'изменить профиль'"
                        :title="editing ? 'сохранить изменения' : 'изменить профиль'"
                        :disabled="savingName"
                        @click="editing ? saveName() : enterEditing()"
                    >
                        <svg
                            v-if="editing"
                            class="lucide-icon nickname-action-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            aria-hidden="true"
                            focusable="false"
                        ><use href="#icon-check"></use></svg>
                        <svg
                            v-else
                            class="lucide-icon nickname-action-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            aria-hidden="true"
                            focusable="false"
                        ><use href="#icon-pencil"></use></svg>
                    </button>
                </div>

                <p id="telegram-tag" class="profile-telegram-tag">{{ telegramTag }}</p>
            </div>
        </article>

        <input
            id="avatar-file-input"
            ref="avatarFileInput"
            class="visually-hidden-input"
            type="file"
            accept="image/*"
            aria-label="выбрать фотографию профиля"
            tabindex="-1"
            @change="handleImageSelection('avatar', $event)"
        >

        <input
            id="banner-file-input"
            ref="bannerFileInput"
            class="visually-hidden-input"
            type="file"
            accept="image/*"
            aria-label="выбрать изображение баннера"
            tabindex="-1"
            @change="handleImageSelection('banner', $event)"
        >
    </section>
</template>
