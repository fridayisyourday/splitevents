<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";

const MAX_VISIBLE_NOTIFICATIONS = 3;
const DEFAULT_DURATION = 5000;

const notifications = ref([]);
const timers = new Map();
let nextId = 0;

function dismiss(id) {
    const timeout = timers.get(id);
    if (timeout !== undefined) {
        window.clearTimeout(timeout);
        timers.delete(id);
    }
    notifications.value = notifications.value.filter((item) => item.id !== id);
}

function show(type, message, detail = "") {
    const title = typeof message === "string" ? message.trim() : "";
    if (!title) return;

    while (notifications.value.length >= MAX_VISIBLE_NOTIFICATIONS) {
        dismiss(notifications.value[0].id);
    }

    const id = ++nextId;
    const description = typeof detail === "string" ? detail.trim() : "";
    notifications.value.push({ id, type, title, description });

    const timeout = window.setTimeout(() => dismiss(id), DEFAULT_DURATION);
    timers.set(id, timeout);
}

function handleNotification(event) {
    const notification = event.detail || {};
    if (notification.type !== "error" && notification.type !== "success") return;
    show(notification.type, notification.message, notification.detail);
}

onMounted(() => {
    window.addEventListener("splitevents:notification", handleNotification);
});

onBeforeUnmount(() => {
    window.removeEventListener("splitevents:notification", handleNotification);
    Array.from(timers.keys()).forEach(dismiss);
});
</script>

<template>
    <div id="notification-region" class="notification-region" role="region" aria-label="уведомления">
        <article
            v-for="notification in notifications"
            :key="notification.id"
            class="app-notification"
            :class="'app-notification--' + notification.type"
            :role="notification.type === 'error' ? 'alert' : 'status'"
        >
            <span class="app-notification__symbol" aria-hidden="true">
                <svg class="lucide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                    <use :href="notification.type === 'error' ? '#icon-x' : '#icon-check'"></use>
                </svg>
            </span>

            <div class="app-notification__content">
                <p class="app-notification__title">{{ notification.title }}</p>
                <p v-if="notification.description" class="app-notification__detail">
                    {{ notification.description }}
                </p>
            </div>

            <button
                class="app-notification__close"
                type="button"
                aria-label="закрыть уведомление"
                @click="dismiss(notification.id)"
            >
                <svg class="lucide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                    <use href="#icon-x"></use>
                </svg>
            </button>
        </article>
    </div>
</template>
