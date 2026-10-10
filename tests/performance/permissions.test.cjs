const assert = require("node:assert/strict");
const {readFileSync} = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const source = readFileSync(path.join(__dirname, "../../src/lib/permissions.ts"), "utf8");
const compiled = ts.transpileModule(source, {
    compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
    },
}).outputText;
const moduleValue = {exports: {}};
vm.runInNewContext(compiled, {module: moduleValue, exports: moduleValue.exports});
const {PERMISSIONS, hasPermission, canAccessAdminPath, firstAdminPath} = moduleValue.exports;

test("OWNER has every permission without a supplied permission list", () => {
    for (const permission of PERMISSIONS) {
        assert.equal(hasPermission({role: "OWNER"}, permission.key), true);
    }
});

test("task monitoring needs its section permission and the admin master switch", () => {
    assert.equal(canAccessAdminPath({role: "OWNER"}, "/admin/monitoring"), true);
    assert.equal(canAccessAdminPath({role: "ADMIN", permissions: ["ADMIN_ACCESS", "ADMIN_SYSTEM"]}, "/admin/monitoring"), false);
    assert.equal(canAccessAdminPath({role: "ADMIN", permissions: ["ADMIN_MONITORING"]}, "/admin/monitoring"), false);
    assert.equal(canAccessAdminPath({role: "ADMIN", permissions: ["ADMIN_ACCESS", "ADMIN_MONITORING"]}, "/admin/monitoring"), true);
});

test("missing rights and disabled accounts fail closed", () => {
    assert.equal(hasPermission(null, "DELETE_IMAGES"), false);
    assert.equal(hasPermission({role: "ADMIN"}, "ADMIN_IMAGES"), false);
    assert.equal(hasPermission({role: "BANNED", permissions: ["DELETE_IMAGES"]}, "DELETE_IMAGES"), false);
    assert.equal(hasPermission({role: "DELETED", permissions: ["ADMIN_ACCESS"]}, "ADMIN_ACCESS"), false);
});

test("admin master switch is required for all sections, not content rights", () => {
    const user = {role: "USER", permissions: ["ADMIN_IMAGES", "DELETE_IMAGES"]};
    assert.equal(canAccessAdminPath(user, "/admin/images"), false);
    assert.equal(hasPermission(user, "DELETE_IMAGES"), true);
    user.permissions.push("ADMIN_ACCESS");
    assert.equal(canAccessAdminPath(user, "/admin/images"), true);
    assert.equal(canAccessAdminPath(user, "/admin/users"), false);
    assert.equal(firstAdminPath(user), "/admin/images");
});

test("permissions management is OWNER only and route boundaries are exact", () => {
    const user = {role: "ADMIN", permissions: PERMISSIONS.map(permission => permission.key)};
    assert.equal(canAccessAdminPath(user, "/admin/permissions"), false);
    assert.equal(canAccessAdminPath({role: "OWNER"}, "/admin/permissions"), true);
    assert.equal(canAccessAdminPath(user, "/admin/images-extra"), false);
    assert.equal(canAccessAdminPath(user, "/admin/images/example"), true);
    assert.equal(canAccessAdminPath(user, "/admin/unknown"), false);
});

test("URL history IP and UA grants are independent from one another and admin access", () => {
    const user = {role: "USER", permissions: ["URL_VIEW_IP"]};
    assert.equal(hasPermission(user, "URL_VIEW_IP"), true);
    assert.equal(hasPermission(user, "URL_VIEW_UA"), false);
    assert.equal(canAccessAdminPath(user, "/admin/urls"), false);
    user.permissions = ["URL_VIEW_UA"];
    assert.equal(hasPermission(user, "URL_VIEW_IP"), false);
    assert.equal(hasPermission(user, "URL_VIEW_UA"), true);
});
