const assert = require("node:assert/strict");
const {readFileSync} = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const source = readFileSync(path.join(__dirname, "../../src/lib/urlDisplay.ts"), "utf8");
const compiled = ts.transpileModule(source, {
    compilerOptions: {module: ts.ModuleKind.CommonJS},
}).outputText;
const moduleValue = {exports: {}};
vm.runInNewContext(compiled, {module: moduleValue, exports: moduleValue.exports});
const {decodeUrlForDisplay} = moduleValue.exports;

test("decodes form-encoded URL characters and Unicode for presentation", () => {
    assert.equal(decodeUrlForDisplay("https%3A%2F%2Fexample.test%2Fa%3Fx%3D%C4%8Dau"), "https://example.test/a?x=čau");
    assert.equal(decodeUrlForDisplay("https%3A%2F%2Fexample.test%2Fa+b"), "https://example.test/a b");
});

test("literal plus signs are not changed in an ordinary URL", () => {
    assert.equal(decodeUrlForDisplay("https://example.test/a+b%2Fc"), "https://example.test/a+b/c");
});

test("decodes only once and tolerates malformed escapes", () => {
    assert.equal(decodeUrlForDisplay("https%3A%2F%2Fexample.test%2Fa%252Fb"), "https://example.test/a%2Fb");
    assert.equal(decodeUrlForDisplay("https://example.test/%bad%"), "https://example.test/%bad%");
});
