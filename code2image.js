var Canvas = require('canvas');
var webshot = require('webshot');
var hl = require('highlight.js');
var htmlparser = require("htmlparser2");
var fs = require('fs');
var path = require('path');
var yaml = require('js-yaml');
var _ = require('lodash');

var default_styles = yaml.safeLoad(fs.readFileSync(
    path.join(__dirname, 'themes', 'default.yml'), 'utf8'));

function Code2Image(code, name, styles){
    var styles = _.merge(styles || {}, default_styles);

    var subs = ['javascript'];
    var canvas = new Canvas(600, 600);
    var ctx = canvas.getContext('2d');

    ctx.fillStyle = styles.background;
    ctx.fillRect(0,0, canvas.width, canvas.height);
    ctx.fillStyle = styles.color;

    var lineHeight = parseInt(styles.lineHeight);
    var x0 = 30;
    var x = 30;
    var y = 30;

    ctx.font = styles.font;

    var parser = new htmlparser.Parser({
        onopentag: function(name, attribs){
            if(name === "span"){
                console.log(attribs.class);
                var name = attribs.class.replace('hljs-', '');
                if(styles[name]){
                    ctx.fillStyle = styles[name];
                }
            }
        },
        ontext: function(text){
            // draw text
            splitText = text.split("\n");
            console.log(splitText);
            ctx.fillText(splitText[0], x, y)
            m = ctx.measureText(splitText[0]);
            x += m.width;
            for(var i = 1; i < splitText.length; i++){
                y += lineHeight;
                ctx.fillText(splitText[i], x, y);
                m = ctx.measureText(splitText[i]);
                x = x0 + m.width;
            }
        },
        onclosetag: function(tagname){
            if(tagname === "span"){
                ctx.fillStyle = styles.color;
            }
        }
    }, {decodeEntities: true});

    parser.write(hl.highlightAuto(code, subs).value);
    parser.end();

    var out = fs.createWriteStream(path.join(__dirname, name));
    canvas.pngStream().pipe(out);
}

module.exports = Code2Image;
