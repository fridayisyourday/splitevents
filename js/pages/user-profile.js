/* Read-only view of another registered user's profile. */
import { fetchPublicProfile } from "../api.js?v=20261126-5";
import { createElement } from "../dom.js?v=20261126-1";
import { createEmptyStateElement } from "./page-shell.js?v=20261126-2";

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

function createImage(element, source, placeholder) {
    const imageUrl = getSafeImageUrl(source);
    if (!imageUrl) return;

    element.onload = () => {
        element.hidden = false;
        if (placeholder) placeholder.hidden = true;
    };
    element.onerror = () => {
        element.removeAttribute("src");
        element.hidden = true;
        if (placeholder) placeholder.hidden = false;
    };
    element.src = imageUrl;
}

function createProfileCard(user) {
    const card = createElement("article", "profile-card profile-card--readonly");
    const cover = createElement("div", "profile-cover");
    const bannerPlaceholder = createElement("div", "profile-banner-placeholder");
    bannerPlaceholder.setAttribute("aria-hidden", "true");

    const banner = createElement("img", "profile-banner-image");
    banner.alt = "";
    banner.hidden = true;
    cover.append(bannerPlaceholder, banner);
    createImage(banner, user.banner_url, bannerPlaceholder);

    const avatar = createElement("div", "profile-avatar");
    const avatarPlaceholder = createElement("div", "profile-avatar-placeholder");
    avatarPlaceholder.setAttribute("aria-hidden", "true");
    avatarPlaceholder.appendChild(createPersonIcon());

    const avatarImage = createElement("img", "profile-avatar-image");
    avatarImage.alt = "фотография профиля";
    avatarImage.referrerPolicy = "no-referrer";
    avatarImage.hidden = true;
    avatar.append(avatarImage, avatarPlaceholder);
    createImage(avatarImage, user.avatar_url, avatarPlaceholder);

    const details = createElement("div", "profile-details");
    const nameRow = createElement("div", "profile-name-row");
    const name = createElement("span", "profile-nickname", user.display_name || "пользователь");
    const username = typeof user.username === "string"
        ? user.username.trim().replace(/^@/, "")
        : "";
    const tag = createElement(
        "p",
        "profile-telegram-tag",
        username ? "@" + username : "тег не указан"
    );

    nameRow.appendChild(name);
    details.append(nameRow, tag);
    card.append(cover, avatar, details);

    return card;
}

export function createUserProfilePage(container, { initData }) {
    let requestId = 0;

    function renderLoading() {
        const loading = createElement("div", "public-profile-loading");
        loading.setAttribute("role", "status");
        loading.setAttribute("aria-live", "polite");
        loading.setAttribute("aria-label", "загрузка профиля");

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
        container.replaceChildren(loading);
    }

    function renderError() {
        const wrapper = createElement("div", "public-profile-status");
        wrapper.appendChild(createEmptyStateElement({
            message: "не удалось открыть профиль",
            note: "возможно, пользователь больше не зарегистрирован"
        }));
        container.replaceChildren(wrapper);
    }

    async function load(publicId) {
        const currentRequestId = ++requestId;

        if (!initData || !/^[0-9a-f]{32}$/i.test(publicId || "")) {
            renderError();
            return;
        }

        renderLoading();

        try {
            const user = await fetchPublicProfile(initData, publicId);
            if (currentRequestId !== requestId) return;
            container.replaceChildren(createProfileCard(user));
        } catch (error) {
            if (currentRequestId !== requestId) return;
            console.error("SplitEvents: public profile failed", error);
            renderError();
        }
    }

    function stop() {
        requestId += 1;
    }

    return { load, stop };
}
