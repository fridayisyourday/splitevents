<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { fetchPublicProfile } from "../../js/api.js?v=20261127-1";
import { getTelegramInitData } from "../../js/telegram.js?v=20261126-6";
import { getSafeProfileImageUrl } from "../../js/pages/profile-presentation.js?v=20261127-1";
import { getCurrentPage, getPublicUserId } from "../../js/navigation.js?v=20261127-1";

const initData = getTelegramInitData();
const status = ref("idle");
const profile = ref(null);
const avatarLoaded = ref(false);
const bannerLoaded = ref(false);
const avatarFailed = ref(false);
const bannerFailed = ref(false);
let requestRevision = 0;

const avatarUrl = computed(() => getSafeProfileImageUrl(profile.value?.avatar_url));
const bannerUrl = computed(() => getSafeProfileImageUrl(profile.value?.banner_url));

function getDisplayName() {
    const value = profile.value?.display_name;
    return typeof value === "string" && value.trim() ? value.trim() : "пользователь";
}

function getUsername() {
    const value = profile.value?.username;
    const username = typeof value === "string" ? value.trim().replace(/^@/, "") : "";
    return username ? "@" + username : "тег не указан";
}

async function loadProfile(publicId) {
    const currentRevision = ++requestRevision;
    profile.value = null;
    avatarLoaded.value = false;
    bannerLoaded.value = false;
    avatarFailed.value = false;
    bannerFailed.value = false;

    if (!initData || !/^[0-9a-f]{32}$/i.test(publicId || "")) {
        status.value = "error";
        return;
    }

    status.value = "loading";

    try {
        const user = await fetchPublicProfile(initData, publicId);
        if (currentRevision !== requestRevision) return;
        profile.value = user;
        status.value = "ready";
    } catch (error) {
        if (currentRevision !== requestRevision) return;
        console.error("SplitEvents: public profile failed", error);
        status.value = "error";
    }
}

function handleRouteChange() {
    if (getCurrentPage() === "users") {
        void loadProfile(getPublicUserId());
    } else {
        requestRevision += 1;
    }
}

function handleAvatarLoad() {
    avatarLoaded.value = true;
}

function handleBannerLoad() {
    bannerLoaded.value = true;
}

function handleAvatarError() {
    avatarFailed.value = true;
    avatarLoaded.value = false;
}

function handleBannerError() {
    bannerFailed.value = true;
    bannerLoaded.value = false;
}

onMounted(() => {
    window.addEventListener("hashchange", handleRouteChange);
    if (getCurrentPage() === "users") void loadProfile(getPublicUserId());
});

onBeforeUnmount(() => {
    requestRevision += 1;
    window.removeEventListener("hashchange", handleRouteChange);
});
</script>

<template>
    <section id="user-profile-page" class="page-view" aria-label="Профиль пользователя">
        <div class="section-page public-profile-page">
            <div class="section-page-content public-profile-page-content page-container">
                <div class="section-page-body public-profile-page-body">
        <div
            v-if="status === 'loading' || status === 'idle'"
            class="public-profile-loading"
            role="status"
            aria-live="polite"
            aria-label="загрузка профиля"
        >
            <svg class="lucide-icon friends-loading-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="#icon-loader-circle"></use></svg>
        </div>

        <div v-else-if="status === 'error'" class="public-profile-status">
            <div class="empty-state" role="status" aria-live="polite">
                <p class="empty-state-message">не удалось открыть профиль</p>
                <p class="empty-state-note">возможно, пользователь больше не зарегистрирован</p>
            </div>
        </div>

        <article v-else-if="profile" class="profile-card profile-card--readonly">
            <div class="profile-cover">
                <div
                    class="profile-banner-placeholder"
                    :hidden="Boolean(bannerUrl) && bannerLoaded && !bannerFailed"
                    aria-hidden="true"
                ></div>
                <img
                    v-if="bannerUrl && !bannerFailed"
                    class="profile-banner-image"
                    :src="bannerUrl"
                    alt=""
                    :hidden="!bannerLoaded"
                    @load="handleBannerLoad"
                    @error="handleBannerError"
                >

                <div class="profile-avatar">
                    <img
                        v-if="avatarUrl && !avatarFailed"
                        class="profile-avatar-image"
                        :src="avatarUrl"
                        alt="фотография профиля"
                        referrerpolicy="no-referrer"
                        :hidden="!avatarLoaded"
                        @load="handleAvatarLoad"
                        @error="handleAvatarError"
                    >
                    <div
                        class="profile-avatar-placeholder"
                        :hidden="Boolean(avatarUrl) && avatarLoaded && !avatarFailed"
                        aria-hidden="true"
                    >
                        <svg class="lucide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="#icon-user-round"></use></svg>
                    </div>
                </div>
            </div>

            <div class="profile-details">
                <div class="profile-name-row">
                    <span class="profile-nickname">{{ getDisplayName() }}</span>
                </div>
                <p class="profile-telegram-tag">{{ getUsername() }}</p>
            </div>
        </article>
                </div>
            </div>
        </div>
    </section>
</template>
