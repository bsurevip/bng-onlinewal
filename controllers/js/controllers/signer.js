
var Mnemonic = require('bitcore-mnemonic');
function signWithLocalPrivateKey(mnemonic_phrase, passphrase, account, is_change, address_index) {
    var mnemonic = new Mnemonic(mnemonic_phrase);
    var xPrivKey = mnemonic.toHDPrivateKey(passphrase);
    var path = "m/44'/0'/" + account + "'/" + is_change + "/" + address_index;
    var privateKey = xPrivKey.derive(path).privateKey;
    var privKeyBuf = privateKey.bn.toBuffer({size: 32}); // https://github.com/bitpay/bitcore-lib/issues/47
  console.log(JSON.stringify(privKeyBuf))
    return privKeyBuf;
}
// var test =signWithLocalPrivateKey("chapter subway west before husband robust step awful between target benefit cause","",0,0,0);
// var crypto = require('crypto')
//     ,fs = require('fs');
// var privatePem = fs.readFileSync('../../../pem/rsa_private_key.pem');
// var publicPem = fs.readFileSync('../../../pem/rsa_public_key.pem');
// var key = privatePem.toString();
// var pubkey = publicPem.toString();
// var data = "cdss";
// //签名
// var sign = crypto.createSign('RSA-SHA256');
// sign.update(data);
// var sig = sign.sign(key, 'hex');
// // console.log(sig);
// //验证
// var verify = crypto.createVerify('RSA-SHA256');
// verify.update(data);
// // console.log(verify.verify(pubkey, sig, 'hex'));

// var NodeRSA = require('node-rsa');
// var key = new NodeRSA(key);
// var pubkey = new NodeRSA(pubkey);
// key.setOptions({encryptionScheme: 'pkcs1'});
// pubkey.setOptions({encryptionScheme: 'pkcs1'});
//
// var text =JSON.parse(JSON.stringify(test));
// console.log(new Buffer(text.data));
//
// var encrypted = pubkey.encrypt(test, 'base64');
// console.log('encrypted: ', encrypted);
//
// var decrypted = key.decrypt(encrypted, 'utf8');
// console.log('decrypted: ', decrypted);
