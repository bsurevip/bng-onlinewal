
//var Client = require('../node_modules/bitcore-wallet-client');
console.log("before");
//console.log("path="+require.resolve('./angular-bitcore-wallet-client/bitcore-wallet-client/index.js'));
// we are in public/, require() from webkit context
var Client = require('../angular-bitcore-wallet-client/bitcore-wallet-client/index.js');
console.log("after");

getBitcore = function() {
    return Client.Bitcore;
};

getSJCL = function() {
    return Client.sjcl;
};


getUtils = function() {
    return Client.Utils;
};

getClient = function(walletData) {
    var bwc = new Client({});
    if (walletData)
        bwc.import(walletData);
    return bwc;
};