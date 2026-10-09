const assert = require("node:assert/strict");
const {readFileSync} = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const source = readFileSync(path.join(__dirname, "../../src/lib/echarts.ts"), "utf8");
const compiled = ts.transpileModule(source, {
    compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
    },
}).outputText;
const moduleExports = {exports: {}};

vm.runInNewContext(compiled, {
    module: moduleExports,
    exports: moduleExports.exports,
    require,
});

const echarts = moduleExports.exports.default;
// Use SVG only in tests to exercise chart registration without a browser/canvas.
echarts.use([require("echarts/renderers").SVGRenderer]);

function renderChart(option) {
    const chart = echarts.init(null, null, {
        renderer: "svg",
        ssr: true,
        width: 800,
        height: 360,
    });

    try {
        chart.setOption(option);
        return chart.renderToSVGString();
    } finally {
        chart.dispose();
    }
}

test("modular charts retain lines, bars, axes, zoom, legend and toolbox", () => {
    const html = renderChart({
        grid: {containLabel: true},
        tooltip: {trigger: "axis", axisPointer: {type: "cross"}},
        legend: {type: "scroll"},
        toolbox: {
            feature: {
                dataZoom: {yAxisIndex: "none"},
                restore: {},
                saveAsImage: {},
            },
        },
        dataZoom: [{type: "inside"}, {type: "slider"}],
        xAxis: {type: "category", data: ["Monday", "Tuesday"]},
        yAxis: {type: "value"},
        series: [
            {name: "Uploads", type: "line", areaStyle: {}, data: [2, 4]},
            {name: "Storage", type: "bar", data: [1, 3]},
        ],
    });

    assert.ok(html.includes("<svg"));
    assert.ok(html.includes("Monday"));
    assert.ok(html.includes("Uploads"));
    assert.ok(html.includes("Storage"));
});

test("modular charts retain pie breakdowns and graphic labels", () => {
    const html = renderChart({
        tooltip: {trigger: "item"},
        legend: {type: "scroll"},
        graphic: [{
            type: "text",
            left: "center",
            top: "center",
            style: {text: "Total uploads"},
        }],
        series: [{
            type: "pie",
            radius: ["40%", "70%"],
            data: [{name: "Images", value: 3}, {name: "Files", value: 2}],
        }],
    });

    assert.ok(html.includes("Images"));
    assert.ok(html.includes("Files"));
    assert.ok(html.includes("Total uploads"));
});
