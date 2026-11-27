/* Shared notification API for the entire application. */
function dispatchNotification(type, message, detail = "") {
    const title = typeof message === "string" ? message.trim() : "";
    if (!title || typeof window === "undefined") return false;

    const description = typeof detail === "string" ? detail.trim() : "";
    window.dispatchEvent(new CustomEvent("splitevents:notification", {
        detail: { type, message: title, detail: description }
    }));
    return true;
}

export function notifyError(message, detail = "") {
    return dispatchNotification("error", message, detail);
}

export function notifySuccess(message, detail = "") {
    return dispatchNotification("success", message, detail);
}
