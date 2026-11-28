<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { EVENTS } from "../../js/events/data.js?v=20261126-10";
import {
    getActiveEventsCount,
    getNextActiveEventExpiry
} from "../../js/events/active-state.js?v=20261126-2";
import {
    getHiddenEventIds,
    hideEvent,
    unhideEvent
} from "../../js/events/hidden-state.js?v=20261126-3";
import { getTelegramUserId } from "../../js/telegram.js?v=20261126-6";
import { getEventCoverUrl, getSafeImageKitUrl, IMAGEKIT_FOLDERS } from "../../js/media.js?v=20261127-3";
import { getCurrentPage } from "../../js/navigation.js?v=20261127-1";

const userId = getTelegramUserId();
const hiddenIds = ref(getHiddenEventIds(userId));
const showingHidden = ref(false);
const now = ref(Date.now());
const failedImageIds = ref(new Set());
let countdownInterval = null;
let expiryTimeout = null;
let lastBadgeCount = null;

const visibleEvents = computed(() => EVENTS.filter((event) => (
    showingHidden.value || !hiddenIds.value.has(event.id)
)));

const visibilityLabel = computed(() => (
    showingHidden.value ? "Скрыть скрытые" : "Показать скрытые"
));

const visibilityDisabled = computed(() => (
    hiddenIds.value.size === 0 && !showingHidden.value
));

function isEventHidden(event) {
    return hiddenIds.value.has(event.id);
}

function eventImageUrl(event) {
    if (failedImageIds.value.has(event.id)) return "";
    return getSafeImageKitUrl(event.image, IMAGEKIT_FOLDERS.events) || getEventCoverUrl(event.id);
}

function markImageFailed(eventId) {
    const next = new Set(failedImageIds.value);
    next.add(eventId);
    failedImageIds.value = next;
}

function eventDateTime(event) {
    if (!event.endsAt) return undefined;
    const date = new Date(event.endsAt);
    return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
}

function countdown(event) {
    if (!event.endsAt) {
        return { days: "-", hours: "-", minutes: "-" };
    }

    const endTime = new Date(event.endsAt).getTime();
    if (!Number.isFinite(endTime)) {
        return { days: "-", hours: "-", minutes: "-", seconds: "-" };
    }

    const remaining = Math.max(0, endTime - now.value);
    const totalSeconds = Math.floor(remaining / 1000);
    return {
        days: String(Math.floor(totalSeconds / 86400)),
        hours: String(Math.floor((totalSeconds % 86400) / 3600)).padStart(2, "0"),
        minutes: String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0")
    };
}

function isEventEnded(event) {
    if (!event.endsAt) return false;
    const endTime = new Date(event.endsAt).getTime();
    return Number.isFinite(endTime) && endTime <= now.value;
}

function dispatchActiveEventsBadge() {
    const count = getActiveEventsCount(EVENTS, hiddenIds.value, now.value);
    if (count === lastBadgeCount) return;
    lastBadgeCount = count;
    window.dispatchEvent(new CustomEvent("splitevents:menu-badge", {
        detail: { count }
    }));
}

function clearExpiryTimeout() {
    if (expiryTimeout !== null) {
        window.clearTimeout(expiryTimeout);
        expiryTimeout = null;
    }
}

function scheduleNextExpiry() {
    clearExpiryTimeout();
    const nextExpiry = getNextActiveEventExpiry(EVENTS, hiddenIds.value, now.value);
    if (!Number.isFinite(nextExpiry)) return;

    const delay = Math.min(
        Math.max(0, nextExpiry - now.value + 50),
        2_147_483_647
    );
    expiryTimeout = window.setTimeout(() => {
        expiryTimeout = null;
        updateClock();
    }, delay);
}

function updateClock() {
    now.value = Date.now();
    dispatchActiveEventsBadge();
    scheduleNextExpiry();
}

function stopClock() {
    if (countdownInterval !== null) {
        window.clearInterval(countdownInterval);
        countdownInterval = null;
    }
    clearExpiryTimeout();
}

function startClock() {
    stopClock();
    updateClock();
    countdownInterval = window.setInterval(() => {
        now.value = Date.now();
        dispatchActiveEventsBadge();
    }, 60_000);
}

function syncClockWithRoute() {
    if (getCurrentPage() === "events") {
        startClock();
    } else {
        stopClock();
    }
}

function toggleEventVisibility(event) {
    const shouldHide = !hiddenIds.value.has(event.id);
    const changed = shouldHide
        ? hideEvent(event.id, userId)
        : unhideEvent(event.id, userId);

    if (!changed) return;

    hiddenIds.value = getHiddenEventIds(userId);
    dispatchActiveEventsBadge();
    scheduleNextExpiry();
}

function toggleHiddenEvents() {
    if (visibilityDisabled.value) return;
    showingHidden.value = !showingHidden.value;
}

function participate(event) {
    const target = "#/nominations?event=" + encodeURIComponent(event.id);
    if (window.location.hash === target) {
        window.dispatchEvent(new CustomEvent("splitevents:rerender"));
    } else {
        window.location.hash = target;
    }
}

