var Canvas = require('canvas');
var hl = require('highlight.js');
var htmlparser = require("htmlparser2");
var fs = require('fs');
var path = require('path');
var yaml = require('js-yaml');
var _ = require('lodash');
var tolmach = require('tolmach');

var default_styles = yaml.safeLoad(fs.readFileSync(
    path.join(__dirname, 'themes', 'default.yml'), 'utf8'));

var reduceIndent = function(lines){
    var weights = [];
    var indents = [];
    for(var tsize = 1; tsize <= 8; tsize ++){
        var counters = {};
        _.each(lines, function(line){
            if(/^\s*$/.test(line)) return;
            var counter = 0;
            _.each(line, function(symbol){
                switch(symbol){
                    case " ": counter ++; break;
                    case "\t": counter += (tsize - counter % tsize); break;
                    default: return false;
                }
            });

            counters[counter] = (counters[counter] || 0) + 1;
        });

        delete counters['0'];
        indents[tsize] =  _.min(_.keys(counters));
        weights[tsize] = _.size(counters);
    }

    var optimal = _.min(weights);
    var indent = indents[optimal];

    var result = [];
    _.each(lines, function(line){
        var counter = 0;
        _.each(line, function(symbol){
            switch(symbol){
                case " ": counter ++; break;
                case "\t": counter += (optimal - counter % optimal); break;
                default: return false;
            }
        });

        if(counter >= indent){
            counter -= indent;
        }

        result.push(new Array(counter+1).join(' ') + line.trim());
    });

    return result;
};

var render = function(code, filepath, styles, cb){
    var styles = _.merge(styles || {}, default_styles);

    var subs = [tolmach.detect(code)];
    var canvas = new Canvas(styles.width || 600, 600);
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

            m = ctx.measureText(splitText[0]);
            if(x + m.width > canvas.width){
                x = x0;
                y += lineHeight;
            }
            ctx.fillText(splitText[0], x, y)
            x += m.width;
            for(var i = 1; i < splitText.length; i++){
                y += lineHeight;
                x = x0;
                ctx.fillText(splitText[i], x, y);
                m = ctx.measureText(splitText[i]);
                x += m.width;
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

    var out = fs.createWriteStream(filepath);
    canvas.pngStream().pipe(out);
    out.on('close', cb);
}

module.exports = {
    render: render,
    reduceIndent: reduceIndent
};
