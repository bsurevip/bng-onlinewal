/*jslint node: true */
"use strict";
require('./relay');
var constants = require('bng-core/constants.js');
var validationUtils = require("bng-core/validation_utils.js");
var conf = require('bng-core/conf.js');
var Wallet = require('bng-core/wallet.js');
var eventBus = require('bng-core/event_bus.js');
var express = require('express');
var storage = require('bng-core/storage.js');
var app = express();
var network = require('bng-core/network.js');
var server = require('http').Server(app);
var io = require('socket.io')(server);
var ws = require('./controllers/ws');
var db = require('bng-core/db.js');
var balance = require('bng-core/balances.js');
var units = require('./controllers/units');
var address = require('./controllers/address');
var fs = require('fs');
var device = require('bng-core/device.js');
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
device.setDeviceHub(conf.hub);
app.use(express.static(__dirname + '/dist'));
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
    res.sendFile(__dirname + '/dist/index.html');
});

/**
 * 获取公钥，rsa加密后服务端解密
 */
app.post('/getPublicKey', function (req, res) {
    res.json(pubkeys);
});
app.post('/verifyAsset', function (req, res) {
    if (req.body.asset && validationUtils.isValidBase64(req.body.asset, constants.HASH_LENGTH))
        res.json(true);
    res.json("invalid asset");
});
app.post('/verifyAddress', function (req, res) {
    if (req.body.address && validationUtils.isValidAddress(req.body.address))
        res.json(true);
    res.json("invalid address");
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

app.post('/getBalances', function (req, res) {
    Wallet.readBalancesOnAddresses(req.body.wallet, function (assocBalances) {
        res.json(assocBalances);
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
/**
 * 获取unit信息
 */
app.post('/getInfoOnUnit', function (req, res) {
    units.getInfoOnUnit(req.body.unit, function (data) {
        res.json(data);
    });
});
/**
 * asset unit数组
 */
app.post('/getAssetMetadata', function (req, res) {
    device.requestFromHub('hub/get_asset_metadata', req.body.asset, function (err, response) {
        if (err)
            res.json(err);
        res.json(response)
    });
});


/**
 * 读取资产信息
 */
app.get('/assetMetadata', function (req, res) {
    var args = ['/YOzJmia41dvedNaRTq6rBHkLRS48qL3U3zQqZDQF/I=','uuBT2swAX4UJ0RB8HHUv4LAjNz6KvY/WcXK0F22lIjc='];

    var assetid = 'xAEOzHr9SfwIt090RXquP91wRUpgH2oZQoEN0eXbU2o=';
    //var args = null;
    Wallet.fetchAssetMetadata(req.query.unit, function (err,asset) {
        res.send(asset)
       });
     
});

/**
 * 读取余额
 */
app.get('/balance',function(req,res){
    balance.readOutputsBalance(req.query.address,function(balance){
        res.send(balance);
    })
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
