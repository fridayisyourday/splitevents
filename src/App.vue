<script setup>
import { onMounted } from "vue";
import legacyMarkup from "./legacy-shell.html?raw";

// Keep the existing DOM-based app running while individual screens
// are gradually migrated to Vue components.
onMounted(() => {
    import("../app.js").catch((error) => {
        console.error("SplitEvents: legacy application failed to start", error);
    });
});
</script>

<template>
    <div v-html="legacyMarkup"></div>
</template>
