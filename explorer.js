/*jslint node: true */
"use strict";
require('./relay');
var constants = require('bng-core/constants.js');
var validationUtils = require("bng-core/validation_utils.js");
var conf = require('bng-core/conf.js');
var Wallet = require('bng-core/wallet.js');
var eventBus = require('bng-core/event_bus.js');
var divisibleasset = require('bng-core/divisible_asset.js');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var ws = require('./controllers/ws');
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

var async = require('async');


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

// {asset: asset, paying_addresses: arrPayingAddresses, fee_paying_addresses: arrFeePayingAddresses, change_address: change_address, to_address: to_address, amount: amount, signer: signer, callbacks: callbacks}
app.post('/payasset', function (req, res) {
  var params = JSON.parse(key.decrypt(req.body.data, 'utf8'));
  params.signer = payment.getsigner(JSON.parse(params.sign).data);
  var composer = require('bng-core/composer.js');
  var network = require('bng-core/network.js');
  params.callbacks = divisibleasset.getSavingCallbacks({
    ifNotEnoughFunds: function (err) {
      res.status(500).send({err: err})
    },
    ifError: function (err) {
      res.status(500).send({err: err})
    },
    ifOk: function (objJoint) {
      network.broadcastJoint(objJoint);
      res.json(null, objJoint)
    }
  });
  divisibleasset.composeAndSaveDivisibleAssetPaymentJoint(params);
});

app.post('/getBalances', function (req, res) {
  Wallet.readBalancesOnAddresses(req.body.wallet, function (assocBalances) {
    res.json(assocBalances);
  });
});

/**
 * mnemonics文本币12个单词
 * address接收地址
 */
app.post('/receiveTextCoin', function (req, res) {
  Wallet.receiveTextCoin(req.body.mnemonics, req.body.address, function (err, unit, asset) {
    if (err) {
      res.status(500).send({err: err})
    } else {
      res.json({unit: unit});
    }
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
/*
app.post('/getAssetMetadata', function (req, res) {
    device.requestFromHub('hub/get_asset_metadata', req.body.asset, function (err, response) {
        if (err)
            res.json(err);
        res.json(response)
    });
}); */

/**
 * 取资产元数据
 */
app.post('/getAssetMetadata', function (req, res) {
  Wallet.fetchAssetMetadata(req.body.asset, function (err, asset) {
    if (err) {
      res.json({errcode: 1, errmsg: err});
    }
    res.json(asset);
  });
});

/**
 * 读取余额
 */
app.post('/getBalance', function (req, res) {
  balance.readOutputsBalance(req.body.address, function (balance) {
    res.send(balance);
  })
});

app.post('/getAssetBalance', function (req, res) {
  balance.readOutputsBalance(req.body.address, function (balance) {
    var assetBalances = [];
    async.forEachOf(balance, function (value, key, callback) {
      if (key == "base") {
        var item = {assetid: key, name: 'DAG', stable: value.stable, pending: value.pending};
        assetBalances.push(item);
        callback();
      }
      else {
        Wallet.fetchAssetMetadata(key, function (err, asset) {
          if (!err) {
            var item = {assetid: key, name: asset.name, stable: value.stable, pending: value.pending};
            assetBalances.push(item);
          }
          callback();
        });
      }

    }, function (err) {
      if (err) console.error(err.message);

      res.send(assetBalances);
    });
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
