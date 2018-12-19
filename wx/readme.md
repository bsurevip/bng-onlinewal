var Crypto = require('ctypto.js');
var createWallet;
var signWithLocalPrivateKey;

 var root = {
    Array: Array,
    Date: Date,
    Error: Error,
    Function: Function,
    Math: Math,
    Object: Object,
    RegExp: RegExp,
    String: String,
    TypeError: TypeError,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval
  };

var NEGATIVE_INFINITY = -Infinity,
      POSITIVE_INFINITY = Infinity;

Random.getRandomBufferBrowser = function (size) {
  var bbuf= Crypto.util.randomBytes(16);
  var buf = new Buffer(bbuf);
  return buf;
};

module.exports = {
  newRSA:newRSA,
  encryptRSA:encryptRSA,
  createWallet: createWallet,
  signWithLocalPrivateKey: signWithLocalPrivateKey
}


function oldBrowser(size) {
        return Crypto.util.randomBytes(size)
      }
