/* SplitEvents nomination voting interface. */
import {
    NOMINEES,
    nomineeById,
    compareNames,
    createNominationState
} from "./nominations/data.js?v=20261126-1";

const DESKTOP_PAGE_SIZE = 3;
const MOBILE_PAGE_SIZE = 2;

function getPageSize() {
    if (typeof window.matchMedia === "function") {
        return window.matchMedia("(max-width: 760px), (pointer: coarse)").matches
            ? MOBILE_PAGE_SIZE
            : DESKTOP_PAGE_SIZE;
    }

    return Number(window.innerWidth) <= 760
        ? MOBILE_PAGE_SIZE
        : DESKTOP_PAGE_SIZE;
}
const compareNames = function (first, second) {
    return first.name.localeCompare(second.name, "en", {
        sensitivity: "base",
        numeric: true
    });
};
const genderOrder = { F: 0, M: 1, I: 2 };

NOMINEES.sort(function (first, second) {
    return genderOrder[first.gender] - genderOrder[second.gender]
        || compareNames(first, second);
});

const nomineeById = new Map(NOMINEES.map(function (person) {
    return [person.id, person];
}));


export function createNominationsWidget(root) {
    if (!root || root.dataset.initialized === "true") return null;
    root.dataset.initialized = "true";

    const NOMINATIONS = createNominationState();

    const $ = function (selector) {
        return root.querySelector(selector);
    };

    const nominationsList = $("#vote-nominations-list");
    const voteOverlay = $("#vote-vote-overlay");
    const voteTitle = $("#vote-vote-title");
    const voteCloseButton = $("#vote-vote-close");
    const nominationGrid = $("#vote-nomination-grid");
    const nominationPrevButton = $("#vote-nomination-prev");
    const nominationNextButton = $("#vote-nomination-next");

    const pickerOverlay = $("#vote-picker-overlay");
    const pickerTitle = $("#vote-picker-title");
    const pickerCloseButton = $("#vote-picker-close");
    const pickerGrid = $("#vote-picker-grid");
    const pickerEmpty = $("#vote-picker-empty");
    const pickerPrevButton = $("#vote-picker-prev");
    const pickerNextButton = $("#vote-picker-next");

    const requiredElements = [
        nominationsList, voteOverlay, voteTitle, voteCloseButton,
        nominationGrid, nominationPrevButton, nominationNextButton,
        pickerOverlay, pickerTitle, pickerCloseButton, pickerGrid, pickerEmpty,
        pickerPrevButton, pickerNextButton
    ];

    if (requiredElements.some(function (element) { return !element; })) {
        console.error("Nominations: required widget elements are missing.");
        root.dataset.initialized = "false";
        return null;
    }

    let activeNomination = null;
    let pickerPage = 0;
    let carouselIndex = 0;

    function imageUrl(value) {
        if (!value) return "";
        const match = value.match(/\/file\/d\/([\w-]+)/)
            || value.match(/[?&]id=([\w-]+)/);
        return match
            ? "https://drive.google.com/uc?export=view&id=" + match[1]
            : value;
    }

    function initials(name) {
        return String(name || "").slice(0, 2).toLocaleUpperCase("en");
    }

    function visualElement(person, imageMode) {
        const className = imageMode ? "vote-image-avatar" : "vote-avatar";
        const fallbackClass = imageMode
            ? "vote-image-placeholder"
            : "vote-avatar-placeholder";
        const url = imageUrl(person.avatar);

        if (url) {
            const image = document.createElement("img");
            image.className = className;
            image.src = url;
            image.alt = (imageMode ? "Изображение " : "Аватар ") + person.name;
            image.loading = "lazy";
            image.referrerPolicy = "no-referrer";
            image.addEventListener("error", function () {
                const fallback = document.createElement("div");
                fallback.className = fallbackClass;
                fallback.textContent = initials(person.name);
                image.replaceWith(fallback);
            }, { once: true });
            return image;
        }

        const placeholder = document.createElement("div");
        placeholder.className = fallbackClass;
        placeholder.textContent = initials(person.name);
        return placeholder;
    }

    function getDuoPairs(nomination) {
        return (nomination.duoPairs || []).map(function (pair) {
            return {
                id: pair.id,
                first: nomineeById.get(pair.firstId),
                second: nomineeById.get(pair.secondId)
            };
        }).filter(function (pair) {
            return pair.first && pair.second;
        }).sort(function (first, second) {
            return compareNames(first.first, second.first)
                || compareNames(first.second, second.second);
        });
    }

    function selectedDuo(nomination) {
        if (!nomination || nomination.type !== "duo" || !nomination.selectedPairId) {
            return null;
        }
        return getDuoPairs(nomination).find(function (pair) {
            return pair.id === nomination.selectedPairId;
        }) || null;
    }

    function makeDuoLogoPart(person) {
        const element = visualElement(person, false);
        element.classList.add("vote-duo-logo-part");
        return element;
    }

    function renderNominationLogo(nomination, wrap) {
        if (nomination.type === "duo") {
            const pair = selectedDuo(nomination);
            if (pair) {
                const duoLogo = document.createElement("div");
                duoLogo.className = "vote-duo-logo";
                duoLogo.appendChild(makeDuoLogoPart(pair.first));
                duoLogo.appendChild(makeDuoLogoPart(pair.second));
                wrap.replaceChildren(duoLogo);
                return;
            }
        }

        const personId = nomination.selectedId || nomination.selectedFromPoolId;
        const person = personId ? nomineeById.get(personId) : null;
        const isImageNomination = nomination.type === "image" || nomination.type === "fixed";

        if (person) {
            const visual = visualElement(person, isImageNomination);
            visual.classList.add("vote-nomination-logo");
            wrap.replaceChildren(visual);
            return;
        }

        const placeholder = document.createElement("div");
        placeholder.className = "vote-logo-placeholder";
        placeholder.textContent = "★";
        placeholder.setAttribute("aria-hidden", "true");
        wrap.replaceChildren(placeholder);
    }

    function nominationHasVote(nomination) {
        if (nomination.type === "duo") {
            return Boolean(nomination.selectedPairId)
                && getDuoPairs(nomination).some(function (pair) {
                    return pair.id === nomination.selectedPairId;
                });
        }

        if (nomination.type === "image") {
            if (nomination.suggestionMode === "voted") {
                return Boolean((nomination.suggestedText || "").trim());
            }
            return Boolean(nomination.selectedId)
                && nomination.nomineeIds.includes(nomination.selectedId);
        }

        return Boolean(
            (nomination.selectedId && nomineeById.has(nomination.selectedId))
            || (nomination.selectedFromPoolId && nomineeById.has(nomination.selectedFromPoolId))
        );
    }

    function isBallotComplete() {
        return NOMINATIONS.length > 0 && NOMINATIONS.every(nominationHasVote);
    }

    function buildBallotPayload() {
        return {
            createdAt: new Date().toISOString(),
            nominations: NOMINATIONS.map(function (nomination) {
                if (nomination.type === "duo") {
                    const pair = getDuoPairs(nomination).find(function (item) {
                        return item.id === nomination.selectedPairId;
                    });
                    return {
                        id: nomination.id,
                        title: nomination.title,
                        type: "duo",
                        selection: pair ? {
                            pairId: pair.id,
                            nominees: [pair.first.name, pair.second.name]
                        } : null
                    };
                }

                if (nomination.type === "image" && nomination.suggestionMode === "voted") {
                    return {
                        id: nomination.id,
                        title: nomination.title,
                        type: "image",
                        selection: {
                            kind: "suggestion",
                            value: nomination.suggestedText.trim()
                        }
                    };
                }

                const personId = nomination.selectedId || nomination.selectedFromPoolId;
                const person = personId ? nomineeById.get(personId) : null;
                return {
                    id: nomination.id,
                    title: nomination.title,
                    type: nomination.type || "individual",
                    selection: person ? {
                        kind: "nominee",
                        nomineeId: person.id,
                        nomineeName: person.name,
                        addedFromCommonPool: Boolean(nomination.selectedFromPoolId)
                    } : null
                };
            })
        };
    }

    function createActionButton(label, selected, extraClass) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "ui-button "
            + (selected ? "ui-button--secondary" : "ui-button--primary");
        if (extraClass) button.classList.add(extraClass);
        button.textContent = label;
        if (selected) button.setAttribute("aria-pressed", "true");
        return button;
    }

    function createNominationCard(nomination, featured, carouselPosition) {
        const card = document.createElement("article");
        card.className = "vote-nomination-card"
            + (featured ? " vote-nomination-card--featured" : "");
        if (carouselPosition) {
            card.classList.add("vote-carousel-card", "vote-carousel-card--" + carouselPosition);
        }
        card.dataset.nominationId = nomination.id;
        card.setAttribute("aria-labelledby", "vote-title-" + nomination.id);

        const logoWrap = document.createElement("div");
        logoWrap.className = "vote-logo-wrap";
        renderNominationLogo(nomination, logoWrap);
        card.appendChild(logoWrap);

        const title = document.createElement("h3");
        title.className = "vote-nomination-title";
        title.id = "vote-title-" + nomination.id;
        title.textContent = nomination.title;
        card.appendChild(title);

        const pair = selectedDuo(nomination);
        const personId = nomination.selectedId || nomination.selectedFromPoolId;
        const person = personId ? nomineeById.get(personId) : null;
        const selectedLabel = pair
            ? pair.first.name + " + " + pair.second.name
            : (person
                ? person.name
                : (nomination.suggestionMode === "voted" ? nomination.suggestedText : ""));

        const selected = document.createElement("p");
        selected.className = "vote-selected-nominee";
        selected.hidden = !selectedLabel;
        selected.textContent = selectedLabel;
        card.appendChild(selected);

        const hasSelection = Boolean(pair || person || nomination.suggestionMode === "voted");
        const button = createActionButton(
            hasSelection ? "Изменить выбор" : "Выбрать номинанта",
            hasSelection,
            "vote-action-button"
        );
        button.addEventListener("click", function () {
            if (carouselPosition) {
                const items = NOMINATIONS.slice(2);
                const nextIndex = items.findIndex(function (item) {
                    return item.id === nomination.id;
                });
                if (nextIndex >= 0 && nextIndex !== carouselIndex) {
                    const direction = nextIndex === (carouselIndex + 1) % items.length ? 1 : -1;
                    carouselIndex = nextIndex;
                    renderNominationCards(direction);
                }
            }
            openVote(nomination);
        });
        card.appendChild(button);

        if (carouselPosition && carouselPosition !== "current") {
            card.addEventListener("click", function (event) {
                if (event.target.closest("button")) return;
                const items = NOMINATIONS.slice(2);
                const nextIndex = items.findIndex(function (item) {
                    return item.id === nomination.id;
                });
                if (nextIndex >= 0) {
                    const direction = nextIndex === (carouselIndex + 1) % items.length ? 1 : -1;
                    carouselIndex = nextIndex;
                    renderNominationCards(direction);
                }
            });
        }

        return card;
    }

    function renderNominationCards(direction) {
        const featuredRow = document.createElement("div");
        featuredRow.className = "vote-nomination-row vote-nomination-row--featured";
        NOMINATIONS.slice(0, 2).forEach(function (nomination) {
            featuredRow.appendChild(createNominationCard(nomination, true, null));
        });

        const carousel = document.createElement("section");
        carousel.className = "vote-nomination-carousel";
        carousel.setAttribute("aria-label", "Остальные номинации");

        const stage = document.createElement("div");
        stage.className = "vote-carousel-stage";
        if (direction > 0) stage.classList.add("vote-carousel-stage--forward");
        if (direction < 0) stage.classList.add("vote-carousel-stage--backward");
        stage.setAttribute("aria-live", "polite");
        const items = NOMINATIONS.slice(2);
        const total = items.length;

        [-1, 0, 1].forEach(function (offset) {
            const index = (carouselIndex + offset + total) % total;
            const position = offset === 0
                ? "current"
                : (offset < 0 ? "previous" : "next");
            stage.appendChild(createNominationCard(items[index], false, position));
        });

        const controls = document.createElement("div");
        controls.className = "vote-carousel-controls";

        const previous = createActionButton("‹", false, "vote-page-button");
        previous.classList.add("ui-button--icon");
        previous.setAttribute("aria-label", "Предыдущая номинация");
        previous.addEventListener("click", function () {
            carouselIndex = (carouselIndex - 1 + total) % total;
            renderNominationCards(-1);
        });

        const next = createActionButton("›", false, "vote-page-button");
        next.classList.add("ui-button--icon");
        next.setAttribute("aria-label", "Следующая номинация");
        next.addEventListener("click", function () {
            carouselIndex = (carouselIndex + 1) % total;
            renderNominationCards(1);
        });

        controls.append(previous, next);
        carousel.append(stage, controls);
        nominationsList.replaceChildren(featuredRow, carousel);
    }

    function makePersonCard(person, label, onClick, selected, imageMode) {
        const card = document.createElement("article");
        card.className = "vote-candidate-card";
        card.appendChild(visualElement(person, Boolean(imageMode)));

        const name = document.createElement("p");
        name.className = "vote-candidate-name";
        name.textContent = person.name;
        card.appendChild(name);

        const button = createActionButton(
            label,
            Boolean(selected),
            "vote-button"
        );
        button.addEventListener("click", onClick);
        card.appendChild(button);
        return card;
    }

    function makeDuoCard(pair) {
        const card = document.createElement("article");
        card.className = "vote-candidate-card vote-duo-card";

        const avatars = document.createElement("div");
        avatars.className = "vote-duo-avatars";
        avatars.appendChild(visualElement(pair.first, false));

        const plus = document.createElement("span");
        plus.className = "vote-duo-plus";
        plus.textContent = "+";
        plus.setAttribute("aria-hidden", "true");
        avatars.appendChild(plus);
        avatars.appendChild(visualElement(pair.second, false));
        card.appendChild(avatars);

        const name = document.createElement("p");
        name.className = "vote-candidate-name";
        name.textContent = pair.first.name + " + " + pair.second.name;
        card.appendChild(name);

        const selected = activeNomination.selectedPairId === pair.id;
        const button = createActionButton(
            selected ? "Отменить голос" : "Проголосовать",
            selected,
            "vote-button"
        );
        button.addEventListener("click", function () {
            activeNomination.selectedPairId = selected ? null : pair.id;
            renderNominationCards();
            renderVoteGrid();
        });
        card.appendChild(button);
        return card;
    }

    function makeAddCard() {
        const card = document.createElement("article");
        card.className = "vote-candidate-card vote-add-card";

        const plus = document.createElement("div");
        plus.className = "vote-add-symbol";
        if (["pumpkin-king", "pumpkin-queen", "nextgen"].includes(activeNomination.id)) {
            plus.classList.add("vote-add-symbol--round");
        }
        plus.textContent = "+";
        plus.setAttribute("aria-hidden", "true");
        card.appendChild(plus);

        const details = document.createElement("div");
        details.className = "vote-add-details";
        const selectedPerson = activeNomination.selectedFromPoolId
            ? nomineeById.get(activeNomination.selectedFromPoolId)
            : null;
        const selectedName = document.createElement("p");
        selectedName.className = "vote-candidate-name";
        selectedName.textContent = selectedPerson ? selectedPerson.name : "Добавить номинанта";
        details.appendChild(selectedName);
        card.appendChild(details);

        const button = createActionButton(
            selectedPerson ? "Отменить голос" : "Добавить",
            Boolean(selectedPerson),
            "vote-button"
        );
        button.addEventListener("click", function () {
            if (activeNomination.selectedFromPoolId) {
                activeNomination.selectedFromPoolId = null;
                activeNomination.selectedId = null;
                renderNominationCards();
                renderVoteGrid();
            } else {
                openPicker();
            }
        });
        card.appendChild(button);
        return card;
    }

    function makeSuggestOtherCard() {
        const card = document.createElement("article");
        card.className = "vote-candidate-card vote-suggest-card";

        const plus = document.createElement("div");
        plus.className = "vote-suggest-symbol";
        plus.textContent = "+";
        plus.setAttribute("aria-hidden", "true");
        card.appendChild(plus);

        const details = document.createElement("div");
        details.className = "vote-suggest-details";
        const mode = activeNomination.suggestionMode || "idle";

        if (mode === "editing") {
            const input = document.createElement("input");
            input.className = "vote-suggest-input";
            input.type = "text";
            input.maxLength = 80;
            input.autocomplete = "off";
            input.placeholder = "Твой вариант";
            input.value = activeNomination.suggestionDraft || "";
            input.setAttribute("aria-label", "Свой вариант номинанта");
            details.appendChild(input);

            const button = createActionButton(
                "Выбрать этот вариант",
                false,
                "vote-button"
            );
            button.disabled = !input.value.trim();
            button.addEventListener("click", function () {
                const value = input.value.trim();
                if (!value) return;
                activeNomination.suggestedText = value;
                activeNomination.suggestionDraft = value;
                activeNomination.suggestionMode = "voted";
                activeNomination.selectedId = null;
                renderNominationCards();
                renderVoteGrid();
            });

            input.addEventListener("input", function () {
                activeNomination.suggestionDraft = input.value;
                button.disabled = !input.value.trim();
            });
            input.addEventListener("keydown", function (event) {
                if (event.key === "Enter" && !button.disabled) button.click();
            });

            card.appendChild(details);
            card.appendChild(button);
            return card;
        }

        const display = document.createElement("p");
        display.className = "vote-suggest-text";
        display.textContent = mode === "voted" ? activeNomination.suggestedText : "Предложить вариант";
        details.appendChild(display);
        card.appendChild(details);

        const button = createActionButton(
            mode === "voted" ? "Отменить голос" : "Предложить другое",
            mode === "voted",
            "vote-button"
        );
        button.addEventListener("click", function () {
            if (activeNomination.suggestionMode === "voted") {
                activeNomination.suggestionMode = "idle";
                activeNomination.suggestionDraft = "";
                activeNomination.suggestedText = "";
                renderNominationCards();
                renderVoteGrid();
            } else {
                activeNomination.suggestionMode = "editing";
                activeNomination.suggestionDraft = "";
                renderVoteGrid();
                const input = nominationGrid.querySelector(".vote-suggest-input");
                if (input) input.focus();
            }
        });
        card.appendChild(button);
        return card;
    }

    function getVoteEntries() {
        if (activeNomination.type === "duo") {
            return getDuoPairs(activeNomination);
        }

        const people = activeNomination.nomineeIds
            .map(function (id) { return nomineeById.get(id); })
            .filter(function (person) {
                return person
                    && (!activeNomination.gender || person.gender === activeNomination.gender);
            })
            .sort(compareNames);

        if (activeNomination.type === "image") {
            return people.concat([{ type: "suggest-other" }]);
        }
        if (activeNomination.type === "fixed") {
            return people.concat([{ type: "add-card" }]);
        }
        return people.concat([{ type: "add-card" }]);
    }

    function updatePager(previousButton, nextButton, page, count) {
        const pageSize = getPageSize();
        const pages = Math.max(1, Math.ceil(count / pageSize));
        previousButton.disabled = count === 0 || page <= 0;
        nextButton.disabled = count === 0 || page >= pages - 1;
    }

    function animateGrid(element, direction) {
        element.classList.remove("vote-slide-from-right", "vote-slide-from-left");
        if (!direction) return;
        void element.offsetWidth;
        element.classList.add(
            direction > 0 ? "vote-slide-from-right" : "vote-slide-from-left"
        );
    }

    function renderVoteGrid(direction) {
        if (!activeNomination) return;

        const fragment = document.createDocumentFragment();
        const entries = getVoteEntries();
        const pageSize = getPageSize();
        const lastPage = Math.max(0, Math.ceil(entries.length / pageSize) - 1);
        activeNomination.page = Math.min(Math.max(activeNomination.page, 0), lastPage);
        const start = activeNomination.page * pageSize;

        entries.slice(start, start + pageSize).forEach(function (entry) {
            if (activeNomination.type === "duo") {
                fragment.appendChild(makeDuoCard(entry));
                return;
            }

            if (entry.type === "suggest-other") {
                fragment.appendChild(makeSuggestOtherCard());
                return;
            }

            if (entry.type === "add-card") {
                fragment.appendChild(makeAddCard());
                return;
            }

            const isSelected = activeNomination.selectedId === entry.id;
            const imageMode = activeNomination.type === "image";
            fragment.appendChild(makePersonCard(
                entry,
                isSelected ? "Отменить голос" : "Проголосовать",
                function () {
                    activeNomination.selectedId = isSelected ? null : entry.id;
                    activeNomination.selectedFromPoolId = null;
                    if (imageMode) {
                        activeNomination.suggestionMode = "idle";
                        activeNomination.suggestionDraft = "";
                        activeNomination.suggestedText = "";
                    }
                    renderNominationCards();
                    renderVoteGrid();
                },
                isSelected,
                imageMode
            ));
        });

        nominationGrid.replaceChildren(fragment);
        updatePager(
            nominationPrevButton,
            nominationNextButton,
            activeNomination.page,
            entries.length
        );
        animateGrid(nominationGrid, direction || 0);
    }

    function availablePeople() {
        const presetIds = new Set(activeNomination.nomineeIds || []);
        return NOMINEES.filter(function (person) {
            return (!activeNomination.gender || person.gender === activeNomination.gender)
                && !presetIds.has(person.id)
                && person.id !== activeNomination.selectedFromPoolId;
        });
    }

    function renderPickerGrid(direction) {
        const available = availablePeople();
        const fragment = document.createDocumentFragment();
        pickerEmpty.hidden = available.length > 0;
        pickerGrid.hidden = available.length === 0;

        const pageSize = getPageSize();
        const lastPage = Math.max(0, Math.ceil(available.length / pageSize) - 1);
        pickerPage = Math.min(Math.max(pickerPage, 0), lastPage);
        const start = pickerPage * pageSize;

        available.slice(start, start + pageSize).forEach(function (person) {
            fragment.appendChild(makePersonCard(
                person,
                "Добавить",
                function () {
                    activeNomination.selectedId = person.id;
                    activeNomination.selectedFromPoolId = person.id;
                    renderNominationCards();
                    renderVoteGrid();
                    closePicker();
                },
                false,
                false
            ));
        });

        pickerGrid.replaceChildren(fragment);
        updatePager(pickerPrevButton, pickerNextButton, pickerPage, available.length);
        animateGrid(pickerGrid, direction || 0);
    }

    function openVote(nomination) {
        activeNomination = nomination;
        voteTitle.textContent = nomination.title;

        renderVoteGrid(0);
        voteOverlay.hidden = false;
        const firstButton = nominationGrid.querySelector("button:not(:disabled)");
        (firstButton || voteCloseButton).focus();
    }

    function closeVote() {
        voteOverlay.hidden = true;
        if (activeNomination) {
            const selector = '[data-nomination-id="' + activeNomination.id + '"] .vote-action-button';
            const trigger = root.querySelector(selector);
            if (trigger) trigger.focus();
        }
    }

    function openPicker() {
        pickerPage = 0;
        pickerTitle.textContent = activeNomination.title;
        renderPickerGrid(0);
        pickerOverlay.hidden = false;
        const firstButton = pickerGrid.querySelector("button:not(:disabled)");
        (firstButton || pickerCloseButton).focus();
    }

    function closePicker() {
        pickerOverlay.hidden = true;
        if (!voteOverlay.hidden) {
            const addButton = nominationGrid.querySelector(".vote-add-card .vote-button");
            (addButton || voteCloseButton).focus();
        }
    }

    function buildNominationSnapshot() {
        return NOMINATIONS.map(function (nomination) {
            const pair = selectedDuo(nomination);
            const selectedId = nomination.selectedId || nomination.selectedFromPoolId;
            return {
                id: nomination.id,
                title: nomination.title,
                type: nomination.type || "individual",
                eligibleNominees: nomination.type === "duo" ? [] : [
                    ...nomination.nomineeIds.map(function (id) {
                        return nomineeById.get(id);
                    }).filter(Boolean),
                    ...(nomination.selectedFromPoolId
                        ? [nomineeById.get(nomination.selectedFromPoolId)].filter(Boolean)
                        : [])
                ],
                eligiblePairs: nomination.type === "duo"
                    ? getDuoPairs(nomination).map(function (item) {
                        return { id: item.id, first: item.first, second: item.second };
                    })
                    : [],
                selectedNominee: selectedId ? nomineeById.get(selectedId) || null : null,
                selectedSuggestion: nomination.suggestionMode === "voted"
                    ? nomination.suggestedText
                    : null,
                selectedPair: pair
                    ? { id: pair.id, first: pair.first, second: pair.second }
                    : null
            };
        });
    }

    voteCloseButton.addEventListener("click", closeVote);
    pickerCloseButton.addEventListener("click", closePicker);

    nominationPrevButton.addEventListener("click", function () {
        if (activeNomination && activeNomination.page > 0) {
            activeNomination.page--;
            renderVoteGrid(-1);
        }
    });

    nominationNextButton.addEventListener("click", function () {
        if (!activeNomination) return;
        const count = getVoteEntries().length;
        const lastPage = Math.ceil(count / getPageSize()) - 1;
        if (activeNomination.page < lastPage) {
            activeNomination.page++;
            renderVoteGrid(1);
        }
    });

    pickerPrevButton.addEventListener("click", function () {
        if (pickerPage > 0) {
            pickerPage--;
            renderPickerGrid(-1);
        }
    });

    pickerNextButton.addEventListener("click", function () {
        const lastPage = Math.ceil(availablePeople().length / getPageSize()) - 1;
        if (pickerPage < lastPage) {
            pickerPage++;
            renderPickerGrid(1);
        }
    });

    window.addEventListener("resize", function () {
        if (activeNomination && !voteOverlay.hidden) {
            renderVoteGrid(0);
        }
        if (!pickerOverlay.hidden) {
            renderPickerGrid(0);
        }
    });

    voteOverlay.addEventListener("click", function (event) {
        if (event.target === voteOverlay) closeVote();
    });

    pickerOverlay.addEventListener("click", function (event) {
        if (event.target === pickerOverlay) closePicker();
    });

    root.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") return;
        if (!pickerOverlay.hidden) closePicker();
        else if (!voteOverlay.hidden) closeVote();
    });

    window.SPLITEVENTS_NOMINEES = NOMINEES;
    window.SPLITEVENTS_NOMINATIONS = buildNominationSnapshot;

    renderNominationCards();

    return {
        getBallot: buildBallotPayload,
        isComplete: isBallotComplete
    };
}
