var c2i = require('../code2image');
var fs = require('fs');
var path = require('path');

var code = fs.readFileSync('small.txt', 'utf8');

c2i.render(code, path.join(__dirname, 'small.png'), {
    width: 640,
    fontName: 'AnonymousPro',
    lineHeight: 16,
    fontRatio: 0.55
}, function(){
    console.log('ok!');
});
