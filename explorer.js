/*jslint node: true */
"use strict";
require('./relay');
var ecdsaSig = require('bng-core/signature.js');
var Mnemonic = require('bitcore-mnemonic');
var objectHash = require('bng-core/object_hash.js');
var conf = require('bng-core/conf.js');
var eventBus = require('bng-core/event_bus.js');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var ws = require('./controllers/ws');
var db = require('bng-core/db.js');
var units = require('./controllers/units');
var address = require('./controllers/address');
var crypto = require('crypto');
var fs = require('fs');
var NodeRSA = require('node-rsa');
var privatePem = fs.readFileSync('./pem/rsa_private_key.pem');
var publicPem = fs.readFileSync('./pem/rsa_public_key.pem');
var prvkeys = privatePem.toString();
var pubkeys = publicPem.toString();
var key = new NodeRSA(prvkeys);
var pubkey = new NodeRSA(pubkeys);
var payment = require('./controllers/js/controllers/payment.js');
key.setOptions({encryptionScheme: 'pkcs1'});
pubkey.setOptions({encryptionScheme: 'pkcs1'});

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

/**
 * 获取公钥，rsa加密后服务端解密
 */
app.post('/getPublicKey', function (req, res) {
    res.json(pubkeys);
});

/**
 * 转账
 * rsa加密json字符串
 * {\n" +
    "    \"sign\": \"{\\\"type\\\":\\\"Buffer\\\",\\\"data\\\":[99,29,214,15,128,87,218,64,154,92,27,187,170,28,18,119,144,242,135,97,58,34,226,61,63,51,219,81,88,97,26,34]}\",\n" +
    "    \"definition\": [\n" +
    "        \"sig\",\n" +
    "        {\n" +
    "            \"pubkey\": \"Ah4HIrzd+9JPPqqjCw1a/5rSUGw7X4s2yPGdC8jR0CvY\"\n" +
    "        }\n" +
    "    ],\n" +
    "    \"address\": \"IBTDIDUIVJGOCTDE7QFSV4I7AXMPPX3N\",\n" +
    "    \"sendto\": [\n" +
    "        {\n" +
    "            \"address\": \"IBTDIDUIVJGOCTDE7QFSV4I7AXMPPX3N\",\n" +
    "            \"amount\": 100\n" +
    "        }\n" +
    "    ]\n" +
    "}
 */
app.post('/pay', function (req, res) {
    var data = JSON.parse(key.decrypt(req.body.data, 'utf8'));
    payment(data.address, JSON.parse(data.sign).data, data.definition, data.sendto, function (err, data) {
        if (err)
            res.status(500).send({err: err});
        res.json(data);
    });
});
/**
 *
 */
app.post('/addressinfo', function (req, res) {
    address.getAddressInfo(req.body.address, function (objTransactions, unspent, objBalance, end, definition, newLastInputsROWID, newLastOutputsROWID) {
        var addressInfo = {
            address: req.body.address,
            objTransactions: objTransactions,
            unspent: unspent,
            objBalance: objBalance,
            end: end,
            definition: definition,
            newLastInputsROWID: newLastInputsROWID,
            newLastOutputsROWID: newLastOutputsROWID
        }
        res.json(addressInfo);
    });
});
app.post('/getAddressTransactions', function (req, res) {
    var inid = req.body.lastInputsROWID || 0;
    var outid = req.body.lastOutputsROWID || 0;
    address.getAddressTransactions(req.body.address, inid, outid, function (objTransactions, newLastInputsROWID, newLastOutputsROWID) {
        var Transactions = {
            address: req.body.address,
            objTransactions: objTransactions,
            end: objTransactions === null || Object.keys(objTransactions).length < 5,
            newLastInputsROWID: newLastInputsROWID,
            newLastOutputsROWID: newLastOutputsROWID
        };
        res.json(Transactions);
    });
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
