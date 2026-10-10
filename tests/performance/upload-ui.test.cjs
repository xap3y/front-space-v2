const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function source(file) {
    return fs.readFileSync(path.resolve(__dirname, "../../src", file), "utf8");
}

test("upload compatibility warnings stay in tooltips next to file names", () => {
    const compatibility = source("components/VideoUploadCompatibility.tsx");
    assert.match(compatibility, /title=\{warning\}/);
    assert.doesNotMatch(compatibility, /<span>\{message\}<\/span>/);
    assert.doesNotMatch(compatibility, /<p[\s>]/);
    assert.match(source("app/files/client.tsx"), /fileName=\{item.customName \|\| item.realFileName\}/);
});

test("local gallery previews use the authenticated same-origin image proxy", () => {
    const gallery = source("app/home/gallery/new-client.tsx");
    const proxy = source("app/api/images/[id]/route.ts");
    assert.match(gallery, /item.location === "LOCAL" \? `\/api\/images\//);
    assert.match(proxy, /await context.params/);
    assert.match(proxy, /Cookie: `session_token=\$\{session\}`/);
    assert.match(proxy, /private, no-store/);
});

test("expanded uploader settings do not clip the call server dropdown", () => {
    const uploader = source("app/a/image/client.tsx");
    assert.match(uploader, /showAdvanced \? "overflow-visible max-h-\[500px\] mt-4" : "overflow-hidden max-h-0"/);
    assert.match(uploader, /isOpen && <Surface/);
});
