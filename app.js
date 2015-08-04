var jade = require('jade');
var less = require('less');

var http = require('http');
var fs = require('fs');
var _ = require('lodash');
var async = require('async');
var moment = require('moment');
var express = require('express');
var crypto = require('crypto');
var path = require('path');

moment.locale('ru-RU');

var port = 1337;
var address = '127.0.0.1';

var app = express();

var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.set('views', __dirname);
app.set('view engine', 'jade');

// production
//app.use(stylus.middleware({src: __basedir + '/assets', dest: __basedir + '/public'}));

// development
/*
app.get('/:filename.css', function (req, res) {
    var filename = req.params.filename + '.styl';
    var styl = fs.readFileSync(__basedir + '/styles/' + filename, 'utf8');
    stylus.render(styl, { filename: filename, paths: [__basedir + '/styles/'] }, function (err, css) {
        if(err){throw err};
        res.end(css);
    });
});
*/

var example = "var hello = 'world';\nconsole.log(hello);\nconsole.log(hello);\n";

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
    var subs = ['javascript'];
    var html = '<pre><code>' + hl.highlightAuto(example, subs).value + '</pre></code>';
    var shasum = crypto.createHash('sha256');
    shasum.update(example);
    var img = shasum.digest('hex') + '.png'
    var filename = path.join(__dirname, 'public', img);
    var css = fs.readFileSync(path.join(__dirname, 'codestyle.css'));

    var renderStream = webshot('<style>' + css + '</style>' + html, {
        siteType:'html',
        streamType: 'png',
        quality: 100
    });

    var file = fs.createWriteStream(filename, {encoding: 'binary'});

    renderStream.on('data', function(data) {
      file.write(data.toString('binary'), 'binary');
    });

    renderStream.on('end', function(){
        res.render('index', {
            text: html,
            img: img
        });
    });
});

var server = app.listen(8000, function(){
    console.log('Server is listening on http://%s:%d',
        server.address().address, server.address().port);
});
