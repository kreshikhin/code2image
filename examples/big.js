var c2i = require('../code2image');
var fs = require('fs');
var path = require('path');

var code = fs.readFileSync('big.txt', 'utf8');

c2i.render(code, path.join(__dirname, 'big.png'), {
    width: 640,
    fontName: 'NotCourierSans',
    lineHeight: 16,
    fontRatio: 0.7
}, function(){
    console.log('ok!');
});
