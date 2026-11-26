<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
    person: { type: Object, required: true },
    mode: { type: String, default: "avatar" },
    altKind: { type: String, default: "avatar" }
});

const imageFailed = ref(false);

const imageSource = computed(() => (
    typeof props.person?.avatar === "string" ? props.person.avatar : ""
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

watch(imageSource, () => {
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
