<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { getCurrentPage, getPageHash } from "../../js/navigation.js?v=20261127-1";

const navigationItems = [
    { page: "home", id: "home-nav-button", label: "Главная", icon: "house" },
    { page: "events", id: "events-nav-button", label: "События", icon: "ticket" },
    { page: "servers", id: "servers-nav-button", label: "Сервера", icon: "server" },
    { page: "friends", id: "friends-nav-button", label: "Друзья", icon: "users-round" },
    { page: "profile", id: "profile-nav-button", label: "Профиль", icon: "user-round" }
];

const activePage = ref("home");
const activeEventsCount = ref(0);
const isOpen = ref(false);
const isVisible = ref(false);
const isPanelOpen = ref(false);

const headerElement = ref(null);
const menuButtonElement = ref(null);
const closeButtonElement = ref(null);
const panelElement = ref(null);

let closeTimer = null;
let openFrame = null;
let isUnmounted = false;

const eventsBadgeText = computed(() => (
    activeEventsCount.value > 99 ? "99+" : String(activeEventsCount.value)
));

const eventsBadgeLabel = computed(() => {
    const count = activeEventsCount.value;
    const lastTwo = count % 100;
    const lastOne = count % 10;
    const word = lastOne === 1 && lastTwo !== 11
        ? "активное событие"
        : lastOne >= 2 && lastOne <= 4 && (lastTwo < 12 || lastTwo > 14)
            ? "активных события"
            : "активных событий";

    return count + " " + word;
});

function updateActivePage() {
    const page = getCurrentPage();
    activePage.value = page === "users" ? "friends" : page;
}

function notifyMenuState() {
    window.dispatchEvent(new CustomEvent("splitevents:menu-state", {
        detail: { open: isOpen.value }
    }));
}

function setBackgroundInteractionDisabled(disabled) {
    const main = document.getElementById("main-content");
    const header = headerElement.value;

    if (header) {
        header.inert = disabled;
        if (disabled) header.setAttribute("aria-hidden", "true");
        else header.removeAttribute("aria-hidden");
    }

    if (main) {
        main.inert = disabled;
        if (disabled) main.setAttribute("aria-hidden", "true");
        else main.removeAttribute("aria-hidden");
    }
}

function openMenu() {
    if (isOpen.value) return;

    if (closeTimer !== null) {
        window.clearTimeout(closeTimer);
        closeTimer = null;
    }

    if (openFrame !== null) {
        window.cancelAnimationFrame(openFrame);
        openFrame = null;
    }

    // Make the drawer visible in its closed position first. The next frame
    // then applies the open class, allowing the CSS transform to animate.
    isVisible.value = true;
    isOpen.value = true;
    isPanelOpen.value = false;
    document.body.classList.add("menu-open");
    setBackgroundInteractionDisabled(true);

    nextTick(() => {
        if (!isOpen.value || isUnmounted) return;

        openFrame = window.requestAnimationFrame(() => {
            openFrame = null;
            if (!isOpen.value || !isVisible.value || isUnmounted) return;

            isPanelOpen.value = true;
            closeButtonElement.value?.focus();
        });
    });

    notifyMenuState();
}

function closeMenu(restoreFocus = false) {
    if (!isOpen.value && !isVisible.value && openFrame === null) return;

    if (openFrame !== null) {
        window.cancelAnimationFrame(openFrame);
        openFrame = null;
    }

    isOpen.value = false;
    isPanelOpen.value = false;
    document.body.classList.remove("menu-open");
    setBackgroundInteractionDisabled(false);

    if (restoreFocus) {
        menuButtonElement.value?.focus({ preventScroll: true });
    }

    if (closeTimer !== null) {
        window.clearTimeout(closeTimer);
    }

    closeTimer = window.setTimeout(() => {
        if (!isOpen.value) isVisible.value = false;
        closeTimer = null;
    }, 240);

    notifyMenuState();
}

function toggleMenu() {
    if (isOpen.value) closeMenu(true);
    else openMenu();
}

function navigateTo(page) {
    const target = getPageHash(page);
    closeMenu(false);

    if (window.location.hash === target) {
        window.dispatchEvent(new CustomEvent("splitevents:rerender"));
        return;
    }

    window.location.hash = target;
}

function getFocusableElements() {
    if (!panelElement.value) return [];

    return Array.from(
        panelElement.value.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
    ).filter((element) => (
        !element.hidden && element.getClientRects().length > 0
    ));
}

