

var code2image = require('../code2image');
var assert = require('assert');
var path = require('path');
var fs = require('fs');

var code = "var hello = 'hello';\nvar world = 'world';\nconsole.log(hello + ' ' + world);";

var codeWithIndent = fs.readFileSync(path.join(__dirname, 'example', 'code_with_tabs.txt'), 'utf8');

describe('code2image',function(){
    it('should render an image by a snippet of a code', function(done){
        code2image.render(code, path.join(__dirname, 'test.png'), undefined, function(){
            setTimeout(function(){
                done();
            }, 500);
        });
    })

    it('should reduce indent', function(){
        var result = code2image.reduceIndent(codeWithIndent);
        assert.equal(result.replace(/ /g, '_'), [
            'setTimeout(function(){',
            "\u0020\u0020\u0020\u0020console.log(\"Hello World!\");",
            '});\n'
        ].join("\n").replace(/ /g, '_'));
    });
});
