import assert from "node:assert/strict";
import test from "node:test";
import { SERVERS } from "../js/servers/data.js";

test("TECHNOCRACY server is listed with the supplied address", () => {
    assert.equal(SERVERS.length, 1);
    assert.equal(SERVERS[0].id, "technocracy");
    assert.equal(SERVERS[0].name, "TECHNOCRACY");
    assert.equal(SERVERS[0].address, "26.135.106.225:4444");
});

test("server artwork is resolved as local assets for the production build", () => {
    const [server] = SERVERS;
    assert.match(server.banner, /assets\/servers\/technocracy\/banner\.svg$/);
    assert.match(server.logo, /assets\/servers\/technocracy\/logo\.svg$/);
});

test("server entries have unique ids and the fields needed by the card", () => {
    const ids = SERVERS.map((server) => server.id);
    assert.equal(new Set(ids).size, ids.length);

    for (const server of SERVERS) {
        assert.ok(server.name);
        assert.ok(server.address);
        assert.ok(server.banner);
        assert.ok(server.logo);
    }
});
