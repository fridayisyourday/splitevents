import assert from "node:assert/strict";
import test from "node:test";
import { notifyError, notifySuccess } from "../js/notifications.js";

function captureNotification(callback) {
    const previousWindow = globalThis.window;
    let event = null;
    globalThis.window = {
        dispatchEvent(value) {
            event = value;
            return true;
        }
    };

    try {
        const result = callback();
        return { result, event };
    } finally {
        if (previousWindow === undefined) delete globalThis.window;
        else globalThis.window = previousWindow;
    }
}

test("notifyError dispatches a normalized error notification", () => {
    const { result, event } = captureNotification(() => notifyError("  не удалось сохранить ", "  попробуй ещё раз  "));
    assert.equal(result, true);
    assert.equal(event.type, "splitevents:notification");
    assert.deepEqual(event.detail, { type: "error", message: "не удалось сохранить", detail: "попробуй ещё раз" });
});

test("notifySuccess dispatches a success notification", () => {
    const { result, event } = captureNotification(() => notifySuccess("аватар обновлён"));
    assert.equal(result, true);
    assert.deepEqual(event.detail, { type: "success", message: "аватар обновлён", detail: "" });
});

test("notification helpers ignore empty messages", () => {
    const { result, event } = captureNotification(() => notifyError("   "));
    assert.equal(result, false);
    assert.equal(event, null);
});
