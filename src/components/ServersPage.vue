<script setup>
import { ref } from "vue";
import { SERVERS } from "../../js/servers/data.js?v=20261127-4";

const expandedServerId = ref("");
const galleryIndexes = ref({});
const gallerySlides = [0, 1, 2];

function shiftGallery(server, direction) {
    const currentIndex = galleryIndexes.value[server.id] ?? 0;
    galleryIndexes.value = {
        ...galleryIndexes.value,
        [server.id]: (currentIndex + direction + gallerySlides.length) % gallerySlides.length
    };
}

function toggleServerDetails(server) {
    expandedServerId.value = expandedServerId.value === server.id ? "" : server.id;
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
                                        <button
                                            class="server-card-gallery-arrow server-card-gallery-arrow--previous ui-button ui-button--secondary ui-button--icon"
                                            type="button"
                                            aria-label="предыдущее изображение"
                                            title="предыдущее изображение"
                                            @click="shiftGallery(server, -1)"
                                        >
                                            <svg class="lucide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                                                <use href="#icon-chevron-left"></use>
                                            </svg>
                                        </button>
                                        <div class="server-card-gallery-viewport" aria-live="polite">
                                            <div
                                                class="server-card-gallery-track"
                                                :style="{ transform: 'translateX(-' + (galleryIndexes[server.id] ?? 0) * 100 + '%)' }"
                                            >
                                                <div
                                                    v-for="slide in gallerySlides"
                                                    :key="slide"
                                                    class="server-card-gallery-slide"
                                                    :class="'server-card-gallery-slide--' + slide"
                                                    role="img"
                                                    :aria-label="'нейтральная заглушка баннера ' + (slide + 1)"
                                                    :aria-hidden="(galleryIndexes[server.id] ?? 0) !== slide"
                                                ></div>
                                            </div>
                                        </div>
                                        <button
                                            class="server-card-gallery-arrow server-card-gallery-arrow--next ui-button ui-button--secondary ui-button--icon"
                                            type="button"
                                            aria-label="следующее изображение"
                                            title="следующее изображение"
                                            @click="shiftGallery(server, 1)"
                                        >
                                            <svg class="lucide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                                                <use href="#icon-chevron-right"></use>
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <div class="server-card-content">
                                    <div class="server-card-details">
                                        <h2 :id="'server-title-' + server.id" class="server-card-title">
                                            {{ server.name }}
                                        </h2>
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
