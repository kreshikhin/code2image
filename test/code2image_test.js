'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { after, describe, it } = require('node:test');
const { createCanvas, loadImage } = require('canvas');
const code2image = require('../code2image');

const snippet = "var hello = 'hello';\nvar world = 'world';\nconsole.log(hello + ' ' + world);";
const dedented = [
    'setTimeout(function(){',
    '    console.log("Hello World!");',
    '});',
    ''
].join('\n');

const codeWithIndent = fs.readFileSync(path.join(__dirname, 'example', 'code_with_tabs.txt'), 'utf8');
const codeWithoutIndent = fs.readFileSync(path.join(__dirname, 'example', 'code.txt'), 'utf8');

function render(code, filepath, styles) {
    return new Promise((resolve, reject) => {
        code2image.render(code, filepath, styles, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

function temporaryPng(name) {
    return path.join(os.tmpdir(), 'code2image-' + name + '-' + process.pid + '.png');
}

async function pixelsOf(filepath) {
    const image = await loadImage(filepath);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(image, 0, 0);

    return {
        width: image.width,
        height: image.height,
        data: ctx.getImageData(0, 0, image.width, image.height).data
    };
}

function pngSize(buffer) {
    return {
        width: buffer.readUInt32BE(16),
        height: buffer.readUInt32BE(20)
    };
}

function hasGreen(data) {
    for (let index = 0; index < data.length; index += 4) {
        const red = data[index];
        const green = data[index + 1];
        const blue = data[index + 2];
        const alpha = data[index + 3];

        if (alpha > 200 && green > red + 30 && green > blue + 30) {
            return true;
        }
    }

    return false;
}

function hasBlue(data) {
    for (let index = 0; index < data.length; index += 4) {
        const red = data[index];
        const green = data[index + 1];
        const blue = data[index + 2];
        const alpha = data[index + 3];

        if (alpha > 200 && blue > red + 30 && blue > green + 30) {
            return true;
        }
    }

    return false;
}

describe('code2image', function () {
    const files = [];

    after(function () {
        for (const file of files) {
            fs.rmSync(file, { force: true });
        }
    });

    it('renders a PNG with highlighted strings', async function () {
        const filepath = temporaryPng('render');
        files.push(filepath);

        await render(snippet, filepath);

        const buffer = fs.readFileSync(filepath);
        const size = pngSize(buffer);

        assert.ok(buffer.length > 32);
        assert.strictEqual(buffer.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
        assert.strictEqual(size.width, 600);
        assert.strictEqual(size.height, 90);

        const image = await pixelsOf(filepath);
        assert.deepStrictEqual([image.data[0], image.data[1], image.data[2]], [255, 255, 255]);
        assert.ok(hasGreen(image.data), 'string literals should be drawn in green');
    });

    it('accepts a callback as the third argument and custom styles', async function () {
        const filepath = temporaryPng('styles');
        files.push(filepath);

        await render(snippet, filepath, {
            width: 480,
            background: '#112233',
            string: 'blue'
        });

        const image = await pixelsOf(filepath);

        assert.strictEqual(image.width, 480);
        assert.deepStrictEqual(
            [image.data[0], image.data[1], image.data[2]],
            [0x11, 0x22, 0x33]
        );
        assert.ok(hasBlue(image.data), 'custom string color should be applied');
    });

    it('does not leak custom styles into the next render', async function () {
        const customPath = temporaryPng('custom');
        const defaultPath = temporaryPng('default');
        files.push(customPath, defaultPath);

        await render(snippet, customPath, { background: 'red', string: 'blue' });
        await render(snippet, defaultPath);

        const image = await pixelsOf(defaultPath);
        assert.deepStrictEqual([image.data[0], image.data[1], image.data[2]], [255, 255, 255]);
        assert.ok(hasGreen(image.data));
    });

    it('reports write errors through the callback', async function () {
        const filepath = path.join(os.tmpdir(), 'code2image-missing-' + process.pid, 'out.png');

        await assert.rejects(render(snippet, filepath), { code: 'ENOENT' });
    });

    it('rejects invalid arguments', async function () {
        await assert.rejects(render(null, 'out.png', {}), TypeError);
    });

    it('requires a callback', function () {
        assert.throws(() => code2image.render(snippet, 'out.png'), TypeError);
    });

    it('removes a shared indent made of spaces', function () {
        assert.strictEqual(code2image.reduceIndent(codeWithIndent), dedented);
        assert.strictEqual(code2image.reduceIndent(codeWithoutIndent), dedented);
    });

    it('expands tabs with a consistent width and removes the shared indent', function () {
        const tabbed = [
            '\tsetTimeout(function(){',
            '\t\tconsole.log("Hello World!");',
            '\t});',
            ''
        ].join('\n');

        assert.strictEqual(code2image.reduceIndent(tabbed), dedented);
    });

    it('returns the languages known to the highlighter', function () {
        const languages = code2image.listLanguages();

        assert.ok(Array.isArray(languages));
        assert.ok(languages.length > 10);
        assert.ok(languages.includes('javascript'));
    });
});
