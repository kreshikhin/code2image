

var code2image = require('../code2image');
var assert = require('assert');
var path = require('path');

var code = "var hello = 'hello';\nvar world = 'world';\nconsole.log(hello + ' ' + world);";

describe('code2image',function(){
    it('should render an image by a snippet of a code', function(done){
        code2image.render(code, path.join(__dirname, 'test.png'), undefined, function(){
            setTimeout(function(){
                process.exit();
                done();
            }, 500);
        });
    })
});
