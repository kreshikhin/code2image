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
var code2image = require('./code2image');

moment.locale('ru-RU');

var port = 1337;
var address = '127.0.0.1';

var app = express();

var CNAME = fs.readFileSync(path.join(__dirname, 'CNAME'), 'utf8');

var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.set('views', __dirname);
app.set('view engine', 'jade');

app.use(express.static(__dirname + '/scripts'));
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/assets'));

app.get('/', function(req, res){
    res.render('index');
});

app.post('/', function(req, res){
    var subs = ['javascript'];

    var code = req.body.code;

    var shasum = crypto.createHash('sha256');
    shasum.update(code);
    var image = shasum.digest('hex').substring(0, 12) + '.png'

    code2image(code, 'public/' + image, {}, function(){
        console.log('finished?');

        res.send({
            status: 'ok',
            image: image,
            cname: CNAME
        });
    });
});


var server = app.listen(8000, function(){
    console.log('Server is listening on http://%s:%d',
        server.address().address, server.address().port);
});
