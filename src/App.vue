<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import AppHeader from "./components/AppHeader.vue";
import EventsPage from "./components/EventsPage.vue";
import FriendsPage from "./components/FriendsPage.vue";
import HomePage from "./components/HomePage.vue";
import NominationsPage from "./components/NominationsPage.vue";
import NotificationRegion from "./components/NotificationRegion.vue";
import ProfilePage from "./components/ProfilePage.vue";
import ServersPage from "./components/ServersPage.vue";
import UserProfilePage from "./components/UserProfilePage.vue";
import {
    initTelegram,
    setTelegramBackButtonVisible
} from "../js/telegram.js?v=20261126-6";
import {
    VALID_PAGES,
    getCurrentPage,
    getPageHash
} from "../js/navigation.js?v=20261127-1";

const pageTitles = {
    home: "Сплит — SplitEvents",
    profile: "Профиль — Сплит",
    friends: "Друзья — Сплит",
    users: "Профиль — Сплит",
    events: "Текущие события — Сплит",
    servers: "Сервера — Сплит",
    nominations: "НОМИНАЦИИ 2026 — Сплит"
};

const validPages = new Set(VALID_PAGES);
const currentPage = ref(getCurrentPage());
let menuOpen = false;

function updateTelegramBackButton() {
    setTelegramBackButtonVisible(Boolean(menuOpen || currentPage.value !== "home"));
}

function syncPage(moveFocus = false) {
    currentPage.value = getCurrentPage();

    window.dispatchEvent(new CustomEvent("splitevents:menu-page", {
        detail: { page: currentPage.value }
    }));

    updateTelegramBackButton();
    document.title = pageTitles[currentPage.value];

    if (moveFocus) {
        document.getElementById("main-content")?.focus({ preventScroll: true });
    }
}

function navigateTo(page) {
    const safePage = validPages.has(page) ? page : "home";
    const target = getPageHash(safePage);

    if (window.location.hash === target) {
        syncPage(true);
    } else {
        window.location.hash = target;
    }
}

function handleMenuState(event) {
    menuOpen = Boolean(event.detail?.open);
    updateTelegramBackButton();
}

function handleHashChange() {
    if (menuOpen) {
        window.dispatchEvent(new CustomEvent("splitevents:menu-command", {
            detail: { action: "close", restoreFocus: false }
        }));
    }
    syncPage(true);
}

function handleBack() {
    if (menuOpen) {
        window.dispatchEvent(new CustomEvent("splitevents:menu-command", {
            detail: { action: "close", restoreFocus: true }
        }));
        return;
    }

    if (currentPage.value === "users") {
        navigateTo("friends");
    } else if (currentPage.value === "nominations") {
        navigateTo("events");
    } else if (currentPage.value !== "home") {
        navigateTo("home");
    }
}

function handleRerender() {
    syncPage(true);
}

function handlePageShow() {
    syncPage(false);
}

onMounted(() => {
    window.addEventListener("splitevents:menu-state", handleMenuState);
    window.addEventListener("splitevents:rerender", handleRerender);
    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("pageshow", handlePageShow);

    initTelegram({ onBack: handleBack });

    window.dispatchEvent(new CustomEvent("splitevents:menu-command", {
        detail: { action: "sync-state" }
    }));

    syncPage(false);
});

onBeforeUnmount(() => {
    window.removeEventListener("splitevents:menu-state", handleMenuState);
    window.removeEventListener("splitevents:rerender", handleRerender);
    window.removeEventListener("hashchange", handleHashChange);
    window.removeEventListener("pageshow", handlePageShow);
});
</script>

<template>
    <a class="skip-link" href="#main-content">
        Перейти к основному содержимому
    </a>

    <div id="app">
        <svg class="icon-sprite" aria-hidden="true" focusable="false">
            <symbol id="icon-menu" viewBox="0 0 24 24"><path d="M4 5h16"></path><path d="M4 12h16"></path><path d="M4 19h16"></path></symbol>
            <symbol id="icon-x" viewBox="0 0 24 24"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></symbol>
            <symbol id="icon-house" viewBox="0 0 24 24"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></symbol>
            <symbol id="icon-user-round" viewBox="0 0 24 24"><circle cx="12" cy="8" r="5"></circle><path d="M20 21a8 8 0 0 0-16 0"></path></symbol>
            <symbol id="icon-ticket" viewBox="0 0 24 24"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path><path d="M13 5v2"></path><path d="M13 17v2"></path><path d="M13 11v2"></path></symbol>
            <symbol id="icon-server" viewBox="0 0 24 24"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"></rect><rect width="20" height="8" x="2" y="14" rx="2" ry="2"></rect><line x1="6" x2="6.01" y1="6" y2="6"></line><line x1="6" x2="6.01" y1="18" y2="18"></line></symbol>
            <symbol id="icon-users-round" viewBox="0 0 24 24"><path d="M18 21a8 8 0 0 0-16 0"></path><circle cx="10" cy="8" r="5"></circle><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"></path></symbol>
            <symbol id="icon-calendar-clock" viewBox="0 0 24 24"><path d="M16 2v3"></path><path d="M17 15.5v1.7l1 .625"></path><path d="M21 8.936V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.935"></path><path d="M3 9h9.873"></path><path d="M8 2v3"></path><circle cx="17" cy="17" r="5"></circle></symbol>
            <symbol id="icon-plus" viewBox="0 0 24 24"><path d="M5 12h14"></path><path d="M12 5v14"></path></symbol>
            <symbol id="icon-loader-circle" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></symbol>
            <symbol id="icon-pencil" viewBox="0 0 24 24"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path><path d="m15 5 4 4"></path></symbol>
            <symbol id="icon-check" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"></path></symbol>
            <symbol id="icon-eye" viewBox="0 0 24 24"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle></symbol>
            <symbol id="icon-eye-off" viewBox="0 0 24 24"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"></path><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"></path><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"></path><path d="m2 2 20 20"></path></symbol>
            <symbol id="icon-info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></symbol>
            <symbol id="icon-chevron-left" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"></path></symbol>
            <symbol id="icon-chevron-right" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"></path></symbol>
        </svg>
        <AppHeader />

        <main id="main-content" class="page-content" tabindex="-1">
            <HomePage v-show="currentPage === 'home'"/>
            <ProfilePage v-show="currentPage === 'profile'"/>
            <EventsPage v-show="currentPage === 'events'"/>
            <ServersPage v-show="currentPage === 'servers'"/>
            <FriendsPage v-show="currentPage === 'friends'"/>
            <UserProfilePage v-show="currentPage === 'users'"/>
            <NominationsPage v-show="currentPage === 'nominations'"/>
        </main>

        <NotificationRegion />
    </div>
</template>
