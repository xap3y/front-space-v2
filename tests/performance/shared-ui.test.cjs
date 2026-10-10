const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const React = require("react");
const {renderToStaticMarkup} = require("react-dom/server");
const ts = require("typescript");

const root = path.resolve(__dirname, "../..");
const cache = new Map();

function load(relative) {
    const filename = path.resolve(root, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const moduleValue = {exports: {}};
    cache.set(filename, moduleValue);
    const source = fs.readFileSync(filename, "utf8");
    const compiled = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2020,
            jsx: ts.JsxEmit.ReactJSX,
            esModuleInterop: true,
        },
    }).outputText;

    function localRequire(specifier) {
        if (specifier.endsWith(".css")) {
            return {__esModule: true, default: new Proxy({}, {get: (_, key) => String(key)})};
        }
        if (specifier.startsWith("@/") || specifier.startsWith(".")) {
            const base = specifier.startsWith("@/")
                ? path.join(root, "src", specifier.slice(2))
                : path.resolve(path.dirname(filename), specifier);
            const target = [base, `${base}.tsx`, `${base}.ts`, `${base}/index.tsx`].find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
            return load(target);
        }
        return require(specifier);
    }

    vm.runInNewContext(compiled, {
        module: moduleValue,
        exports: moduleValue.exports,
        require: localRequire,
    }, {filename});
    return moduleValue.exports;
}

const {NativeButton, NativeDeleteButton} = load("src/components/ui/NativeButton.tsx");
const {default: HoverDiv, DeleteButton} = load("src/components/HoverDiv.tsx");
const {default: Pagination} = load("src/components/ui/Pagination.tsx");
const {SelectionInput} = load("src/components/ui/SelectionInput.tsx");
const {default: MainStringInput} = load("src/components/MainStringInput.tsx");

test("disclosure rows use their own full-width presentation", () => {
    const html = renderToStaticMarkup(React.createElement(NativeButton, {
        layout: "row",
        "aria-expanded": true,
    }, "User"));
    assert.match(html, /rowButton/);
    assert.match(html, /aria-expanded="true"/);
    assert.doesNotMatch(html, /layout="row"/);

    for (const page of ["users", "mc-reports"]) {
        const source = fs.readFileSync(path.join(root, `src/app/admin/${page}/client.tsx`), "utf8");
        assert.match(source, /layout="row"/);
    }
});

test("sidebar indicators and settings reuse the shared controls", () => {
    for (const file of ["src/components/Sidebar.tsx", "src/app/admin/AdminNavBar.tsx"]) {
        assert.match(fs.readFileSync(path.join(root, file), "utf8"), /styles\.navIndicator/);
    }
    const settings = fs.readFileSync(path.join(root, "src/app/admin/settings/client.tsx"), "utf8");
    assert.match(settings, /<Toggle/);
    assert.doesNotMatch(settings, /left-6 bg-emerald-300/);
    const disclosure = fs.readFileSync(path.join(root, "src/components/ui/Disclosure.tsx"), "utf8");
    assert.match(disclosure, /useReducedMotion/);
    assert.match(disclosure, /exit=\{\{ height: 0, opacity: 0 \}\}/);
});

test("native actions preserve form semantics and attributes", () => {
    const html = renderToStaticMarkup(React.createElement(NativeButton, {
        type: "submit",
        name: "action",
        value: "save",
        disabled: true,
    }, "Save"));
    assert.match(html, /<button/);
    assert.match(html, /type="submit"/);
    assert.match(html, /name="action"/);
    assert.match(html, /value="save"/);
    assert.match(html, /disabled=""/);
    const implicit = renderToStaticMarkup(React.createElement(NativeButton, null, "Submit"));
    assert.doesNotMatch(implicit, /type="button"/);
});

test("delete actions share one trash icon and accessible compact sizing", () => {
    for (const Component of [DeleteButton, NativeDeleteButton]) {
        const html = renderToStaticMarkup(React.createElement(Component, {"aria-label": "Delete pack"}));
        assert.equal((html.match(/<svg/g) ?? []).length, 1);
        assert.match(html, /aria-label="Delete pack"/);
        assert.match(html, /iconAction/);
    }
    const html = renderToStaticMarkup(React.createElement(DeleteButton, {loading: true, "aria-label": "Deleting"}));
    assert.match(html, /aria-busy="true"/);
    assert.match(html, /aria-disabled="true"/);
});

