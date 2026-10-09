const assert = require("node:assert/strict");
const {readFileSync} = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const source = readFileSync(path.join(__dirname, "../../src/lib/auth.ts"), "utf8");
const compiled = ts.transpileModule(source, {
    compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
    },
}).outputText;

function loadAuth() {
    const cookies = new Map([["session_token", "session-one"]]);
    const requests = [];
    const module = {exports: {}};
    const dependencies = {
        "cookies-next/client": {
            getCookie: name => cookies.get(name),
            deleteCookie: name => cookies.delete(name),
        },
        "@/lib/core": {
            getApiUrl: () => "https://api.example.test",
        },
        "@/lib/client": {
            deleteVerifyToken: () => {},
        },
    };

    vm.runInNewContext(compiled, {
        module,
        exports: module.exports,
        console: {error: () => {}},
        require: name => {
            assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
            return dependencies[name];
        },
        fetch: (url, options) => new Promise((resolve, reject) => {
            requests.push({url, options, resolve, reject});
        }),
    });

    return {auth: module.exports, cookies, requests};
}

function succeed(request, user = {username: "tester"}) {
    request.resolve({ok: true, json: async () => ({message: user})});
}

test("simultaneous consumers share one authenticated request", async () => {
    const {auth, requests} = loadAuth();
    const first = auth.getUser();
    const second = auth.getUser();

    assert.equal(requests.length, 1);
    assert.equal(first, second);
    assert.equal(requests[0].options.credentials, "include");
    assert.equal(requests[0].options.cache, "no-store");
    assert.deepEqual(Object.keys(requests[0].options.headers), ["Accept"]);

    succeed(requests[0]);
    assert.equal((await first).username, "tester");
    assert.equal(await second, await first);
});

test("completed requests are not cached across later mounts", async () => {
    const {auth, requests} = loadAuth();
    const first = auth.getUser();
    succeed(requests[0]);
    await first;

    const second = auth.getUser();
    assert.equal(requests.length, 2);
    succeed(requests[1], {username: "updated"});
    assert.equal((await second).username, "updated");
});

test("changing sessions does not reuse the previous pending request", async () => {
    const {auth, cookies, requests} = loadAuth();
    const oldSession = auth.getUser();
    cookies.set("session_token", "session-two");
    const newSession = auth.getUser();

    assert.equal(requests.length, 2);
    succeed(requests[0], {username: "old"});
    await oldSession;
    assert.equal(auth.getUser(), newSession);

    succeed(requests[1], {username: "new"});
    assert.equal((await newSession).username, "new");
});

test("logout invalidates pending requests", async () => {
    const {auth, requests, cookies} = loadAuth();
    const pending = auth.getUser();
    auth.logout();
    const loggedOut = auth.getUser();

    assert.equal(cookies.has("session_token"), false);
    assert.equal(requests.length, 2);
    succeed(requests[0]);
    requests[1].resolve({ok: false});
    await pending;
    assert.equal(await loggedOut, null);
});

test("failed network requests are released and can be retried", async () => {
    const {auth, requests} = loadAuth();
    const first = auth.getUser();
    requests[0].reject(new Error("offline"));
    assert.equal(await first, null);

    const retry = auth.getUser();
    assert.equal(requests.length, 2);
    succeed(requests[1]);
    assert.equal((await retry).username, "tester");
});

test("invalid JSON rejects without poisoning subsequent requests", async () => {
    const {auth, requests} = loadAuth();
    const first = auth.getUser();
    requests[0].resolve({
        ok: true,
        json: async () => {
            throw new Error("Invalid JSON");
        },
    });
    await assert.rejects(first, /Invalid JSON/);

    const retry = auth.getUser();
    succeed(requests[1]);
    await retry;
});

test("API error responses still return no user", async () => {
    const {auth, requests} = loadAuth();
    const pending = auth.getUser();
    requests[0].resolve({ok: true, json: async () => ({error: true})});
    assert.equal(await pending, null);
});

test("transcript authentication is deduplicated separately", async () => {
    const {auth, requests} = loadAuth();
    const user = auth.getUser();
    const transcript = auth.getTrUser();
    assert.equal(auth.getTrUser(), transcript);
    assert.equal(requests.length, 2);
    assert.ok(requests[1].url.endsWith("/v1/auth/tr/me"));

    succeed(requests[0]);
    succeed(requests[1], {serverName: "server"});
    await user;
    assert.equal((await transcript).serverName, "server");
});
