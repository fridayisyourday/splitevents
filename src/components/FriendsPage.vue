<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { fetchFriends } from "../../js/api.js?v=20261126-5";
import { getTelegramInitData } from "../../js/telegram.js?v=20261126-6";
import { getSafeProfileImageUrl } from "../../js/pages/profile-presentation.js?v=20261126-3";

const initData = getTelegramInitData();
const status = ref("idle");
const users = ref([]);
const failedAvatarIds = reactive(new Set());
let requestRevision = 0;

const collator = new Intl.Collator("ru", {
    sensitivity: "base",
    numeric: true
});

const sortedUsers = computed(() => users.value
    .filter((user) => user && /^[0-9a-f]{32}$/i.test(user.public_id || ""))
    .sort((left, right) => (
        collator.compare(left.display_name || "", right.display_name || "") ||
        collator.compare(left.username || "", right.username || "")
    ))
);

function getCurrentPage() {
    const match = (window.location.hash || "#/").match(/^#\/?([^/?]*)/);
    return match && match[1] ? match[1] : "home";
}

function getAvatarUrl(user) {
    if (failedAvatarIds.has(user.public_id)) return "";
    return getSafeProfileImageUrl(user.avatar_url);
}

function getDisplayName(user) {
    return typeof user.display_name === "string" && user.display_name.trim()
        ? user.display_name.trim()
        : "пользователь";
}

function getUsername(user) {
    const username = typeof user.username === "string"
        ? user.username.trim().replace(/^@/, "")
        : "";
    return username ? "@" + username : "тег не указан";
}

function markAvatarFailed(publicId) {
    failedAvatarIds.add(publicId);
}

function openProfile(publicId) {
    if (!/^[0-9a-f]{32}$/i.test(publicId || "")) return;
    window.location.hash = "#/users/" + encodeURIComponent(publicId);
}

async function loadFriends() {
    if (getCurrentPage() !== "friends") return;

    const currentRevision = ++requestRevision;
    failedAvatarIds.clear();

    if (!initData) {
        users.value = [];
        status.value = "auth";
        return;
    }

    status.value = "loading";

    try {
        const result = await fetchFriends(initData);
        if (currentRevision !== requestRevision) return;
        users.value = Array.isArray(result) ? result : [];
        status.value = "ready";
    } catch (error) {
        if (currentRevision !== requestRevision) return;
        console.error("SplitEvents: friends directory failed", error);
        users.value = [];
        status.value = "error";
    }
}

function handleRouteChange() {
    if (getCurrentPage() === "friends") {
        void loadFriends();
    } else {
        requestRevision += 1;
    }
}

onMounted(() => {
    window.addEventListener("hashchange", handleRouteChange);
    if (getCurrentPage() === "friends") void loadFriends();
});

onBeforeUnmount(() => {
    requestRevision += 1;
    window.removeEventListener("hashchange", handleRouteChange);
});
</script>

<template>
    <section id="friends-page" class="page-view" aria-label="Друзья" hidden>
        <div class="section-page friends-page">
            <div class="section-page-content friends-page-content">
                <header class="section-page-header">
                    <h1 class="section-page-title">Друзья</h1>
                </header>

                <div
                    class="section-page-body friends-page-body"
                    :class="{ 'section-page-body--center': status !== 'ready' || !sortedUsers.length }"
                >
                    <div
                        v-if="status === 'loading'"
                        class="friends-loading"
                        role="status"
                        aria-live="polite"
                        aria-label="загрузка списка друзей"
                    >
                        <svg class="lucide-icon friends-loading-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="#icon-loader-circle"></use></svg>
                    </div>

                    <div
                        v-else-if="status === 'auth'"
                        class="empty-state"
                        role="status"
                        aria-live="polite"
                    >
                        <p class="empty-state-message">открой мини-приложение через telegram</p>
                        <p class="empty-state-note">для просмотра списка друзей требуется авторизация telegram</p>
                    </div>

                    <template v-else-if="status === 'error'">
                        <div class="empty-state" role="status" aria-live="polite">
                            <p class="empty-state-message">не удалось загрузить список друзей</p>
                            <p class="empty-state-note">проверь подключение и попробуй ещё раз</p>
                        </div>
                        <button
                            class="ui-button ui-button--secondary friends-retry"
                            type="button"
                            @click="loadFriends"
                        >повторить</button>
                    </template>

                    <div
                        v-else-if="!sortedUsers.length"
                        class="empty-state"
                        role="status"
                        aria-live="polite"
                    >
                        <p class="empty-state-message">пока никого нет</p>
                        <p class="empty-state-note">оставайтесь с нами!</p>
                    </div>

                    <div
                        v-else
                        class="friends-list"
                        aria-label="зарегистрированные пользователи"
                    >
                        <button
                            v-for="user in sortedUsers"
                            :key="user.public_id"
                            class="friend-card"
                            type="button"
                            :aria-label="'открыть профиль: ' + getDisplayName(user)"
                            @click="openProfile(user.public_id)"
                        >
                            <span class="friend-card-avatar">
                                <span
                                    class="friend-card-avatar-placeholder"
                                    :hidden="Boolean(getAvatarUrl(user))"
                                    aria-hidden="true"
                                >
                                    <svg class="lucide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="#icon-user-round"></use></svg>
                                </span>
                                <img
                                    v-if="getAvatarUrl(user)"
                                    class="friend-card-avatar-image"
                                    :src="getAvatarUrl(user)"
                                    alt=""
                                    loading="lazy"
                                    decoding="async"
                                    @error="markAvatarFailed(user.public_id)"
                                >
                            </span>
                            <span class="friend-card-copy">
                                <span class="friend-card-name">{{ getDisplayName(user) }}</span>
                                <span class="friend-card-tag">{{ getUsername(user) }}</span>
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
