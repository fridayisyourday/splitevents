<script setup>
import NomineeVisual from "./NomineeVisual.vue";

const props = defineProps({
    nomination: { type: Object, required: true },
    featured: { type: Boolean, default: false },
    carouselPosition: { type: String, default: "" },
    selectedPair: { type: Object, default: null },
    selectedNominee: { type: Object, default: null },
    selectedLabel: { type: String, default: "" },
    hasSelection: { type: Boolean, default: false }
});

const emit = defineEmits(["open", "slide"]);

function handleCardClick(event) {
    if (
        props.carouselPosition
        && props.carouselPosition !== "current"
        && !event.target.closest("button")
    ) {
        emit("slide", props.nomination);
    }
}

function openSelection(event) {
    emit("open", {
        nomination: props.nomination,
        event,
        carouselPosition: props.carouselPosition
    });
}
</script>

<template>
    <article
        class="vote-nomination-card"
        :class="{
            'vote-nomination-card--featured': featured,
            'vote-carousel-card': Boolean(carouselPosition),
            ['vote-carousel-card--' + carouselPosition]: Boolean(carouselPosition)
        }"
        :data-nomination-id="nomination.id"
        :aria-labelledby="'vote-title-' + nomination.id"
        @click="handleCardClick"
    >
        <div class="vote-logo-wrap">
            <div v-if="selectedPair" class="vote-duo-logo">
                <NomineeVisual :person="selectedPair.first" mode="duo-part"/>
                <NomineeVisual :person="selectedPair.second" mode="duo-part"/>
            </div>
            <NomineeVisual
                v-else-if="selectedNominee"
                :person="selectedNominee"
                mode="logo"
                :alt-kind="nomination.type === 'image' || nomination.type === 'fixed' ? 'image' : 'avatar'"
            />
            <div v-else class="vote-logo-placeholder" aria-hidden="true"></div>
        </div>

        <div class="vote-nomination-wash artwork-fade artwork-fade--bottom" aria-hidden="true"></div>

        <div class="vote-nomination-content">
            <h3 :id="'vote-title-' + nomination.id" class="vote-nomination-title">
                {{ nomination.title }}
            </h3>

            <p v-if="selectedLabel" class="vote-selected-nominee">
                {{ selectedLabel }}
            </p>

            <button
                class="ui-button vote-action-button"
                :class="hasSelection ? 'ui-button--secondary' : 'ui-button--primary'"
                type="button"
                :aria-pressed="hasSelection ? 'true' : undefined"
                @click.stop="openSelection"
            >
                {{ hasSelection ? "изменить выбор" : "выбрать номинанта" }}
            </button>
        </div>
    </article>
</template>
