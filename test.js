var code2image = require('./code2image');

var code = "var hello = 'hello';\nvar world = 'world';\nconsole.log(hello + ' ' + world);";

code2image(code, 'test.png');

setTimeout(process.exit, 500);
