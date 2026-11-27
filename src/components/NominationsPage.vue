<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import NominationCard from "./NominationCard.vue";
import NomineeVisual from "./NomineeVisual.vue";
import { NOMINEES, nomineeById, compareNames } from "../../js/nominations/database/nominees.js?v=20261127-1";
import { createNominationState } from "../../js/nominations/state.js?v=20261126-1";
import { createNominationModel } from "../../js/nominations/model.js?v=20261126-2";
import { getCountdownParts } from "../../js/nominations/countdown.js";

const nominations = reactive(createNominationState());
const nominationsAnchor = ref(null);
const countdownNow = ref(Date.now());
const awardDeadline = new Date(2026, 11, 21, 0, 0, 0).getTime();
const countdown = computed(() => {
    const parts = getCountdownParts(awardDeadline, countdownNow.value);
    return {
        ...parts,
        days: String(parts.days).padStart(2, "0"),
        hours: String(parts.hours).padStart(2, "0"),
        minutes: String(parts.minutes).padStart(2, "0")
    };
});
let countdownInterval = null;
const introMessages = [
    "первая большая премия ρumρkin ρie, где вы определите самые запомнившиеся моменты 2026 года.",
    "в каждой номинации можно выбрать только один вариант. если, на ваш взгляд, достойного кандидата нет среди предложенных, можно номинировать собственного.",
    "голосование закрывается 19 декабря в 23:59. стань частью истории и выбери тех, кто по-настоящему достоин стать победителем SQUASH 2026."
];
const introMessageIndex = ref(0);
const introMessageDirection = ref(1);
let introCarouselInterval = null;
const nominationModel = createNominationModel({ nomineeById, compareNames });

const pageSize = ref(getPageSize());
const activeNomination = ref(null);
const voteOpen = ref(false);
const pickerOpen = ref(false);
const pickerPage = ref(0);
const carouselIndex = ref(0);
const carouselDirection = ref(0);
const carouselStageKey = ref(0);
const voteGridDirection = ref(0);
const voteGridKey = ref(0);
const pickerGridDirection = ref(0);
const pickerGridKey = ref(0);

const rootElement = ref(null);
const voteDialog = ref(null);
const pickerDialog = ref(null);
const voteCloseButton = ref(null);
const pickerCloseButton = ref(null);
const suggestionInput = ref(null);

let voteTrigger = null;
let pickerTrigger = null;
let voteTriggerNominationId = "";

const featuredNominations = computed(() => nominations.slice(0, 2));
const carouselNominations = computed(() => nominations.slice(2));

const carouselCards = computed(() => {
    const items = carouselNominations.value;
    const total = items.length;
    if (!total) return [];

    return [-1, 0, 1].map((offset) => {
        const index = (carouselIndex.value + offset + total) % total;
        return {
            nomination: items[index],
            position: offset === 0 ? "current" : (offset < 0 ? "previous" : "next")
        };
    });
});

const voteEntries = computed(() => {
    const nomination = activeNomination.value;
    if (!nomination) return [];

    if (nomination.type === "duo") {
        return nominationModel.getDuoPairs(nomination);
    }

    const people = (nomination.nomineeIds || [])
        .map((id) => nomineeById.get(id))
        .filter((person) => (
            person && (!nomination.gender || person.gender === nomination.gender)
        ))
        .sort(compareNames);

    if (nomination.type === "image") {
        return [...people, { type: "suggest-other" }];
    }

    if (nomination.type === "fixed") {
        return people;
    }

    return [...people, { type: "add-card" }];
});

const voteLastPage = computed(() => (
    Math.max(0, Math.ceil(voteEntries.value.length / pageSize.value) - 1)
));

const pagedVoteEntries = computed(() => {
    const page = activeNomination.value?.page || 0;
    const start = page * pageSize.value;
    return voteEntries.value.slice(start, start + pageSize.value);
});

const votePreviousDisabled = computed(() => (
    voteEntries.value.length === 0 || !activeNomination.value || activeNomination.value.page <= 0
));

const voteNextDisabled = computed(() => (
    voteEntries.value.length === 0 || !activeNomination.value
        || activeNomination.value.page >= voteLastPage.value
));