test("HoverDiv supports keyboard activation and blocks disabled actions", () => {
    let clicks = 0;
    const element = HoverDiv.render({onClick: () => clicks++}, null);
    const event = {
        key: "Enter",
        preventDefault() {},
        stopPropagation() {},
        currentTarget: {click: () => element.props.onClick(event)},
    };
    element.props.onKeyDown(event);
    assert.equal(clicks, 1);
    const disabled = HoverDiv.render({disabled: true, onClick: () => clicks++}, null);
    disabled.props.onClick(event);
    disabled.props.onKeyDown(event);
    assert.equal(clicks, 1);
    assert.equal(disabled.props.tabIndex, -1);
});

test("pagination handles first, last, loading and unknown-total pages", () => {
    let next;
    const first = Pagination({page: 1, pages: 3, onChange: (value) => next = value});
    const buttons = first.props.children[1].props.children;
    assert.equal(buttons[0].props.disabled, true);
    assert.equal(buttons[2].props.disabled, false);
    buttons[2].props.onClick();
    assert.equal(next, 2);

    for (const props of [{page: 3, pages: 3}, {page: 1, pages: 0}, {page: 1, pages: 3, disabled: true}, {page: 2, hasNext: false}]) {
        const element = Pagination(props);
        assert.equal(element.props.children[1].props.children[2].props.disabled, true);
    }
    const unknown = renderToStaticMarkup(React.createElement(Pagination, {page: 2, hasNext: true}));
    assert.match(unknown, /2.*—/);
});

test("checkboxes retain native state, events and disabled behavior", () => {
    let checked = false;
    const input = SelectionInput.render({checked: true, onChange: (event) => checked = event.target.checked}, null);
    assert.equal(input.props.type, "checkbox");
    input.props.onChange({target: {checked: true}});
    assert.equal(checked, true);
    const html = renderToStaticMarkup(React.createElement(SelectionInput, {type: "radio", name: "mode", disabled: true}));
    assert.match(html, /type="radio"/);
    assert.match(html, /name="mode"/);
    assert.match(html, /disabled=""/);
});

test("multiline fields retain form names, labels, constraints and default values", () => {
    const html = renderToStaticMarkup(React.createElement(MainStringInput, {
        multiline: true,
        id: "content",
        name: "content",
        maxLength: 4096,
        defaultValue: "Example content",
        rows: 9,
        required: true,
    }));
    assert.match(html, /<textarea/);
    assert.match(html, /id="content"/);
    assert.match(html, /name="content"/);
    assert.match(html, /maxLength="4096"/);
    assert.match(html, /rows="9"/);
    assert.match(html, /required=""/);
    assert.match(html, />Example content<\/textarea>/);
});

test("ordinary pages do not introduce independent native action buttons", () => {
    function files(directory) {
        return fs.readdirSync(directory, {withFileTypes: true}).flatMap((entry) => {
            const filename = path.join(directory, entry.name);
            return entry.isDirectory() ? files(filename) : entry.name.endsWith(".tsx") ? [filename] : [];
        });
    }
    for (const filename of files(path.join(root, "src"))) {
        if (["HoverDiv.tsx", "CustomVideoPlayer.tsx"].some((name) => filename.endsWith(name))) continue;
        const source = ts.createSourceFile(filename, fs.readFileSync(filename, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
        function walk(node) {
            if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
                assert.notEqual(node.tagName.getText(source), "button", filename);
            }
            ts.forEachChild(node, walk);
        }
        walk(source);
    }
});

test("all paginated resource pages use the central paginator and list shell", () => {
    const pages = [
        "admin/files/client.tsx", "admin/images/client.tsx", "admin/pastes/client.tsx",
        "admin/urls/client.tsx", "admin/users/client.tsx", "admin/invites/client.tsx",
        "admin/emails/client.tsx", "admin/logs/client.tsx", "admin/mc-reports/client.tsx",
        "home/files/client.tsx", "home/gallery/new-client.tsx", "home/pastes/client.tsx",
        "home/urls/new-client.tsx", "pcv/dashboard/client.tsx", "mc/report/dashboard/client.tsx",
    ];
    for (const page of pages) {
        const source = fs.readFileSync(path.join(root, "src/app", page), "utf8");
        assert.match(source, /<Pagination\b/, page);
        assert.match(source, /<ResourceList\b/, page);
    }
});

test("shared style has no press-scale or outer shadow and surfaces are opaque", () => {
    const styles = fs.readFileSync(path.join(root, "src/components/ui/ui.module.css"), "utf8");
    assert.match(styles, /transform: none !important/);
    assert.match(styles, /box-shadow: none !important/);
    assert.match(styles, /\.surface\s*\{[^}]*background: #0a0a0a !important/s);
    assert.match(styles, /\.resourceList\s*\{[^}]*background: #0a0a0a !important/s);
});
