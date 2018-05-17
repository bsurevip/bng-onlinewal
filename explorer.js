/*jslint node: true */
"use strict";
require('./relay');
var conf = require('bng-core/conf.js');
var eventBus = require('bng-core/event_bus.js');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var ws = require('./controllers/ws');
var db = require('bng-core/db.js');
var aesutil = require('./aes.js');

app.use(express.static(__dirname + '/public'));
var bodyParser = require('body-parser');
var router = express.Router();
var multer = require('multer');
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})); // for parsing application/x-www-form-urlencoded

router.post('/upload', multer().single('file'), function (req, res) {// for parsing multipart/form-data
    console.log(req.file);//file
    console.log(req.body);
});

app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By", '3.2.1');
    if (req.method === "OPTIONS") res.send(200);/*让options请求快速返回*/
    else next();
});

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/views/index.html');
});
app.post('/createwallet', function (req, res) {
    var adds = aesutil.encryption("thisisatest", "123456")
    res.json(req.body.psw + adds);
});

app.use(function (req, res, next) {
    // res.header("Content-Type", 'application/json');
    res.status(404).send({code: "404"});
});

eventBus.on('new_joint', function () {
    io.sockets.emit('update');
});

io.on('connection', function (socket) {
    socket.on('start', ws.start);
    socket.on('next', ws.next);
    socket.on('prev', ws.prev);
    socket.on('new', ws.newUnits);
    socket.on('info', ws.info);
    socket.on('highlightNode', ws.highlightNode);
    socket.on('nextPageTransactions', ws.nextPageTransactions);
});

server.listen(conf.webPort);
