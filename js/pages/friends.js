/* Friends directory: authenticated, alphabetically sorted registered users. */
import { fetchFriends } from "../api.js?v=20261126-5";
import { createElement } from "../dom.js?v=20261126-1";
import {
    createPageShell,
    createEmptyStateElement
} from "./page-shell.js?v=20261126-2";

function getSafeImageUrl(value) {
    if (typeof value !== "string" || !value) return "";

    try {
        const url = new URL(value);
        return url.protocol === "https:" && url.hostname.endsWith(".imagekit.io")
            ? url.href
            : "";
    } catch {
        return "";
    }
}

function createPersonIcon() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.8");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");

    const head = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    head.setAttribute("cx", "12");
    head.setAttribute("cy", "8");
    head.setAttribute("r", "3.5");

    const body = document.createElementNS("http://www.w3.org/2000/svg", "path");
    body.setAttribute("d", "M5 20C5 16.4 8.1 14 12 14C15.9 14 19 16.4 19 20");

    svg.append(head, body);
    return svg;
}

function createFriendAvatar(user) {
    const avatar = createElement("span", "friend-card-avatar");
    const placeholder = createElement("span", "friend-card-avatar-placeholder");
    placeholder.appendChild(createPersonIcon());
    avatar.appendChild(placeholder);

    const imageUrl = getSafeImageUrl(user.avatar_url);
    if (!imageUrl) return avatar;

    const image = createElement("img", "friend-card-avatar-image");
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    image.hidden = true;
    image.onload = () => {
        image.hidden = false;
        placeholder.hidden = true;
    };
    image.onerror = () => {
        image.remove();
    };
    image.src = imageUrl;
    avatar.appendChild(image);

    return avatar;
}

function createFriendCard(user, onOpenUser) {
    const card = createElement("button", "friend-card");
    card.type = "button";
    card.setAttribute("aria-label", "открыть профиль: " + user.display_name);

    const avatar = createFriendAvatar(user);
    const copy = createElement("span", "friend-card-copy");
    const name = createElement("span", "friend-card-name", user.display_name);
    const username = typeof user.username === "string"
        ? user.username.trim().replace(/^@/, "")
        : "";
    const tag = createElement(
        "span",
        "friend-card-tag",
        username ? "@" + username : "тег не указан"
    );

    copy.append(name, tag);
    card.append(avatar, copy);
    card.addEventListener("click", () => onOpenUser(user.public_id));

    return card;
}

function sortUsers(users) {
    const collator = new Intl.Collator("ru", {
        sensitivity: "base",
        numeric: true
    });

    return [...users].sort((left, right) => (
        collator.compare(left.display_name || "", right.display_name || "") ||
        collator.compare(left.username || "", right.username || "")
    ));
}

export function createFriendsPage(container, { initData, onOpenUser }) {
    let requestId = 0;

    function createShell() {
        const shell = createPageShell({
            title: "Друзья",
            pageClass: "friends-page",
            contentClass: "friends-page-content"
        });
        shell.body.classList.add("friends-page-body");
        return shell;
    }

    function renderLoading() {
        const shell = createShell();
        const loading = createElement("div", "friends-loading");
        loading.setAttribute("role", "status");
        loading.setAttribute("aria-live", "polite");
        loading.setAttribute("aria-label", "загрузка списка друзей");

        const spinner = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        spinner.setAttribute("class", "friends-loading-spinner");
        spinner.setAttribute("viewBox", "0 0 24 24");
        spinner.setAttribute("fill", "none");
        spinner.setAttribute("aria-hidden", "true");

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", "12");
        circle.setAttribute("cy", "12");
        circle.setAttribute("r", "8");
        circle.setAttribute("stroke", "currentColor");
        circle.setAttribute("stroke-width", "2");
        circle.setAttribute("stroke-dasharray", "34 16");
        spinner.appendChild(circle);

        loading.appendChild(spinner);
        shell.body.appendChild(loading);
        container.replaceChildren(shell.page);
    }

    function renderStatus(message, note, retry) {
        const shell = createShell();
        const state = createEmptyStateElement({ message, note });
        shell.body.classList.add("section-page-body--center");
        shell.body.appendChild(state);

        if (retry) {
            const button = createElement("button", "ui-button ui-button--secondary friends-retry", "повторить");
            button.type = "button";
            button.addEventListener("click", () => void start());
            shell.body.appendChild(button);
        }

        container.replaceChildren(shell.page);
    }

    function renderUsers(users) {
        const shell = createShell();

        if (!users.length) {
            shell.body.classList.add("section-page-body--center");
            shell.body.appendChild(createEmptyStateElement({
                message: "пока здесь никого нет",
                note: "другие участники появятся здесь после регистрации"
            }));
            container.replaceChildren(shell.page);
            return;
        }

        const list = createElement("div", "friends-list");
        list.setAttribute("aria-label", "зарегистрированные пользователи");

        sortUsers(users).forEach((user) => {
            if (!user || !/^[0-9a-f]{32}$/i.test(user.public_id || "")) return;
            list.appendChild(createFriendCard(user, onOpenUser));
        });

        if (!list.childElementCount) {
            shell.body.classList.add("section-page-body--center");
            shell.body.appendChild(createEmptyStateElement({
                message: "пока здесь никого нет",
                note: "другие участники появятся здесь после регистрации"
            }));
        } else {
            shell.body.appendChild(list);
        }

        container.replaceChildren(shell.page);
    }

    async function start() {
        const currentRequestId = ++requestId;

        if (!initData) {
            renderStatus(
                "открой мини-приложение через telegram",
                "для просмотра списка друзей требуется авторизация telegram",
                false
            );
            return;
        }

        renderLoading();

        try {
            const users = await fetchFriends(initData);
            if (currentRequestId !== requestId) return;
            renderUsers(Array.isArray(users) ? users : []);
        } catch (error) {
            if (currentRequestId !== requestId) return;
            console.error("SplitEvents: friends directory failed", error);
            renderStatus(
                "не удалось загрузить список друзей",
                "проверь подключение и попробуй ещё раз",
                true
            );
        }
    }

    function stop() {
        requestId += 1;
    }

    return { start, stop };
}