function handleKeydown(event) {
    if (!isOpen.value) return;

    if (event.key === "Escape") {
        event.preventDefault();
        closeMenu(true);
        return;
    }

    if (event.key !== "Tab") return;

    const focusable = getFocusableElements();
    if (!focusable.length) {
        event.preventDefault();
        panelElement.value?.focus();
        return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

function handleHashChange() {
    updateActivePage();
    if (isOpen.value) closeMenu(false);
}

function handleMenuCommand(event) {
    const command = event.detail || {};
    if (command.action === "open") openMenu();
    if (command.action === "close") closeMenu(Boolean(command.restoreFocus));
    if (command.action === "sync-state") notifyMenuState();
}

function handleMenuBadge(event) {
    const count = Number(event.detail?.count);
    activeEventsCount.value = Number.isFinite(count)
        ? Math.max(0, Math.floor(count))
        : 0;
}

function handleMenuPage(event) {
    const page = event.detail?.page;
    if (typeof page === "string") {
        activePage.value = page === "users" ? "friends" : page;
    }
}

onMounted(() => {
    updateActivePage();
    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("splitevents:menu-command", handleMenuCommand);
    window.addEventListener("splitevents:menu-badge", handleMenuBadge);
    window.addEventListener("splitevents:menu-page", handleMenuPage);
    document.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
    window.removeEventListener("hashchange", handleHashChange);
    window.removeEventListener("splitevents:menu-command", handleMenuCommand);
    window.removeEventListener("splitevents:menu-badge", handleMenuBadge);
    window.removeEventListener("splitevents:menu-page", handleMenuPage);
    document.removeEventListener("keydown", handleKeydown);

    isUnmounted = true;
    if (closeTimer !== null) window.clearTimeout(closeTimer);
    if (openFrame !== null) window.cancelAnimationFrame(openFrame);
    document.body.classList.remove("menu-open");
    setBackgroundInteractionDisabled(false);
});
</script>

<template>
    <header ref="headerElement" class="site-header">
        <button
            id="menu-button"
            ref="menuButtonElement"
            class="header-button ui-button ui-button--icon ui-button--secondary"
            type="button"
            aria-label="Открыть меню"
            aria-controls="menu-panel"
            :aria-expanded="String(isOpen)"
            title="Меню"
            @click="toggleMenu"
        >
            <svg class="lucide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                <use href="#icon-menu"></use>
            </svg>
        </button>

        <div class="header-logo" aria-label="Сплит">
            сплит
        </div>
    </header>

    <div
        id="menu-overlay"
        class="menu-overlay"
        :class="{ 'is-open': isPanelOpen }"
        :hidden="!isVisible"
    >
        <button
            id="menu-backdrop"
            class="menu-backdrop"
            type="button"
            aria-label="Закрыть меню"
            tabindex="-1"
            @click="closeMenu(true)"
        ></button>

        <aside
            id="menu-panel"
            ref="panelElement"
            class="menu-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="menu-title"
            tabindex="-1"
        >
            <div class="menu-panel-header">
                <h2 id="menu-title" class="menu-panel-title">Меню</h2>
                <button
                    id="menu-close-button"
                    ref="closeButtonElement"
                    class="menu-close-button ui-button ui-button--icon ui-button--secondary"
                    type="button"
                    aria-label="Закрыть меню"
                    title="Закрыть меню"
                    @click="closeMenu(true)"
                >
                    <svg class="lucide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                        <use href="#icon-x"></use>
                    </svg>
                </button>
            </div>

            <nav class="menu-navigation" aria-label="Основная навигация">
                <button
                    v-for="item in navigationItems"
                    :id="item.id"
                    :key="item.page"
                    class="menu-item ui-button ui-button--nav ui-button--ghost"
                    type="button"
                    :aria-current="activePage === item.page ? 'page' : undefined"
                    @click="navigateTo(item.page)"
                >
                    <svg class="lucide-icon menu-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                        <use :href="'#icon-' + item.icon"></use>
                    </svg>
                    <span class="menu-item-label">{{ item.label }}</span>
                    <span
                        v-if="item.page === 'events' && activeEventsCount > 0"
                        id="events-active-badge"
                        class="menu-item-badge"
                        role="status"
                        aria-live="polite"
                        :aria-label="eventsBadgeLabel"
                    >{{ eventsBadgeText }}</span>
                </button>

                <button
                    class="menu-item menu-item-coming-soon ui-button ui-button--nav ui-button--ghost"
                    type="button"
                    disabled
                >
                    <svg class="lucide-icon menu-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                        <use href="#icon-calendar-clock"></use>
                    </svg>
                    <span class="menu-item-label">Human Glaze</span>
                    <span class="menu-item-badge menu-item-badge--accent">скоро</span>
                </button>
            </nav>
        </aside>
    </div>
</template>
