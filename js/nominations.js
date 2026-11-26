/* SplitEvents nomination voting interface. */

const NOMINEES = [
    { id: "fridayisyourday", name: "fridayisyourday", gender: "M", avatar: "" },
    { id: "burgomister", name: "Burgomister", gender: "M", avatar: "" },
    { id: "holydark", name: "HolyDark", gender: "F", avatar: "" },
    { id: "cyathere", name: "cyathere", gender: "F", avatar: "" },
    { id: "vale", name: "Vale", gender: "F", avatar: "" },
    { id: "theriazon", name: "theriazon", gender: "M", avatar: "" },
    { id: "otorgy", name: "Otorgy", gender: "M", avatar: "" },
    { id: "skatpoint", name: "skatpoint", gender: "M", avatar: "" },
    { id: "fork", name: "fork", gender: "F", avatar: "" },
    { id: "dlv1190", name: "DLV1190", gender: "M", avatar: "" },
    { id: "isada", name: "Isada", gender: "M", avatar: "" },
    { id: "yaarbuzik", name: "yaarbuzik", gender: "M", avatar: "" },
    { id: "tr1ckl", name: "tr1ckl", gender: "M", avatar: "" },
    { id: "don-burger", name: "Дон Бургер", gender: "I", avatar: "" },
    { id: "backrooms", name: "BACKROOMS", gender: "I", avatar: "" },
    { id: "burgomister-42", name: "Burgomister 42", gender: "I", avatar: "" },
    { id: "fridayisyourday-42", name: "fridayisyourday 42", gender: "I", avatar: "" },
    { id: "shalker", name: "Шалкер", gender: "I", avatar: "" },
    { id: "misterion", name: "Мистерион", gender: "I", avatar: "" },
    { id: "windigo", name: "Виндиго", gender: "I", avatar: "" }
];

const NOMINATIONS = [
    {
        id: "pumpkin-king",
        title: "PUMPKIN KING",
        gender: "M",
        logo: "",
        nomineeIds: ["burgomister", "dlv1190", "fridayisyourday", "otorgy"],
        selectedId: null,
        selectedFromPoolId: null,
        page: 0
    },
    {
        id: "pumpkin-queen",
        title: "PUMPKIN QUEEN",
        gender: "F",
        logo: "",
        nomineeIds: ["vale", "holydark", "cyathere"],
        selectedId: null,
        selectedFromPoolId: null,
        page: 0
    },
    {
        id: "duo-of-the-year",
        title: "DUO ГОДА",
        type: "duo",
        logo: "",
        duoPairs: [
            { id: "burgomister-fridayisyourday", firstId: "burgomister", secondId: "fridayisyourday" },
            { id: "burgomister-holydark", firstId: "burgomister", secondId: "holydark" },
            { id: "burgomister-skatpoint", firstId: "burgomister", secondId: "skatpoint" },
            { id: "dlv1190-yaarbuzik", firstId: "dlv1190", secondId: "yaarbuzik" },
            { id: "holydark-fridayisyourday", firstId: "holydark", secondId: "fridayisyourday" },
            { id: "holydark-otorgy", firstId: "holydark", secondId: "otorgy" }
        ],
        selectedPairId: null,
        page: 0
    },
    {
        id: "drip-of-the-year",
        title: "DRIP ГОДА",
        type: "image",
        gender: "I",
        logo: "",
        nomineeIds: ["backrooms", "burgomister-42", "don-burger", "fridayisyourday-42", "windigo", "misterion", "shalker"],
        selectedId: null,
        suggestionMode: "idle",
        suggestionDraft: "",
        suggestedText: "",
        page: 0
    },
    {
        id: "nextgen",
        title: "NEXTGEN",
        type: "fixed",
        logo: "",
        nomineeIds: ["tr1ckl", "theriazon", "fork", "yaarbuzik"],
        selectedId: null,
        page: 0
    }
];