const availablePeople = computed(() => {
    const nomination = activeNomination.value;
    if (!nomination || nomination.type !== "individual") return [];

    const presetIds = new Set(nomination.nomineeIds || []);
    return NOMINEES.filter((person) => (
        (!nomination.gender || person.gender === nomination.gender)
        && !presetIds.has(person.id)
        && person.id !== nomination.selectedFromPoolId
    ));
});

const pickerLastPage = computed(() => (
    Math.max(0, Math.ceil(availablePeople.value.length / pageSize.value) - 1)
));

const pagedPickerPeople = computed(() => {
    const start = pickerPage.value * pageSize.value;
    return availablePeople.value.slice(start, start + pageSize.value);
});

const pickerPreviousDisabled = computed(() => (
    availablePeople.value.length === 0 || pickerPage.value <= 0
));

const pickerNextDisabled = computed(() => (
    availablePeople.value.length === 0 || pickerPage.value >= pickerLastPage.value
));

function getPageSize() {
    if (typeof window.matchMedia === "function") {
        return window.matchMedia("(max-width: 760px), (pointer: coarse)").matches
            ? 2
            : 3;
    }

    return Number(window.innerWidth) <= 760 ? 2 : 3;
}

function syncPageSize() {
    const nextSize = getPageSize();
    if (nextSize !== pageSize.value) pageSize.value = nextSize;
}
function scrollToNominations() {
    nominationsAnchor.value?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function advanceIntroMessage() {
    introMessageDirection.value = 1;
    introMessageIndex.value = (introMessageIndex.value + 1) % introMessages.length;
}

function changeIntroMessage(direction) {
    introMessageDirection.value = direction;
    introMessageIndex.value = (
        introMessageIndex.value + direction + introMessages.length
    ) % introMessages.length;

    if (introCarouselInterval !== null) {
        window.clearInterval(introCarouselInterval);
    }
    introCarouselInterval = window.setInterval(advanceIntroMessage, 6_000);
}

function getSelectedPair(nomination) {
    return nominationModel.selectedDuo(nomination);
}

function getSelectedNominee(nomination) {
    const id = nomination.selectedId || nomination.selectedFromPoolId;
    return id ? nomineeById.get(id) || null : null;
}

function getSelectedLabel(nomination) {
    const pair = getSelectedPair(nomination);
    if (pair) return pair.first.name + " + " + pair.second.name;

    const person = getSelectedNominee(nomination);
    if (person) return person.name;

    return nomination.suggestionMode === "voted"
        ? String(nomination.suggestedText || "")
        : "";
}

function hasNominationSelection(nomination) {
    return Boolean(
        getSelectedPair(nomination)
        || getSelectedNominee(nomination)
        || nomination.suggestionMode === "voted"
    );
}

function getEntryKey(entry) {
    if (entry.type === "suggest-other") return "suggest-other";
    if (entry.type === "add-card") return "add-card";
    return entry.id;
}

function moveCarouselTo(nomination) {
    const items = carouselNominations.value;
    const nextIndex = items.findIndex((item) => item.id === nomination.id);
    if (nextIndex < 0 || nextIndex === carouselIndex.value) return;

    const next = (carouselIndex.value + 1) % items.length;
    carouselDirection.value = nextIndex === next ? 1 : -1;
    carouselIndex.value = nextIndex;
    carouselStageKey.value += 1;
}

function moveCarousel(direction) {
    const total = carouselNominations.value.length;
    if (!total) return;

    carouselDirection.value = direction;
    carouselIndex.value = (carouselIndex.value + direction + total) % total;
    carouselStageKey.value += 1;
}

function openVote(payload) {
    if (!payload || !payload.nomination) return;

    if (payload.carouselPosition && payload.carouselPosition !== "current") {
        moveCarouselTo(payload.nomination);
    }

    voteTrigger = payload.event?.currentTarget || null;
    voteTriggerNominationId = payload.nomination.id;
    activeNomination.value = payload.nomination;
    if (activeNomination.value.page > voteLastPage.value) {
        activeNomination.value.page = voteLastPage.value;
    }

    voteGridDirection.value = 0;
    voteOpen.value = true;

    nextTick(() => focusFirst(voteDialog.value, voteCloseButton.value));
}

function focusFirst(dialog, fallback) {
    if (!dialog) {
        fallback?.focus({ preventScroll: true });
        return;
    }

    const first = dialog.querySelector(
        "button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex='-1'])"
    );
    (first || fallback)?.focus({ preventScroll: true });
}

function closeVote() {
    if (!voteOpen.value) return;

    voteOpen.value = false;
    pickerOpen.value = false;
    activeNomination.value = null;

    const previousTrigger = voteTrigger;
    const previousNominationId = voteTriggerNominationId;
    voteTrigger = null;
    voteTriggerNominationId = "";

    nextTick(() => {
        if (previousTrigger?.isConnected) {
            previousTrigger.focus({ preventScroll: true });
            return;
        }

        if (previousNominationId && rootElement.value) {
            const trigger = rootElement.value.querySelector(
                '[data-nomination-id="' + previousNominationId + '"] .vote-action-button'
            );
            trigger?.focus({ preventScroll: true });
        }
    });
}

function openPicker(event) {
    if (!activeNomination.value) return;

    pickerTrigger = event?.currentTarget || null;
    pickerPage.value = 0;
    pickerGridDirection.value = 0;
    pickerOpen.value = true;

    nextTick(() => focusFirst(pickerDialog.value, pickerCloseButton.value));
}

function closePicker() {
    if (!pickerOpen.value) return;
    pickerOpen.value = false;

    nextTick(() => {
        if (pickerTrigger?.isConnected) {
            pickerTrigger.focus({ preventScroll: true });
        } else {
            rootElement.value?.querySelector(".vote-add-card .vote-button")
                ?.focus({ preventScroll: true });
        }
        pickerTrigger = null;
    });
}

function selectNominee(person) {
    const nomination = activeNomination.value;
    if (!nomination || !person) return;

    const selected = nomination.selectedId === person.id;
    nomination.selectedId = selected ? null : person.id;
    nomination.selectedFromPoolId = null;

    if (nomination.type === "image") {
        nomination.suggestionMode = "idle";
        nomination.suggestionDraft = "";
        nomination.suggestedText = "";
    }
}

function toggleDuo(pair) {
    const nomination = activeNomination.value;
    if (!nomination) return;
    nomination.selectedPairId = nomination.selectedPairId === pair.id ? null : pair.id;
}

function togglePoolNominee(event) {
    const nomination = activeNomination.value;
    if (!nomination) return;

    if (nomination.selectedFromPoolId) {
        nomination.selectedFromPoolId = null;
        nomination.selectedId = null;
        return;
    }

    openPicker(event);
}

function choosePoolNominee(person) {
    const nomination = activeNomination.value;
    if (!nomination || !person) return;

    nomination.selectedId = person.id;
    nomination.selectedFromPoolId = person.id;
    closePicker();
}

function editSuggestion() {
    const nomination = activeNomination.value;
    if (!nomination) return;

    if (nomination.suggestionMode === "voted") {
        nomination.suggestionMode = "idle";
        nomination.suggestionDraft = "";
        nomination.suggestedText = "";
        return;
    }

    nomination.suggestionMode = "editing";
    nomination.suggestionDraft = "";
    nomination.selectedId = null;

    nextTick(() => suggestionInput.value?.focus({ preventScroll: true }));
}

function selectSuggestion() {
    const nomination = activeNomination.value;
    if (!nomination) return;

    const value = String(nomination.suggestionDraft || "").trim();
    if (!value) return;

    nomination.suggestedText = value;
    nomination.suggestionDraft = value;
    nomination.suggestionMode = "voted";
    nomination.selectedId = null;
}

function setVotePage(direction) {
    const nomination = activeNomination.value;
    if (!nomination) return;

    const nextPage = nomination.page + direction;
    if (nextPage < 0 || nextPage > voteLastPage.value) return;

    nomination.page = nextPage;
    voteGridDirection.value = direction;
    voteGridKey.value += 1;
}

function setPickerPage(direction) {
    const nextPage = pickerPage.value + direction;
    if (nextPage < 0 || nextPage > pickerLastPage.value) return;

    pickerPage.value = nextPage;
    pickerGridDirection.value = direction;
    pickerGridKey.value += 1;
}

function clampPages() {
    if (activeNomination.value) {
        activeNomination.value.page = Math.min(
            Math.max(0, activeNomination.value.page || 0),
            voteLastPage.value
        );
    }
    pickerPage.value = Math.min(Math.max(0, pickerPage.value), pickerLastPage.value);
}

function handleKeydown(event) {
    if (event.key === "Escape") {
        if (pickerOpen.value) {
            event.preventDefault();
            closePicker();
        } else if (voteOpen.value) {
            event.preventDefault();
            closeVote();
        }
        return;
    }

    if (event.key !== "Tab") return;

    const dialog = pickerOpen.value
        ? pickerDialog.value
        : (voteOpen.value ? voteDialog.value : null);

    if (!dialog) return;

    const focusable = Array.from(dialog.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    )).filter((element) => !element.hidden && element.getClientRects().length > 0);

    if (!focusable.length) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (!dialog.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
    } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

function getBallot() {
    return nominationModel.buildBallotPayload(nominations);
}

function isComplete() {
    return nominationModel.isBallotComplete(nominations);
}

function getSnapshot() {
    return nominationModel.buildNominationSnapshot(nominations);
}

watch([voteEntries, pageSize], clampPages);
watch([availablePeople, pageSize], clampPages);

onMounted(() => {
    window.addEventListener("resize", syncPageSize);
    countdownInterval = window.setInterval(() => {
        countdownNow.value = Date.now();
    }, 60_000);
    introCarouselInterval = window.setInterval(advanceIntroMessage, 6_000);
});

onBeforeUnmount(() => {
    window.removeEventListener("resize", syncPageSize);
    if (countdownInterval !== null) {
        window.clearInterval(countdownInterval);
        countdownInterval = null;
    }
    if (introCarouselInterval !== null) {
        window.clearInterval(introCarouselInterval);
        introCarouselInterval = null;
    }
});

defineExpose({
    getBallot,
    isComplete,
    getSnapshot
});
</script>

<template>
    <section id="nominations-page" class="page-view" aria-label="Номинации 2026">
        <div class="section-page nominations-page">
            <div class="section-page-content nominations-page-content page-container">
                <section class="squash-hero" aria-labelledby="squash-hero-title">
                    <div class="squash-hero-art" aria-hidden="true"></div>
                    <div class="squash-hero-content">
                        <h1 id="squash-hero-title" class="squash-hero-title">SQUASH!</h1>
                        <p class="squash-hero-subtitle app-description">главная премия ρumρkin ρie</p>
                        <p class="squash-hero-date app-description">20.12.26</p>
                        <button
                            class="ui-button ui-button--primary squash-hero-button"
                            type="button"
                            @click="scrollToNominations"
                        >проголосовать</button>
                    </div>
                </section>

                <section class="squash-intro" aria-label="О премии SQUASH">
                    <div class="squash-partners">
                        <p class="squash-partners-label">совместно с</p>
                        <div class="squash-partners-logos" aria-label="Партнёры премии">
                            <div class="squash-partner-placeholder" aria-hidden="true"></div>
                            <div class="squash-partner-placeholder" aria-hidden="true"></div>
                            <div class="squash-partner-placeholder" aria-hidden="true"></div>
                        </div>
                    </div>

                    <section class="squash-details page-container--reading" aria-labelledby="squash-details-title">
                        <h2 id="squash-details-title" class="squash-details-title">ПОДРОБНЕЕ О ПРЕМИИ</h2>
                        <div class="squash-details-carousel">
                            <button
                                class="ui-button ui-button--secondary ui-button--icon squash-details-arrow"
                                type="button"
                                aria-label="Предыдущее сообщение"
                                @click="changeIntroMessage(-1)"
                            >
                                <svg class="lucide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="#icon-chevron-left"></use></svg>
                            </button>

                            <div class="squash-details-viewport" aria-live="polite" aria-atomic="true">
                                <Transition :name="introMessageDirection > 0 ? 'squash-message-forward' : 'squash-message-backward'" mode="out-in">
                                    <p :key="introMessageIndex" class="squash-details-message">
                                        {{ introMessages[introMessageIndex] }}
                                    </p>
                                </Transition>
                            </div>

                            <button
                                class="ui-button ui-button--secondary ui-button--icon squash-details-arrow"
                                type="button"
                                aria-label="Следующее сообщение"
                                @click="changeIntroMessage(1)"
                            >
                                <svg class="lucide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="#icon-chevron-right"></use></svg>
                            </button>
                        </div>
                    </section>
                </section>

                <header ref="nominationsAnchor" class="nominations-page-header">
                    <h1 class="section-page-title">НОМИНАЦИИ 2026</h1>
                </header>

                <div id="vote-widget" ref="rootElement" class="vote-widget" @keydown="handleKeydown">
                    <div id="vote-nominations-list" class="vote-nominations-list">
                        <div class="vote-nomination-row vote-nomination-row--featured">
                            <NominationCard
                                v-for="nomination in featuredNominations"
                                :key="nomination.id"
                                :nomination="nomination"
                                featured
                                :selected-pair="getSelectedPair(nomination)"
                                :selected-nominee="getSelectedNominee(nomination)"
                                :selected-label="getSelectedLabel(nomination)"
                                :has-selection="hasNominationSelection(nomination)"
                                @open="openVote"
                            />
                        </div>

                        <section v-if="carouselCards.length" class="vote-nomination-carousel" aria-label="Остальные номинации">
                            <div
                                :key="carouselStageKey"
                                class="vote-carousel-stage"
                                :class="{
                                    'vote-carousel-stage--forward': carouselDirection > 0,
                                    'vote-carousel-stage--backward': carouselDirection < 0
                                }"
                                aria-live="polite"
                            >
                                <NominationCard
                                    v-for="item in carouselCards"
                                    :key="item.nomination.id + '-' + item.position"
                                    :nomination="item.nomination"
                                    :carousel-position="item.position"
                                    :selected-pair="getSelectedPair(item.nomination)"
                                    :selected-nominee="getSelectedNominee(item.nomination)"
                                    :selected-label="getSelectedLabel(item.nomination)"
                                    :has-selection="hasNominationSelection(item.nomination)"
                                    @open="openVote"
                                    @slide="moveCarouselTo"
                                />

                                <div class="vote-carousel-controls">
                                    <button
                                        class="ui-button ui-button--secondary ui-button--icon vote-page-button"
                                        type="button"
                                        aria-label="Предыдущая номинация"
                                        title="Предыдущая номинация"
                                        @click="moveCarousel(-1)"
                                    >
                                        <svg class="lucide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="#icon-chevron-left"></use></svg>
                                    </button>
                                    <button
                                        class="ui-button ui-button--secondary ui-button--icon vote-page-button"
                                        type="button"
                                        aria-label="Следующая номинация"
                                        title="Следующая номинация"
                                        @click="moveCarousel(1)"
                                    >
                                        <svg class="lucide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="#icon-chevron-right"></use></svg>
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>

                    <section class="squash-countdown" aria-label="До конца премии">
                        <h2 class="squash-countdown-title">ДО КОНЦА ПРЕМИИ:</h2>
                        <p v-if="countdown.finished" class="squash-countdown-finished">ПРЕМИЯ ЗАВЕРШЕНА</p>
                        <div v-else class="squash-countdown-units" aria-live="off">
                            <div class="squash-countdown-unit">
                                <span class="squash-countdown-number">{{ countdown.days }}</span>
                                <span class="squash-countdown-label">дней</span>
                            </div>
                            <span class="squash-countdown-separator" aria-hidden="true">:</span>
                            <div class="squash-countdown-unit">
                                <span class="squash-countdown-number">{{ countdown.hours }}</span>
                                <span class="squash-countdown-label">часов</span>
                            </div>
                            <span class="squash-countdown-separator" aria-hidden="true">:</span>
                            <div class="squash-countdown-unit">
                                <span class="squash-countdown-number">{{ countdown.minutes }}</span>
                                <span class="squash-countdown-label">минут</span>
                            </div>
                        </div>
                    </section>

                    <div
                        id="vote-vote-overlay"
                        class="vote-overlay"
                        :hidden="!voteOpen"
                        @click.self="closeVote"
                    >
                        <section
                            ref="voteDialog"
                            class="vote-dialog vote-dialog--nomination"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="vote-vote-title"
                            tabindex="-1"
                            @click.stop
                        >
                            <header class="vote-dialog-header">
                                <p class="vote-dialog-eyebrow">номинация</p>
                                <h2 id="vote-vote-title" class="vote-dialog-title">
                                    {{ activeNomination?.title || "" }}
                                </h2>
                            </header>

                            <div class="vote-grid-viewport">
                                <div
                                    id="vote-nomination-grid"
                                    :key="voteGridKey"
                                    class="vote-grid vote-nomination-grid"
                                    :class="{
                                        'vote-slide-from-right': voteGridDirection > 0,
                                        'vote-slide-from-left': voteGridDirection < 0
                                    }"
                                >
                                    <template v-for="entry in pagedVoteEntries" :key="getEntryKey(entry)">
                                        <article v-if="activeNomination?.type === 'duo'" class="vote-candidate-card vote-duo-card">
                                            <div class="vote-duo-avatars">
                                                <NomineeVisual :person="entry.first" mode="avatar"/>
                                                <span class="vote-duo-plus" aria-hidden="true">+</span>
                                                <NomineeVisual :person="entry.second" mode="avatar"/>
                                            </div>
                                            <p class="vote-candidate-name">{{ entry.first.name }} + {{ entry.second.name }}</p>
                                            <button
                                                class="ui-button vote-button"
                                                :class="activeNomination.selectedPairId === entry.id ? 'ui-button--secondary' : 'ui-button--primary'"
                                                type="button"
                                                :aria-pressed="activeNomination.selectedPairId === entry.id ? 'true' : undefined"
                                                @click="toggleDuo(entry)"
                                            >
                                                {{ activeNomination.selectedPairId === entry.id ? "отменить голос" : "проголосовать" }}
                                            </button>
                                        </article>

                                        <article v-else-if="entry.type === 'suggest-other'" class="vote-candidate-card vote-suggest-card">
                                            <div class="vote-suggest-symbol" aria-hidden="true">
                                                <svg class="lucide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
                                            </div>
                                            <div class="vote-suggest-details">
                                                <input
                                                    v-if="activeNomination.suggestionMode === 'editing'"
                                                    ref="suggestionInput"
                                                    v-model="activeNomination.suggestionDraft"
                                                    class="vote-suggest-input"
                                                    type="text"
                                                    maxlength="80"
                                                    autocomplete="off"
                                                    placeholder="твой вариант"
                                                    aria-label="свой вариант номинанта"
                                                    @keydown.enter.prevent="selectSuggestion"
                                                >
                                                <p
                                                    v-else
                                                    class="vote-suggest-text"
                                                    :class="{ 'vote-candidate-name': activeNomination.suggestionMode === 'voted' }"
                                                >
                                                    {{ activeNomination.suggestionMode === "voted" ? activeNomination.suggestedText : "предложить вариант" }}
                                                </p>
                                            </div>
                                            <button
                                                class="ui-button vote-button"
                                                :class="activeNomination.suggestionMode === 'voted' ? 'ui-button--secondary' : 'ui-button--primary'"
                                                type="button"
                                                :disabled="activeNomination.suggestionMode === 'editing' && !String(activeNomination.suggestionDraft || '').trim()"
                                                :aria-pressed="activeNomination.suggestionMode === 'voted' ? 'true' : undefined"
                                                @click="activeNomination.suggestionMode === 'editing' ? selectSuggestion() : editSuggestion()"
                                            >
                                                {{ activeNomination.suggestionMode === "editing" ? "выбрать этот вариант" : (activeNomination.suggestionMode === "voted" ? "отменить голос" : "предложить другое") }}
                                            </button>
                                        </article>

                                        <article v-else-if="entry.type === 'add-card'" class="vote-candidate-card vote-add-card">
                                            <div
                                                class="vote-add-symbol"
                                                :class="{ 'vote-add-symbol--round': ['pumpkin-king', 'pumpkin-queen'].includes(activeNomination.id) }"
                                                aria-hidden="true"
                                            >
                                                <svg class="lucide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
                                            </div>
                                            <div class="vote-add-details">
                                                <p
                                                    class="vote-candidate-name"
                                                    :class="{ 'vote-candidate-name--label': !activeNomination.selectedFromPoolId }"
                                                >
                                                    {{ activeNomination.selectedFromPoolId ? nomineeById.get(activeNomination.selectedFromPoolId)?.name : "добавить номинанта" }}
                                                </p>
                                            </div>
                                            <button
                                                class="ui-button vote-button"
                                                :class="activeNomination.selectedFromPoolId ? 'ui-button--secondary' : 'ui-button--primary'"
                                                type="button"
                                                :aria-pressed="activeNomination.selectedFromPoolId ? 'true' : undefined"
                                                @click="togglePoolNominee($event)"
                                            >
                                                {{ activeNomination.selectedFromPoolId ? "отменить голос" : "добавить" }}
                                            </button>
                                        </article>

                                        <article v-else class="vote-candidate-card">
                                            <NomineeVisual
                                                :person="entry"
                                                :mode="activeNomination?.type === 'image' ? 'image' : 'avatar'"
                                            />
                                            <p class="vote-candidate-name">{{ entry.name }}</p>
                                            <button
                                                class="ui-button vote-button"
                                                :class="activeNomination.selectedId === entry.id ? 'ui-button--secondary' : 'ui-button--primary'"
                                                type="button"
                                                :aria-pressed="activeNomination.selectedId === entry.id ? 'true' : undefined"
                                                @click="selectNominee(entry)"
                                            >
                                                {{ activeNomination.selectedId === entry.id ? "отменить голос" : "проголосовать" }}
                                            </button>
                                        </article>
                                    </template>
                                </div>
                            </div>

                            <footer class="vote-dialog-footer">
                                <button
                                    id="vote-nomination-prev"
                                    class="ui-button ui-button--secondary ui-button--icon vote-page-button"
                                    type="button"
                                    aria-label="Предыдущие номинанты"
                                    :disabled="votePreviousDisabled"
                                    @click="setVotePage(-1)"
                                >
                                    <svg class="lucide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="#icon-chevron-left"></use></svg>
                                </button>
                                <button
                                    id="vote-vote-close"
                                    ref="voteCloseButton"
                                    class="ui-button ui-button--secondary vote-close-button"
                                    type="button"
                                    @click="closeVote"
                                >закрыть</button>
                                <button
                                    id="vote-nomination-next"
                                    class="ui-button ui-button--secondary ui-button--icon vote-page-button"
                                    type="button"
                                    aria-label="Следующие номинанты"
                                    :disabled="voteNextDisabled"
                                    @click="setVotePage(1)"
                                >
                                    <svg class="lucide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="#icon-chevron-right"></use></svg>
                                </button>
                            </footer>
                        </section>
                    </div>

                    <div
                        id="vote-picker-overlay"
                        class="vote-overlay vote-picker-overlay"
                        :hidden="!pickerOpen"
                        @click.self="closePicker"
                    >
                        <section
                            ref="pickerDialog"
                            class="vote-dialog"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="vote-picker-title"
                            tabindex="-1"
                            @click.stop
                        >
                            <header class="vote-dialog-header">
                                <p class="vote-dialog-eyebrow">добавить номинанта</p>
                                <h2 id="vote-picker-title" class="vote-dialog-title">
                                    добавить номинанта
                                </h2>
                            </header>
                            <div class="vote-grid-viewport">
                                <div
                                    id="vote-picker-grid"
                                    :key="pickerGridKey"
                                    class="vote-grid"
                                    :hidden="availablePeople.length === 0"
                                    :class="{
                                        'vote-slide-from-right': pickerGridDirection > 0,
                                        'vote-slide-from-left': pickerGridDirection < 0
                                    }"
                                >
                                    <article v-for="person in pagedPickerPeople" :key="person.id" class="vote-candidate-card">
                                        <NomineeVisual :person="person" mode="avatar"/>
                                        <p class="vote-candidate-name">{{ person.name }}</p>
                                        <button
                                            class="ui-button ui-button--primary vote-button"
                                            type="button"
                                            @click="choosePoolNominee(person)"
                                        >добавить</button>
                                    </article>
                                </div>
                                <p v-if="availablePeople.length === 0" id="vote-picker-empty" class="vote-empty-state">
                                    все подходящие участники уже добавлены
                                </p>
                            </div>
                            <footer class="vote-dialog-footer">
                                <button
                                    id="vote-picker-prev"
                                    class="ui-button ui-button--secondary ui-button--icon vote-page-button"
                                    type="button"
                                    aria-label="Предыдущие участники"
                                    :disabled="pickerPreviousDisabled"
                                    @click="setPickerPage(-1)"
                                >
                                    <svg class="lucide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="#icon-chevron-left"></use></svg>
                                </button>
                                <button
                                    id="vote-picker-close"
                                    ref="pickerCloseButton"
                                    class="ui-button ui-button--secondary vote-close-button"
                                    type="button"
                                    @click="closePicker"
                                >назад</button>
                                <button
                                    id="vote-picker-next"
                                    class="ui-button ui-button--secondary ui-button--icon vote-page-button"
                                    type="button"
                                    aria-label="Следующие участники"
                                    :disabled="pickerNextDisabled"
                                    @click="setPickerPage(1)"
                                >
                                    <svg class="lucide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="#icon-chevron-right"></use></svg>
                                </button>
                            </footer>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
