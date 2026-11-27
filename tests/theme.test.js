import assert from "node:assert/strict";
import test from "node:test";
import { getStoredTheme, normalizeTheme, applyTheme, saveTheme } from "../js/theme.js";

test("theme values normalize to light or dark", () => {
    assert.equal(normalizeTheme("dark"), "dark");
    assert.equal(normalizeTheme("light"), "light");
    assert.equal(normalizeTheme("invalid"), "light");
});

test("saved theme overrides defaults and invalid storage values are ignored", () => {
    assert.equal(getStoredTheme({ getItem: () => "dark" }), "dark");
    assert.equal(getStoredTheme({ getItem: () => "invalid" }), null);
    assert.equal(getStoredTheme({ getItem: () => null }), null);
});

test("theme can be applied to a root object and saved", () => {
    const root = { dataset: {} };
    assert.equal(applyTheme("dark", root), "dark");
    assert.deepEqual(root.dataset, { colorScheme: "dark" });
    const values = {};
    const storage = { setItem: (key, value) => { values[key] = value; } };
    assert.equal(saveTheme("dark", storage), "dark");
    assert.equal(values["splitevents-color-scheme"], "dark");
});
