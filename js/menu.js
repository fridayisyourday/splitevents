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
        closeButton: $("menu-close-button")
    };

    const navigationItems = [
        {
            page: "profile",
            button: $("profile-nav-button"),
            label: $("profile-nav-label"),
            icon: document.querySelector(".menu-profile-icon"),
            homeIcon: document.querySelector(".menu-home-icon"),
            defaultLabel: "Профиль"
        },
        {
            page: "home",
            button: $("events-nav-button"),
            label: $("events-nav-label"),
            icon: document.querySelector(".events-icon"),
            homeIcon: document.querySelector(".events-home-icon"),
            defaultLabel: "События"
        },
        {
            page: "servers",
            button: $("servers-nav-button"),
            label: $("servers-nav-label"),
            icon: document.querySelector(".servers-icon"),
            homeIcon: document.querySelector(".servers-home-icon"),
            defaultLabel: "Сервера"
        }
    ];

    const requiredElements = Object.entries(el)
        .filter(([, element]) => !element)
        .map(([name]) => name);

    navigationItems.forEach((item, index) => {
        ["button", "label", "icon", "homeIcon"].forEach((key) => {
            if (!item[key]) {
                requiredElements.push(`navigationItems[${index}].${key}`);
            }
        });
    });

    if (requiredElements.length) {
        throw new Error(
            `Menu elements not found: ${requiredElements.join(", ")}`
        );
    }

    let isOpen = false;
    let closeTimer = null;

    function notifyStateChange() {
        if (typeof onStateChange === "function") {
            onStateChange(isOpen);
        }
    }

    /*
     * The current page's own menu item becomes "Главная".
     * Other items keep their normal labels and destinations.
     */
    function updateForPage(page) {
        navigationItems.forEach((item) => {
            const isCurrentPage = item.page === page;

            item.label.textContent = isCurrentPage
                ? "Главная"
                : item.defaultLabel;

            item.icon.hidden = isCurrentPage;
            item.homeIcon.hidden = !isCurrentPage;

            if (isCurrentPage) {
                item.button.setAttribute("aria-current", "page");
            } else {
                item.button.removeAttribute("aria-current");
            }
        });
    }

    function getFocusableElements() {
        return Array.from(
            el.panel.querySelectorAll(
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

        if (closeTimer !== null) {
            window.clearTimeout(closeTimer);
        }

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

        const focusable = getFocusableElements();

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
        } else if (
            !event.shiftKey &&
            document.activeElement === last
        ) {
            event.preventDefault();
            first.focus();
        }
    }

    function navigateFromItem(item) {
        const currentPage = getCurrentPage();

        // If this item represents the open page, it now means "Главная".
        const destination = currentPage === item.page
            ? "home"
            : item.page;

        close(false);
        onNavigate(destination);
    }

    function bind() {
        el.button.addEventListener("click", () => {
            if (isOpen) close(true);
            else open();
        });

        el.backdrop.addEventListener("click", () => close(true));
        el.closeButton.addEventListener("click", () => close(true));
        document.addEventListener("keydown", handleKeydown);

        navigationItems.forEach((item) => {
            item.button.addEventListener("click", () => {
                navigateFromItem(item);
            });
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
