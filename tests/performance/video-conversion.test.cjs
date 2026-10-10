const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const filename = path.resolve(__dirname, "../../src/lib/mp4Codec.ts");
const moduleValue = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, {
    exports: moduleValue.exports,
    module: moduleValue,
    DataView,
    Uint8Array,
    Set,
    BigInt,
    Number,
    String,
});
const { inspectMp4Codec } = moduleValue.exports;

function box(type, ...payloads) {
    const payload = Buffer.concat(payloads);
    const header = Buffer.alloc(8);
    header.writeUInt32BE(payload.length + 8);
    header.write(type, 4);
    return Buffer.concat([header, payload]);
}

function track(codec) {
    const flagsAndCount = Buffer.alloc(8);
    flagsAndCount.writeUInt32BE(1, 4);
    return box("trak", box("mdia", box("minf", box("stbl",
        box("stsd", flagsAndCount, box(codec)),
    ))));
}

test("MP4 metadata identifies AVC, HEVC and mixed video tracks", async () => {
    for (const codec of ["avc1", "avc3"]) {
        assert.equal(await inspectMp4Codec(new Blob([box("moov", track(codec))])), "h264");
    }
    assert.equal(await inspectMp4Codec(new Blob([box("moov", track("hvc1"))])), "hvc1");
    assert.equal(await inspectMp4Codec(new Blob([box("moov", track("avc1"), track("hev1"))])), "hev1");
    assert.equal(await inspectMp4Codec(new Blob([box("moov", track("encv"))])), null);
});

test("inspection skips gigabytes of media data and handles metadata at EOF", async () => {
    const mediaSize = 1024 * 1024 * 1024;
    const header = Buffer.alloc(8);
    header.writeUInt32BE(mediaSize);
    header.write("mdat", 4);
    const metadata = box("moov", track("hvc1"));
    let bytesRead = 0;
    const virtualFile = {
        size: mediaSize + metadata.length,
        slice(start, end) {
            bytesRead += end - start;
            const data = Buffer.alloc(end - start);
            for (let offset = start; offset < end; offset++) {
                if (offset < 8) data[offset - start] = header[offset];
                if (offset >= mediaSize) data[offset - start] = metadata[offset - mediaSize];
            }
            return new Blob([data]);
        },
    };
    assert.equal(await inspectMp4Codec(virtualFile), "hvc1");
    assert.ok(bytesRead < 512, "Should read headers, not the media payload");
});

test("malformed or unsupported metadata never claims H.264 compatibility", async () => {
    assert.equal(await inspectMp4Codec(new Blob([Buffer.from("invalid mp4")])), null);
    assert.equal(await inspectMp4Codec(new Blob([box("moov", track("mp4a"))])), null);
    const invalid = box("moov", track("avc1"));
    invalid.writeUInt32BE(invalid.length + 1);
    assert.equal(await inspectMp4Codec(new Blob([invalid])), null);
});

test("upload opt-in is carried into server registration for both storage paths", () => {
    const root = path.resolve(__dirname, "../..");
    const image = fs.readFileSync(path.join(root, "src/app/a/image/client.tsx"), "utf8");
    const cloud = fs.readFileSync(path.join(root, "src/lib/client.tsx"), "utf8");
    const pack = fs.readFileSync(path.join(root, "src/app/files/client.tsx"), "utf8");
    assert.match(image, /formData.append\("convertToH264", String\(convertVideo\)\)/);
    assert.match(cloud, /spaceFormData.append\("convertToH264"/);
    assert.match(pack, /convertToH264: Boolean\(file.convertToH264\)/);
    const controls = fs.readFileSync(path.join(root, "src/components/VideoConversionControl.tsx"), "utf8");
    assert.match(controls, /state.codec === "h264"/);
    assert.doesNotMatch(controls, /conversion (is )?not (needed|required)/i);
    assert.match(controls, /<progress/);
});
