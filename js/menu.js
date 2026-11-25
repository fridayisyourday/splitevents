/* Accessible side navigation drawer. */
const $ = (id) => document.getElementById(id);

export function createMenu({ onNavigate, onStateChange }) {
    const elements = {
        header: document.querySelector(".site-header"),
        main: $("main-content"),
        button: $("menu-button"),
        overlay: $("menu-overlay"),
        backdrop: $("menu-backdrop"),
        panel: $("menu-panel"),
        closeButton: $("menu-close-button"),
        eventsUnreadBadge: $("events-unread-badge")
    };

    const navigationItems = [
        { page: "home", button: $("home-nav-button") },
        { page: "profile", button: $("profile-nav-button") },
        { page: "events", button: $("events-nav-button") },
        { page: "servers", button: $("servers-nav-button") }
    ];

    const missing = Object.entries(elements)
        .filter(([, element]) => !element)
        .map(([name]) => name);

    navigationItems.forEach((item) => {
        if (!item.button) missing.push(item.page + " navigation button");
    });

    if (missing.length) {
        throw new Error("Menu elements not found: " + missing.join(", "));
    }

    let isOpen = false;
    let closeTimer = null;

    function notifyStateChange() {
        if (typeof onStateChange === "function") {
            onStateChange(isOpen);
        }
    }

    // Keep every destination visible and mark the current page clearly.
    function updateForPage(currentPage) {
        navigationItems.forEach((item) => {
            if (item.page === currentPage) {
                item.button.setAttribute("aria-current", "page");
            } else {
                item.button.removeAttribute("aria-current");
            }
        });
    }

    function updateUnreadEventsCount(count) {
        const safeCount = Math.max(0, Math.floor(Number(count) || 0));
        elements.eventsUnreadBadge.hidden = safeCount === 0;
        elements.eventsUnreadBadge.textContent = safeCount > 99 ? "99+" : String(safeCount);

        const lastTwo = safeCount % 100;
        const lastOne = safeCount % 10;
        const word = lastOne === 1 && lastTwo !== 11
            ? "новое событие"
            : lastOne >= 2 && lastOne <= 4 && (lastTwo < 12 || lastTwo > 14)
                ? "новых события"
                : "новых событий";
        elements.eventsUnreadBadge.setAttribute("aria-label", safeCount + " " + word);
    }

    function getFocusableElements() {
        return Array.from(
            elements.panel.querySelectorAll(
                'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
        ).filter(
            (element) =>
                !element.hidden &&
                element.getClientRects().length > 0
        );
    }

    function open() {
        if (isOpen) return;

        if (closeTimer !== null) {
            window.clearTimeout(closeTimer);
            closeTimer = null;
        }

        isOpen = true;
        elements.overlay.hidden = false;
        elements.button.setAttribute("aria-expanded", "true");
        document.body.classList.add("menu-open");

        elements.header.inert = true;
        elements.main.inert = true;
        elements.header.setAttribute("aria-hidden", "true");
        elements.main.setAttribute("aria-hidden", "true");

        void elements.overlay.offsetWidth;

        window.requestAnimationFrame(() => {
            if (!isOpen) return;
            elements.overlay.classList.add("is-open");
            elements.closeButton.focus();
        });

        notifyStateChange();
    }

    function close(restoreFocus = false) {
        if (!isOpen && elements.overlay.hidden) return;

        isOpen = false;
        elements.overlay.classList.remove("is-open");
        elements.button.setAttribute("aria-expanded", "false");
        document.body.classList.remove("menu-open");

        elements.header.inert = false;
        elements.main.inert = false;
        elements.header.removeAttribute("aria-hidden");
        elements.main.removeAttribute("aria-hidden");

        if (restoreFocus) {
            elements.button.focus({ preventScroll: true });
        }

        if (closeTimer !== null) {
            window.clearTimeout(closeTimer);
        }

        closeTimer = window.setTimeout(() => {
            if (!isOpen) elements.overlay.hidden = true;
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

        const focusable = getFocusableElements();

        if (!focusable.length) {
            event.preventDefault();
            elements.panel.focus();
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

    function bind() {
        elements.button.addEventListener("click", () => {
            if (isOpen) close(true);
            else open();
        });

        elements.backdrop.addEventListener("click", () => close(true));
        elements.closeButton.addEventListener("click", () => close(true));
        document.addEventListener("keydown", handleKeydown);

        navigationItems.forEach((item) => {
            item.button.addEventListener("click", () => {
                close(false);
                onNavigate(item.page);
            });
        });
    }

    return {
        bind,
        open,
        close,
        isOpen: () => isOpen,
        updateForPage,
        updateUnreadEventsCount
    };
}
