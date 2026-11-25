/* Accessible side navigation drawer. */
const $ = (id) => document.getElementById(id);

export function createMenu({ getCurrentPage, onNavigate, onStateChange }) {
    const el = {
        header: document.querySelector(".site-header"),
        main: $("main-content"),
        button: $("menu-button"),
        overlay: $("menu-overlay"),
        backdrop: $("menu-backdrop"),
        panel: $("menu-panel"),
        closeButton: $("menu-close-button"),
        profileButton: $("profile-nav-button"),
        profileLabel: $("profile-nav-label"),
        profileIcon: document.querySelector(".menu-profile-icon"),
        homeIcon: document.querySelector(".menu-home-icon"),
        eventsButton: $("events-nav-button"),
        serversButton: $("servers-nav-button")
    };

    const missing = Object.entries(el)
        .filter(([, value]) => !value)
        .map(([name]) => name);

    if (missing.length) {
        throw new Error(`Menu elements not found: ${missing.join(", ")}`);
    }

    let isOpen = false;
    let closeTimer = null;

    function notifyStateChange() {
        if (typeof onStateChange === "function") onStateChange(isOpen);
    }

    function updateForPage(page) {
        const onProfile = page === "profile";

        el.profileLabel.textContent = onProfile ? "Главная" : "Профиль";
        el.profileIcon.hidden = onProfile;
        el.homeIcon.hidden = !onProfile;

        [el.profileButton, el.eventsButton, el.serversButton].forEach((button) => {
            button.removeAttribute("aria-current");
        });

        if (onProfile) el.profileButton.setAttribute("aria-current", "page");
        if (page === "home") el.eventsButton.setAttribute("aria-current", "page");
        if (page === "servers") el.serversButton.setAttribute("aria-current", "page");
    }

    function focusableElements() {
        return Array.from(
            el.panel.querySelectorAll(
                'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
        ).filter((element) => !element.hidden && element.getClientRects().length > 0);
    }

    function open() {
        if (isOpen) return;

        if (closeTimer !== null) {
            window.clearTimeout(closeTimer);
            closeTimer = null;
        }

        isOpen = true;
        el.overlay.hidden = false;
        el.button.setAttribute("aria-expanded", "true");
        document.body.classList.add("menu-open");
        el.header.inert = true;
        el.main.inert = true;
        el.header.setAttribute("aria-hidden", "true");
        el.main.setAttribute("aria-hidden", "true");

        void el.overlay.offsetWidth;
        window.requestAnimationFrame(() => {
            if (!isOpen) return;
            el.overlay.classList.add("is-open");
            el.closeButton.focus();
        });

        notifyStateChange();
    }

    function close(restoreFocus = false) {
        if (!isOpen && el.overlay.hidden) return;

        isOpen = false;
        el.overlay.classList.remove("is-open");
        el.button.setAttribute("aria-expanded", "false");
        document.body.classList.remove("menu-open");
        el.header.inert = false;
        el.main.inert = false;
        el.header.removeAttribute("aria-hidden");
        el.main.removeAttribute("aria-hidden");

        if (restoreFocus) {
            el.button.focus({ preventScroll: true });
        }

        if (closeTimer !== null) window.clearTimeout(closeTimer);
        closeTimer = window.setTimeout(() => {
            if (!isOpen) el.overlay.hidden = true;
            closeTimer = null;
        }, 240);

        notifyStateChange();
    }

    function handleKeydown(event) {
        if (!isOpen) return;

        if (event.key === "Escape") {
            event.preventDefault();
            close(true);
            return;
        }

        if (event.key !== "Tab") return;

        const focusable = focusableElements();
        if (!focusable.length) {
            event.preventDefault();
            el.panel.focus();
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    function bind({ onProfileOrHome }) {
        el.button.addEventListener("click", () => {
            if (isOpen) close(true);
            else open();
        });

        el.backdrop.addEventListener("click", () => close(true));
        el.closeButton.addEventListener("click", () => close(true));
        document.addEventListener("keydown", handleKeydown);

        el.profileButton.addEventListener("click", () => {
            close(false);
            if (typeof onProfileOrHome === "function") onProfileOrHome();
        });

        el.eventsButton.addEventListener("click", () => {
            close(false);
            onNavigate("home");
        });

        el.serversButton.addEventListener("click", () => {
            close(false);
            onNavigate("servers");
        });
    }

    return {
        bind,
        open,
        close,
        isOpen: () => isOpen,
        updateForPage
    };
}
