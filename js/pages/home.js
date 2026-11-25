/* SplitEvents — welcoming home page. */
function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function makeNavigationButton(label, className, page, onNavigate) {
    const button = element("button", className, label);
    button.type = "button";
    button.addEventListener("click", () => onNavigate(page));
    return button;
}

function makeSectionCard({ number, title, description, page, action, onNavigate }) {
    const card = element("article", "home-section-card");
    const top = element("div", "home-section-card-top");
    top.append(
        element("span", "home-section-number", number),
        element("span", "home-section-kicker", "РАЗДЕЛ")
    );

    const heading = element("h3", "home-section-card-title", title);
    const copy = element("p", "home-section-card-description", description);
    const link = makeNavigationButton(
        action + "  ↗",
        "home-section-card-link",
        page,
        onNavigate
    );

    card.append(top, heading, copy, link);
    return card;
}

export function renderHomePage(container, { onNavigate }) {
    const page = element("div", "home-page");

    const hero = element("section", "home-hero");
    const heroCopy = element("div", "home-hero-copy");
    const eyebrow = element("p", "home-eyebrow", "SPLIT EVENTS  ·  ДЛЯ ТЕХ, КТО ВМЕСТЕ");
    const title = element("h1", "home-hero-title", "Планы становятся лучше, когда вы вместе.");
    const description = element(
        "p",
        "home-hero-description",
        "Находи компанию, собирай людей вокруг общих интересов и превращай хорошие идеи в настоящие встречи."
    );

    const heroActions = element("div", "home-hero-actions");
    heroActions.append(
        makeNavigationButton("Смотреть события", "home-button home-button-primary", "events", onNavigate),
        makeNavigationButton("Мой профиль", "home-button home-button-secondary", "profile", onNavigate)
    );
    heroCopy.append(eyebrow, title, description, heroActions);

    const artwork = element("div", "home-hero-art");
    artwork.setAttribute("aria-hidden", "true");
    artwork.append(
        element("div", "home-art-orbit home-art-orbit-outer"),
        element("div", "home-art-orbit home-art-orbit-inner"),
        element("div", "home-art-glow"),
        element("div", "home-art-core", "ВМЕСТЕ"),
        element("span", "home-art-chip home-art-chip-one", "ИДЕИ"),
        element("span", "home-art-chip home-art-chip-two", "ЛЮДИ"),
        element("span", "home-art-chip home-art-chip-three", "ВСТРЕЧИ")
    );
    hero.append(heroCopy, artwork);

    const sections = element("section", "home-sections");
    const sectionHeader = element("div", "home-sections-header");
    sectionHeader.append(
        element("div", "home-sections-heading-wrap",
            undefined
        )
    );
    const sectionHeadingWrap = sectionHeader.firstElementChild;
    sectionHeadingWrap.append(
        element("p", "home-eyebrow home-eyebrow-muted", "ТВОЁ ПРОСТРАНСТВО"),
        element("h2", "home-sections-title", "С чего начнём?")
    );
    sectionHeader.append(
        element("p", "home-sections-subtitle", "Выбирай направление и заглядывай внутрь.")
    );

    const cards = element("div", "home-section-grid");
    cards.append(
        makeSectionCard({
            number: "01",
            title: "События",
            description: "Смотри, какие встречи и планы появляются вокруг тебя.",
            page: "events",
            action: "Открыть события",
            onNavigate
        }),
        makeSectionCard({
            number: "02",
            title: "Сервера",
            description: "Находи сообщества и людей, которым близки твои интересы.",
            page: "servers",
            action: "Перейти к серверам",
            onNavigate
        })
    );
    sections.append(sectionHeader, cards);

    const profileNote = element("section", "home-profile-note");
    const profileNoteText = element("div", "home-profile-note-copy");
    profileNoteText.append(
        element("p", "home-profile-note-kicker", "ТВОЯ СТРАНИЦА"),
        element("h2", "home-profile-note-title", "Начни со своего профиля"),
        element(
            "p",
            "home-profile-note-description",
            "Добавь имя и оформи страницу, чтобы другим было проще тебя узнать."
        )
    );
    profileNote.append(
        profileNoteText,
        makeNavigationButton("Настроить профиль  ↗", "home-profile-note-button", "profile", onNavigate)
    );

    page.append(hero, sections, profileNote);
    container.replaceChildren(page);
}
