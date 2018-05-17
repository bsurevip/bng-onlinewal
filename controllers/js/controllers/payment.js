/*jslint node: true */
"use strict";
const fs = require('fs');
const eventBus = require('bng-core/event_bus.js');
var objectHash = require('bng-core/object_hash.js');
const configPath = "../wallets/";
const payingConfigFile = configPath + "paying-config.json";
const payeeConfigFile = configPath + "payee-config.json";
let paying_address;
let payee_address;
var ecdsaSig = require('bng-core/signature.js');
let Mnemonic = require('bitcore-mnemonic');
let walletdata;
function onError(err) {
    throw Error(err);
}

function loadWalletConfig(onDone) {
    let data = fs.readFileSync(payingConfigFile, 'utf8');
    walletdata = JSON.parse(data);
    paying_address = 'IBTDIDUIVJGOCTDE7QFSV4I7AXMPPX3N';

    payee_address = 'N4PCD3NG6JUT5B2YBBGJ6HJCO4JS37XH';

    onDone();
}
let signer = {
    readSigningPaths: function (conn, address, handleLengthsBySigningPaths) {
        handleLengthsBySigningPaths({r: 88});
    },
    readDefinition: function (conn, address, handleDefinition) {
        let definition = walletdata["definition"];
        handleDefinition(null, definition);
    },
    sign: function (objUnsignedUnit, assocPrivatePayloads, address, signing_path, handleSignature) {
        let buf_to_sign = objectHash.getUnitHashToSign(objUnsignedUnit);
        let derivedPrivateKey = signWithLocalPrivateKey(
            walletdata["mnemonic_phrase"],
            walletdata["passphrase"],
            0,
            walletdata["is_change"],
            walletdata["address_index"]
        );
        handleSignature(null, ecdsaSig.sign(buf_to_sign, derivedPrivateKey));
    }
};


function signWithLocalPrivateKey(mnemonic_phrase, passphrase, account, is_change, address_index) {
    var mnemonic = new Mnemonic(mnemonic_phrase);
    let xPrivKey = mnemonic.toHDPrivateKey(passphrase);
    var path = "m/44'/0'/" + account + "'/" + is_change + "/" + address_index;
    var privateKey = xPrivKey.derive(path).privateKey;
    var privKeyBuf = privateKey.bn.toBuffer({size: 32}); // https://github.com/bitpay/bitcore-lib/issues/47
    return privKeyBuf;
}

function createPayment() {
    let composer = require('bng-core/composer.js');
    let network = require('bng-core/network.js');
    let callbacks = composer.getSavingCallbacks({
        ifNotEnoughFunds: onError,
        ifError: onError,
        ifOk: function (objJoint) {
            network.broadcastJoint(objJoint);
        }
    });

    let arrOutputs = [
        {address: paying_address, amount: 0},      // the change
        {address: payee_address, amount: 100}  // the receiver
    ];
    composer.composePaymentJoint([paying_address], arrOutputs, signer, callbacks);
}
loadWalletConfig(function () {
    createPayment();
    // setInterval(createPayment, 1000 * 30);
});
eventBus.on('headless_wallet_ready', function () {
    console.log("> Create payment");
    loadWalletConfig(function () {
        createPayment();
        // setInterval(createPayment, 1000 * 30);
    });
});


