<script setup>
import { computed, ref, watch } from "vue";
import { getSafeImageKitUrl, IMAGEKIT_FOLDERS } from "../../js/media.js?v=20261127-3";

const props = defineProps({
    person: { type: Object, required: true },
    mode: { type: String, default: "avatar" },
    altKind: { type: String, default: "avatar" }
});

const imageFailed = ref(false);

const imageSource = computed(() => (
    getSafeImageKitUrl(props.person?.avatar, IMAGEKIT_FOLDERS.nominees)
));

const imageClass = computed(() => ({
    avatar: "vote-avatar",
    image: "vote-image-avatar",
    logo: "vote-nomination-logo",
    "duo-part": "vote-duo-logo-part"
}[props.mode] || "vote-avatar"));

const placeholderClass = computed(() => ({
    avatar: "vote-avatar-placeholder",
    image: "vote-image-placeholder",
    logo: "vote-logo-placeholder",
    "duo-part": "vote-duo-logo-part"
}[props.mode] || "vote-avatar-placeholder"));

const imageAlt = computed(() => (
    (props.altKind === "image" ? "Изображение " : "Аватар ")
    + (props.person?.name || "")
));

const initials = computed(() => (
    String(props.person?.name || "").slice(0, 2).toLocaleUpperCase("en")
));

watch([imageSource, () => props.person?.id], () => {
    imageFailed.value = false;
});

function handleImageError() {
    imageFailed.value = true;
}
</script>

<template>
    <img
        v-if="imageSource && !imageFailed"
        :class="imageClass"
        :src="imageSource"
        :alt="imageAlt"
        loading="lazy"
        decoding="async"
        referrerpolicy="no-referrer"
        @error="handleImageError"
    >
    <div v-else :class="placeholderClass" aria-hidden="true">
        {{ initials }}
    </div>
</template>