function handleVisibilityChange() {
    if (!document.hidden) updateClock();
}

onMounted(() => {
    window.addEventListener("hashchange", syncClockWithRoute);
    window.addEventListener("pageshow", updateClock);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    dispatchActiveEventsBadge();
    syncClockWithRoute();
});

onBeforeUnmount(() => {
    stopClock();
    window.removeEventListener("hashchange", syncClockWithRoute);
    window.removeEventListener("pageshow", updateClock);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
});
</script>

<template>
    <section id="events-page" class="page-view" aria-label="Текущие события">
        <div class="section-page events-page">
            <div class="section-page-content events-page-content page-container">
                <header class="section-page-header">
                    <h1 class="section-page-title">Текущие события</h1>
                </header>

                <div
                    class="section-page-body events-page-body"
                    :class="{ 'section-page-body--center': visibleEvents.length === 0 }"
                >
                    <div v-if="visibleEvents.length" class="events-list page-grid" aria-label="Список событий">
                        <article
                            v-for="event in visibleEvents"
                            :key="event.id"
                            class="event-card"
                            :class="{ 'is-event-ended': isEventEnded(event) }"
                            :aria-labelledby="'event-title-' + event.id"
                        >
                            <div class="event-card-artwork" aria-hidden="true">
                                <img
                                    v-if="eventImageUrl(event)"
                                    class="event-card-image"
                                    :src="eventImageUrl(event)"
                                    alt=""
                                    width="1940"
                                    height="500"
                                    loading="lazy"
                                    decoding="async"
                                    @error="markImageFailed(event.id)"
                                >
                            </div>

                            <div class="event-card-wash artwork-fade artwork-fade--right" aria-hidden="true"></div>

                            <div class="event-card-content">
                                <h2 :id="'event-title-' + event.id" class="event-card-title">
                                    {{ event.title }}
                                </h2>
                                <p :id="'event-description-' + event.id" class="event-card-description app-description">
                                    {{ event.description || "" }}
                                </p>

                                <div class="event-card-meta app-meta">
                                    <time class="event-card-date" :datetime="eventDateTime(event)">
                                        {{ event.dateLabel || "" }}
                                    </time>
                                    <span class="event-card-meta-separator" aria-hidden="true">•</span>
                                    <span
                                        class="event-card-countdown"
                                        role="timer"
                                        aria-label="Время до окончания события"
                                        aria-live="off"
                                    >
                                        <span class="event-countdown-part"><span class="event-countdown-value">{{ countdown(event).days }}</span><span class="event-countdown-unit">д</span></span>
                                        <span class="event-countdown-part"><span class="event-countdown-value">{{ countdown(event).hours }}</span><span class="event-countdown-unit">ч</span></span>
                                        <span class="event-countdown-part"><span class="event-countdown-value">{{ countdown(event).minutes }}</span><span class="event-countdown-unit">м</span></span>
                                    </span>
                                </div>

                                <div class="event-card-actions">
                                    <button
                                        class="event-card-action ui-button ui-button--primary"
                                        type="button"
                                        :aria-describedby="'event-description-' + event.id"
                                        title="Открыть голосование"
                                        @click="participate(event)"
                                    >
                                        {{ event.actionLabel || "Принять участие" }}
                                    </button>
                                    <button
                                        class="event-card-visibility-action ui-button ui-button--icon ui-button--secondary"
                                        type="button"
                                        :aria-label="isEventHidden(event) ? 'Вернуть событие' : 'Скрыть событие'"
                                        :title="isEventHidden(event) ? 'Вернуть событие' : 'Скрыть событие'"
                                        @click="toggleEventVisibility(event)"
                                    >
                                        <svg class="lucide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                                            <template v-if="isEventHidden(event)">
                                                <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"></path>
                                                <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"></path>
                                                <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"></path>
                                                <path d="m2 2 20 20"></path>
                                            </template>
                                            <template v-else>
                                                <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-19.876 0"></path>
                                                <circle cx="12" cy="12" r="3"></circle>
                                            </template>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </article>
                    </div>

                    <div v-else class="empty-state" role="status" aria-live="polite">
                        <p class="empty-state-message">пока ничего нет</p>
                        <p class="empty-state-note">оставайтесь с нами!</p>
                    </div>

                    <div class="events-page-footer">
                        <button
                            class="events-visibility-toggle ui-button ui-button--secondary"
                            type="button"
                            :disabled="visibilityDisabled"
                            :title="visibilityDisabled ? 'Скрытых событий пока нет' : visibilityLabel + ' события'"
                            :aria-label="visibilityLabel + ' события'"
                            :aria-pressed="String(showingHidden)"
                            @click="toggleHiddenEvents"
                        >
                            <svg class="lucide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                                <template v-if="showingHidden">
                                    <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"></path>
                                    <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"></path>
                                    <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"></path>
                                    <path d="m2 2 20 20"></path>
                                </template>
                                <template v-else>
                                    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-19.876 0"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </template>
                            </svg>
                            <span>{{ visibilityLabel }}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
