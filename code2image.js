'use strict';

const { createCanvas } = require('canvas');
const fs = require('node:fs');
const path = require('node:path');
const { pipeline } = require('node:stream');
const hljs = require('highlight.js');
const yaml = require('js-yaml');

const DEFAULT_WIDTH = 600;
const PADDING_X = 20;
const FIRST_BASELINE = 30;

const defaultStyles = yaml.load(fs.readFileSync(
    path.join(__dirname, 'themes', 'default.yml'),
    'utf8'
));

function parsePx(value, fallback) {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function leadingColumns(line, tabSize) {
    let column = 0;

    for (let index = 0; index < line.length; index++) {
        const symbol = line[index];

        if (symbol === ' ') {
            column += 1;
        } else if (symbol === '\t') {
            column += tabSize - (column % tabSize);
        } else {
            break;
        }
    }

    return column;
}

// Choose the tab width that collapses indentation to the fewest distinct
// columns. Equal scores stay near 4 spaces, which keeps tab-only code readable.
function detectTabSize(lines) {
    let bestTabSize = 4;
    let bestScore = Infinity;
    let bestDistance = Math.abs(bestTabSize - 4);

    for (let tabSize = 1; tabSize <= 8; tabSize++) {
        const columns = new Set();

        for (const line of lines) {
            if (/^\s*$/.test(line)) {
                continue;
            }

            columns.add(leadingColumns(line, tabSize));
        }

        const score = columns.size;
        const distance = Math.abs(tabSize - 4);

        if (score < bestScore || (score === bestScore && distance < bestDistance)) {
            bestScore = score;
            bestDistance = distance;
            bestTabSize = tabSize;
        }
    }

    return bestTabSize;
}

function reduceIndent(code) {
    const lines = String(code).split('\n');
    const tabSize = detectTabSize(lines);
    let baseIndent = Infinity;

    for (const line of lines) {
        if (/^\s*$/.test(line)) {
            continue;
        }

        baseIndent = Math.min(baseIndent, leadingColumns(line, tabSize));
    }

    if (!Number.isFinite(baseIndent)) {
        baseIndent = 0;
    }

    return lines.map((line) => {
        const column = Math.max(0, leadingColumns(line, tabSize) - baseIndent);
        return ' '.repeat(column) + line.trim();
    }).join('\n');
}

function countOfLines(code) {
    return code.split('\n').length;
}

function maxLineLength(code) {
    return code.split('\n').reduce((max, line) => Math.max(max, line.length), 0);
}

function parseStyle(value) {
    const parts = String(value).trim().split(/\s+/);

    return {
        color: parts[0],
        weight: parts[1]
    };
}

function getOptimalFontSize(charCount, width, styles) {
    const fontMinSize = parsePx(styles.fontMinSize, 12);
    const fontSize = parsePx(styles.fontSize, 16);
    const ratio = Number(styles.fontRatio) || 0.7;

    if (!charCount) {
        return fontSize;
    }

    let size = Math.round(width / (ratio * charCount));

    if (size < fontMinSize) {
        size = fontMinSize;
    }

    if (size > fontSize) {
        size = fontSize;
    }

    return size;
}

function fontFamily(name) {
    const family = name || 'monospace';
    return /[\s,]/.test(family) ? '"' + family + '"' : family;
}

function resolveStyles(overrides) {
    return Object.assign({}, defaultStyles, overrides || {});
}

function decodeHtml(text) {
    return text
        .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(Number(num)))
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

function styleFromClass(className, styles) {
    let matched = null;

    for (const token of String(className).split(/\s+/)) {
        if (!token) {
            continue;
        }

        const name = token.replace(/^hljs-/, '').replace(/_$/, '');

        if (styles[name]) {
            matched = parseStyle(styles[name]);
        }
    }

    return matched;
}

// highlight.js emits a small HTML subset: text plus nested spans.
function walkHighlightHtml(html, handlers) {
    const token = /<span\b[^>]*class="([^"]*)"[^>]*>|<\/span>|([^<]+)/g;
    let match;

    while ((match = token.exec(html)) !== null) {
        if (match[1] !== undefined) {
            handlers.onOpen(match[1]);
        } else if (match[0] === '</span>') {
            handlers.onClose();
        } else {
            handlers.onText(decodeHtml(match[2]));
        }
    }
}

function highlightCode(code) {
    return hljs.highlightAuto(code).value;
}

function draw(code, styles) {
    const width = parsePx(styles.width, DEFAULT_WIDTH);
    const lineHeight = parsePx(styles.lineHeight, 20);
    const height = Math.max(1, FIRST_BASELINE + lineHeight * countOfLines(code));
    const fontSize = getOptimalFontSize(maxLineLength(code), width - 2 * PADDING_X, styles);
    const font = fontSize + 'px ' + fontFamily(styles.fontName);
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const styleStack = [];

    let x = PADDING_X;
    let y = FIRST_BASELINE;

    ctx.fillStyle = styles.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    applyStyle(null);

    function currentStyle() {
        for (let index = styleStack.length - 1; index >= 0; index--) {
            if (styleStack[index]) {
                return styleStack[index];
            }
        }

        return null;
    }

    function applyStyle(style) {
        ctx.fillStyle = style && style.color ? style.color : styles.color;
        ctx.font = style && style.weight ? style.weight + ' ' + font : font;
    }

    function drawText(text) {
        const parts = text.split('\n');
        let measured = ctx.measureText(parts[0]);

        if (x + measured.width > canvas.width) {
            x = PADDING_X;
            y += lineHeight;
        }

        ctx.fillText(parts[0], x, y);
        x += measured.width;

        for (let index = 1; index < parts.length; index++) {
            y += lineHeight;
            x = PADDING_X;
            ctx.fillText(parts[index], x, y);
            measured = ctx.measureText(parts[index]);
            x += measured.width;
        }
    }

    walkHighlightHtml(highlightCode(code), {
        onOpen(className) {
            const style = styleFromClass(className, styles);
            styleStack.push(style);
            applyStyle(style || currentStyle());
        },
        onText: drawText,
        onClose() {
            styleStack.pop();
            applyStyle(currentStyle());
        }
    });

    return canvas;
}

function render(code, filepath, styles, cb) {
    if (typeof styles === 'function') {
        cb = styles;
        styles = null;
    }

    if (typeof cb !== 'function') {
        throw new TypeError('callback must be a function');
    }

    let canvas;

    try {
        if (typeof code !== 'string') {
            throw new TypeError('code must be a string');
        }

        if (typeof filepath !== 'string' || filepath.length === 0) {
            throw new TypeError('filepath must be a non-empty string');
        }

        canvas = draw(reduceIndent(code), resolveStyles(styles));
    } catch (err) {
        process.nextTick(() => cb(err));
        return;
    }

    pipeline(canvas.createPNGStream(), fs.createWriteStream(filepath), (err) => {
        cb(err || null);
    });
}

function listLanguages() {
    return hljs.listLanguages();
}

module.exports = {
    render,
    reduceIndent,
    listLanguages
};
