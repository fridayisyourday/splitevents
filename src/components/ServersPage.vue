<script setup>
import { ref } from "vue";
import { SERVERS } from "../../js/servers/data.js?v=20261127-5";
import { notifyError, notifySuccess } from "../../js/notifications.js?v=20261127-1";

const expandedServerId = ref("");
const activeServerSlide = ref(0);

function toggleServerDetails(server) {
    const isClosing = expandedServerId.value === server.id;

    expandedServerId.value = isClosing ? "" : server.id;

    if (isClosing) {
        activeServerSlide.value = 0;
        return;
    }

    const isMobile = typeof window.matchMedia === "function"
        && window.matchMedia("(max-width: 640px)").matches;
    activeServerSlide.value = isMobile && server.images.length > 1 ? 1 : 0;
}

function currentServerSlide(server) {
    return expandedServerId.value === server.id ? activeServerSlide.value : 0;
}

function changeServerSlide(server, direction) {
    const imageCount = server.images.length;
    if (imageCount < 2) return;

    activeServerSlide.value = (
        activeServerSlide.value + direction + imageCount
    ) % imageCount;
}

function openModpack(server, event) {
    const webApp = window.Telegram?.WebApp;

    if (typeof webApp?.openLink !== "function") return;

    event.preventDefault();

    try {
        webApp.openLink(server.modpackUrl);
    } catch (error) {
        console.warn("SplitEvents: Telegram could not open the modpack link", error);
        window.open(server.modpackUrl, "_blank", "noopener,noreferrer");
    }
}

async function copyText(value) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return;
    }

    const field = document.createElement("textarea");
    field.value = value;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    field.style.pointerEvents = "none";
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand("copy");
    field.remove();

    if (!copied) throw new Error("Clipboard is unavailable");
}

async function copyServerAddress(server) {
    try {
        await copyText(server.address);
        notifySuccess("скопировано");
    } catch {
        notifyError(
            "не удалось скопировать ip",
            "попробуйте выделить адрес вручную."
        );
    }
}
</script>

<template>
    <section id="servers-page" class="page-view" aria-label="Сервера">
        <div class="section-page servers-page">
            <div class="section-page-content servers-page-content page-container">
                <header class="section-page-header">
                    <h1 class="section-page-title">Сервера</h1>
                </header>

                <div class="section-page-body servers-page-body">
                    <div class="servers-list page-grid" aria-label="Список серверов">
                        <div
                            v-for="server in SERVERS"
                            :key="server.id"
                            class="server-entry"
                            :class="{ 'server-entry--expanded': expandedServerId === server.id }"
                        >
                            <article
                                class="server-card"
                                :aria-labelledby="'server-title-' + server.id"
                            >
                                <div class="server-card-artwork">
                                    <div class="server-card-gallery" role="group" :aria-label="'изображения сервера ' + server.name">
                                        <div
                                            class="server-card-gallery-track"
                                            :style="{ transform: 'translateX(-' + currentServerSlide(server) * 100 + '%)' }"
                                        >
                                            <div
                                                v-for="(image, index) in server.images"
                                                :key="image.src"
                                                class="server-card-gallery-slide"
                                                :aria-hidden="index !== currentServerSlide(server)"
                                            >
                                                <img
                                                    class="server-card-gallery-image"
                                                    :src="image.src"
                                                    :alt="image.alt"
                                                    :loading="index === 0 ? 'eager' : 'lazy'"
                                                    draggable="false"
                                                >
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        v-if="expandedServerId === server.id && server.images.length > 1"
                                        class="server-card-gallery-controls"
                                        role="group"
                                        :aria-label="'управление изображениями сервера ' + server.name"
                                    >
                                        <button
                                            class="server-card-gallery-arrow ui-button ui-button--secondary ui-button--icon"
                                            type="button"
                                            aria-label="предыдущее изображение"
                                            title="предыдущее изображение"
                                            @click.stop="changeServerSlide(server, -1)"
                                        >
                                            <svg class="lucide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                                                <use href="#icon-chevron-left"></use>
                                            </svg>
                                        </button>
                                        <button
                                            class="server-card-gallery-arrow ui-button ui-button--secondary ui-button--icon"
                                            type="button"
                                            aria-label="следующее изображение"
                                            title="следующее изображение"
                                            @click.stop="changeServerSlide(server, 1)"
                                        >
                                            <svg class="lucide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                                                <use href="#icon-chevron-right"></use>
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <div class="server-card-content">
                                    <div class="server-card-logo" aria-hidden="true"></div>

                                    <div class="server-card-details">
                                        <h2 :id="'server-title-' + server.id" class="server-card-title">
                                            {{ server.name }}
                                        </h2>
                                        <div class="server-card-address-row">
                                            <button
                                                class="server-card-ip"
                                                type="button"
                                                :aria-label="'скопировать ip сервера ' + server.name + ': ' + server.address"
                                                title="скопировать ip"
                                                @click="copyServerAddress(server)"
                                            >
                                                {{ server.address }}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div class="server-card-footer">
                                    <button
                                        class="server-card-more ui-button ui-button--primary"
                                        type="button"
                                        :aria-expanded="expandedServerId === server.id"
                                        :aria-controls="'server-details-' + server.id"
                                        :aria-label="(expandedServerId === server.id ? 'свернуть' : 'подробнее') + ' о сервере ' + server.name"
                                        @click="toggleServerDetails(server)"
                                    >
                                        {{ expandedServerId === server.id ? "свернуть" : "подробнее" }}
                                    </button>
                                </div>
                            </article>

                            <Transition name="server-details">
                                <section
                                    v-if="expandedServerId === server.id"
                                    :id="'server-details-' + server.id"
                                    class="server-details-panel"
                                    role="region"
                                    :aria-labelledby="'server-title-' + server.id"
                                >
                                    <div class="server-details-panel-surface">
                                        <div class="server-details-grid">
                                            <span class="server-details-label">загрузчик</span>
                                            <span class="menu-item-badge menu-item-badge--accent">{{ server.loader }}</span>

                                            <span class="server-details-label">версия</span>
                                            <span class="menu-item-badge menu-item-badge--accent">{{ server.version }}</span>

                                            <span class="server-details-label">модпак</span>
                                            <a
                                                class="server-details-download ui-button ui-button--secondary"
                                                :href="server.modpackUrl"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                :aria-label="'загрузить модпак сервера ' + server.name"
                                                @click="openModpack(server, $event)"
                                            >
                                                загрузить
                                            </a>
                                        </div>
                                    </div>
                                </section>
                            </Transition>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
