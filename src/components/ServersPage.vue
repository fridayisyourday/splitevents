<script setup>
import { onBeforeUnmount, ref } from "vue";
import { SERVERS } from "../../js/servers/data.js?v=20261127-2";

const copiedServerId = ref("");
let copiedTimeout = null;

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
        copiedServerId.value = server.id;
        if (copiedTimeout !== null) window.clearTimeout(copiedTimeout);
        copiedTimeout = window.setTimeout(() => {
            copiedServerId.value = "";
            copiedTimeout = null;
        }, 1600);
    } catch {
        window.dispatchEvent(new CustomEvent("splitevents:notification", {
            detail: {
                type: "error",
                message: "не удалось скопировать ip",
                detail: "попробуйте выделить адрес вручную"
            }
        }));
    }
}

onBeforeUnmount(() => {
    if (copiedTimeout !== null) window.clearTimeout(copiedTimeout);
});
</script>

<template>
    <section id="servers-page" class="page-view" aria-label="Сервера">
        <div class="section-page servers-page">
            <div class="section-page-content servers-page-content">
                <header class="section-page-header">
                    <h1 class="section-page-title">Сервера</h1>
                </header>

                <div class="section-page-body servers-page-body">
                    <div class="servers-list" aria-label="Список серверов">
                        <article
                            v-for="server in SERVERS"
                            :key="server.id"
                            class="server-card"
                            :aria-labelledby="'server-title-' + server.id"
                        >
                            <div class="server-card-artwork" aria-hidden="true"></div>

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
                                        <span
                                            v-if="copiedServerId === server.id"
                                            class="server-card-copy-status"
                                            role="status"
                                            aria-live="polite"
                                        >скопировано</span>
                                    </div>
                                </div>
                            </div>

                            <div class="server-card-footer">
                                <button
                                    class="server-card-more ui-button ui-button--primary"
                                    type="button"
                                    disabled
                                    title="скоро"
                                >
                                    подробнее
                                </button>
                            </div>
                        </article>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
