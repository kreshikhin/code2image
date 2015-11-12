var c2i = require('../code2image');
var fs = require('fs');
var path = require('path');

var code = fs.readFileSync('64lines.txt', 'utf8');

c2i.render(code, path.join(__dirname, '64lines.png'), {
    width: 640,
    fontName: 'AnonymousPro',
    lineHeight: 16,
    fontRatio: 0.55
}, function(){
    console.log('ok!');
});
