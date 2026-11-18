const code2image = require('../code2image');
const fs = require('node:fs');
const path = require('node:path');

const code = fs.readFileSync(path.join(__dirname, 'big.txt'), 'utf8');

code2image.render(code, path.join(__dirname, 'big.png'), {
    width: 640,
    lineHeight: 16,
    fontRatio: 0.7
}, function (err) {
    if (err) {
        console.error(err);
        process.exitCode = 1;
        return;
    }

    console.log('wrote big.png');
});