const PAGE_SIZE = 3;
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

    const $ = function (selector) {
        return root.querySelector(selector);
    };

    const nominationsList = $("#vote-nominations-list");
    const submitButton = $("#vote-submit-button");
    const submitNotice = $("#vote-submit-notice");
    const progressCount = $("#vote-progress-count");
    const progressTrack = $("#vote-progress-track");
    const progressFill = $("#vote-progress-fill");

    const voteOverlay = $("#vote-vote-overlay");
    const voteTitle = $("#vote-vote-title");
    const voteDescription = $("#vote-vote-description");
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
        nominationsList, submitButton, submitNotice, progressCount, progressTrack,
        progressFill, voteOverlay, voteTitle, voteCloseButton, nominationGrid,
        nominationPrevButton, nominationNextButton, pickerOverlay, pickerTitle,
        pickerCloseButton, pickerGrid, pickerEmpty, pickerPrevButton, pickerNextButton
    ];

    if (requiredElements.some(function (element) { return !element; })) {
        console.error("Nominations: required widget elements are missing.");
        root.dataset.initialized = "false";
        return null;
    }

    let activeNomination = null;
    let pickerPage = 0;

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
        const isImageNomination = nomination.type === "image";

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

    function updateSubmitButton() {
        const selectedCount = NOMINATIONS.filter(nominationHasVote).length;
        const ready = isBallotComplete();

        submitButton.disabled = !ready;
        submitButton.setAttribute("aria-disabled", String(!ready));
        progressCount.textContent = selectedCount + " из " + NOMINATIONS.length;
        progressTrack.setAttribute("aria-valuemax", String(NOMINATIONS.length));
        progressTrack.setAttribute("aria-valuenow", String(selectedCount));
        progressFill.style.width = (selectedCount / NOMINATIONS.length * 100) + "%";
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

    function renderNominationCards() {
        const fragment = document.createDocumentFragment();
        const groups = [
            NOMINATIONS.slice(0, 2),
            NOMINATIONS.slice(2)
        ];

        groups.forEach(function (group, groupIndex) {
            const row = document.createElement("div");
            row.className = "vote-nomination-row"
                + (groupIndex === 0 ? " vote-nomination-row--featured" : "");

            group.forEach(function (nomination) {
                const card = document.createElement("article");
                card.className = "vote-nomination-card"
                    + (groupIndex === 0 ? " vote-nomination-card--featured" : "");
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
                    openVote(nomination);
                });
                card.appendChild(button);
                row.appendChild(card);
            });

            if (group.length) fragment.appendChild(row);
        });

        nominationsList.replaceChildren(fragment);
        updateSubmitButton();
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
            "vote-vote-button"
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
            "vote-vote-button"
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
        selectedName.textContent = selectedPerson ? selectedPerson.name : "Любой участник из общего списка";
        details.appendChild(selectedName);
        card.appendChild(details);

        const button = createActionButton(
            selectedPerson ? "Отменить голос" : "Добавить кандидата",
            Boolean(selectedPerson),
            "vote-vote-button"
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
                "vote-vote-button"
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
        display.textContent = mode === "voted" ? activeNomination.suggestedText : "Предложи свой вариант";
        details.appendChild(display);
        card.appendChild(details);

        const button = createActionButton(
            mode === "voted" ? "Отменить голос" : "Предложить другое",
            mode === "voted",
            "vote-vote-button"
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
        if (activeNomination.type === "fixed") return people;
        return people.concat([{ type: "add-card" }]);
    }

    function updatePager(previousButton, nextButton, page, count) {
        const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
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
        const lastPage = Math.max(0, Math.ceil(entries.length / PAGE_SIZE) - 1);
        activeNomination.page = Math.min(Math.max(activeNomination.page, 0), lastPage);
        const start = activeNomination.page * PAGE_SIZE;

        entries.slice(start, start + PAGE_SIZE).forEach(function (entry) {
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
            return person.gender === activeNomination.gender
                && !presetIds.has(person.id)
                && person.id !== activeNomination.selectedFromPoolId;
        });
    }

    function renderPickerGrid(direction) {
        const available = availablePeople();
        const fragment = document.createDocumentFragment();
        pickerEmpty.hidden = available.length > 0;
        pickerGrid.hidden = available.length === 0;

        const lastPage = Math.max(0, Math.ceil(available.length / PAGE_SIZE) - 1);
        pickerPage = Math.min(Math.max(pickerPage, 0), lastPage);
        const start = pickerPage * PAGE_SIZE;

        available.slice(start, start + PAGE_SIZE).forEach(function (person) {
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

        if (nomination.type === "duo") {
            voteDescription.textContent = "Выбери одну пару года.";
        } else if (nomination.type === "image") {
            voteDescription.textContent = "Выбери изображение или предложи свой вариант.";
        } else {
            voteDescription.textContent = "Выбери одного номинанта. Свой выбор можно изменить позже.";
        }

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
            const addButton = nominationGrid.querySelector(".vote-add-card .vote-vote-button");
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

    submitButton.addEventListener("click", function () {
        if (!isBallotComplete()) {
            updateSubmitButton();
            return;
        }

        const ballot = buildBallotPayload();
        window.SPLITEVENTS_LAST_BALLOT = ballot;

        const rootEvent = new CustomEvent("splitevents:nominations-submit", { detail: ballot });
        root.dispatchEvent(rootEvent);
        window.dispatchEvent(new CustomEvent("splitevents:nominations-submit", { detail: ballot }));

        submitNotice.textContent = "Бюллетень сформирован.";
        submitNotice.hidden = false;
        submitNotice.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

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
        const lastPage = Math.ceil(count / PAGE_SIZE) - 1;
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
        const lastPage = Math.ceil(availablePeople().length / PAGE_SIZE) - 1;
        if (pickerPage < lastPage) {
            pickerPage++;
            renderPickerGrid(1);
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
