/*jslint node: true */
"use strict";
// var fs = require('fs');
// var configPath = "../wallets/";
// var payingConfigFile = configPath + "paying-config.json";
// var payeeConfigFile = configPath + "payee-config.json";
// var paying_address;
// var payee_address;
// var walletdata;

// var eventBus = require('bng-core/event_bus.js');
var objectHash = require('bng-core/object_hash.js');
var ecdsaSig = require('bng-core/signature.js');
var Mnemonic = require('bitcore-mnemonic');

function signWithLocalPrivateKey(mnemonic_phrase, passphrase, account, is_change, address_index) {
  var mnemonic = new Mnemonic(mnemonic_phrase);
  var xPrivKey = mnemonic.toHDPrivateKey(passphrase);
  var path = "m/44'/0'/" + account + "'/" + is_change + "/" + address_index;
  var privateKey = xPrivKey.derive(path).privateKey;
  var privKeyBuf = privateKey.bn.toBuffer({size: 32}); // https://github.com/bitpay/bitcore-lib/issues/47
  return privKeyBuf;
}

module.exports.getsigner = getsigner
module.exports.createPayment = function createPayment(address, key, definition, outputs, cb) {
  var signer = getsigner(key, definition);
  var composer = require('bng-core/composer.js');
  var network = require('bng-core/network.js');
  var callbacks = composer.getSavingCallbacks({
    ifNotEnoughFunds: function (err) {
      cb(err)
    },
    ifError: function (err) {
      cb(err)
    },
    ifOk: function (objJoint) {
      network.broadcastJoint(objJoint);
      cb(null, objJoint)
    }
  });

  var arrOutputs = [
    {address: address, amount: 0},      // the change
    // {address: payee_address, amount: 100}  // the receiver
  ];
  var out = arrOutputs.concat(outputs);
  composer.composePaymentJoint([address], out, signer, callbacks);
}
function getsigner(key, definition) {
  return {
    readSigningPaths: function (conn, address, handleLengthsBySigningPaths) {
      handleLengthsBySigningPaths({r: 88});
    },
    readDefinition: function (conn, address, handleDefinition) {
      handleDefinition(null, definition);
    },
    sign: function (objUnsignedUnit, assocPrivatePayloads, address, signing_path, handleSignature) {
      var buf_to_sign = objectHash.getUnitHashToSign(objUnsignedUnit);
      // var derivedPrivateKey = signWithLocalPrivateKey(
      //     walletdata["mnemonic_phrase"],
      //     walletdata["passphrase"],
      //     0,
      //     walletdata["is_change"],
      //     walletdata["address_index"]
      // );
      handleSignature(null, ecdsaSig.sign(buf_to_sign, new Buffer(key)));
    }
  }
}
// function loadWalletConfig(onDone) {
//     var data = fs.readFileSync(payingConfigFile, 'utf8');
//     walletdata = JSON.parse(data);
//     paying_address = 'IBTDIDUIVJGOCTDE7QFSV4I7AXMPPX3N';
//
//     payee_address = 'N4PCD3NG6JUT5B2YBBGJ6HJCO4JS37XH';
//
//     onDone();
// }
// loadWalletConfig(function () {
//     createPayment();
//     // setInterval(createPayment, 1000 * 30);
// });



