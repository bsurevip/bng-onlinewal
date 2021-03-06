var breadcrumbs = require('bng-core/breadcrumbs.js');
var constants = require('bng-core/constants.js');
var bwcService=require('../../../angular-bitcore-wallet-client/index.js');
var Profile = require('../models/profile.js').profile;
var opts = {
    m: 0,
    n: 0,
    name: "pc",
    networkName: 'livenet',
    cosigners: [],
    isSingleAddress: true
};

var root = {};

root.profile = null;
root.focusedClient = null;
root.walletClients = {};

root.assetMetadata = {};

root.Utils = getUtils();


root.formatAmount = function(amount, asset, opts) {
    var config = configService.getSync().wallet.settings;
    //if (config.unitCode == 'byte') return amount;

    //TODO : now only works for english, specify opts to change thousand separator and decimal separator
    if (asset === 'blackmg' || asset === constants.BLACKBYTES_ASSET)
        return this.Utils.formatAmount(amount, config.bbUnitCode, opts);
    else if (asset === 'base' || asset === 'mg')
        return this.Utils.formatAmount(amount, config.unitCode, opts);
    else if (root.assetMetadata[asset]){
        var decimals = root.assetMetadata[asset].decimals || 0;
        return (amount / Math.pow(10, decimals)).toLocaleString([], {maximumFractionDigits: decimals});
    }
    else
        return amount;
};

root.formatAmountWithUnit = function(amount, asset, opts) {
    return root.formatAmount(amount, asset, opts) + ' ' + root.getUnitName(asset);
};

root.formatAmountWithUnitIfShort = function(amount, asset, opts) {
    var str = root.formatAmount(amount, asset, opts);
    var unit = root.getUnitName(asset);
    if (unit.length <= 8)
        str += ' ' + unit;
    return str;
};

root.getUnitName = function(asset) {
    var config = configService.getSync().wallet.settings;
    if (asset === 'blackmg' || asset === constants.BLACKBYTES_ASSET)
        return config.bbUnitName;
    else if (asset === 'base' || asset === 'mg')
        return config.unitName;
    else if (root.assetMetadata[asset])
        return root.assetMetadata[asset].name;
    else
        return "of "+asset;
};

root.getAmountInSmallestUnits = function(amount, asset){
    var config = configService.getSync().wallet.settings;
    if (asset === 'base')
        amount *= config.unitValue;
    else if (asset === constants.BLACKBYTES_ASSET)
        amount *= config.bbUnitValue;
    else if (root.assetMetadata[asset])
        amount *= Math.pow(10, root.assetMetadata[asset].decimals || 0);
    return Math.round(amount);
};

root.getAmountInDisplayUnits = function(amount, asset){
    var config = configService.getSync().wallet.settings;
    if (asset === 'base')
        amount /= config.unitValue;
    else if (asset === constants.BLACKBYTES_ASSET)
        amount /= config.bbUnitValue;
    else if (root.assetMetadata[asset])
        amount /= Math.pow(10, root.assetMetadata[asset].decimals || 0);
    return amount;
};

root._setFocus = function(walletId, cb) {

    // Set local object
    if (walletId)
        root.focusedClient = root.walletClients[walletId];
    else
        root.focusedClient = [];

    if (lodash.isEmpty(root.focusedClient)) {
        root.focusedClient = root.walletClients[lodash.keys(root.walletClients)[0]];
    }
    return cb();
};

root.setAndStoreFocus = function(walletId, cb) {
    root._setFocus(walletId, function() {
        storageService.storeFocusedWalletId(walletId, cb);
    });
};

root.setWalletClient = function(credentials) {
    if (root.walletClients[credentials.walletId] && root.walletClients[credentials.walletId].started)
        return;

    var client = getClient(JSON.stringify(credentials));

    client.credentials.xPrivKey = root.profile.xPrivKey;
    client.credentials.mnemonic = root.profile.mnemonic;
    client.credentials.xPrivKeyEncrypted = root.profile.xPrivKeyEncrypted;
    client.credentials.mnemonicEncrypted = root.profile.mnemonicEncrypted;

    root.walletClients[credentials.walletId] = client;

    root.walletClients[credentials.walletId].started = true;

    client.initialize({}, function(err) {
        if (err) {
            // impossible

        }
    });
};

root.setWalletClients = function() {
    var credentials = root.profile.credentials;
    lodash.each(credentials, function(credentials) {
        root.setWalletClient(credentials);
    });
};


function saveTempKeys(tempDeviceKey, prevTempDeviceKey, onDone){
        console.log("will save temp device keys");//, tempDeviceKey, prevTempDeviceKey);
        root.profile.tempDeviceKey = tempDeviceKey.toString('base64');
        if (prevTempDeviceKey)
            root.profile.prevTempDeviceKey = prevTempDeviceKey.toString('base64');
        storageService.storeProfile(root.profile, function(err) {
            onDone(err);
        });
}


root.bindProfile = function(profile, cb) {
    breadcrumbs.add('bindProfile');
    root.profile = profile;
    configService.get(function(err) {
        if (err)
            return cb(err);
        root.setWalletClients();
        storageService.getFocusedWalletId(function(err, focusedWalletId) {
            if (err)
                return cb(err);
            root._setFocus(focusedWalletId, function() {
                console.log("focusedWalletId", focusedWalletId);
                var Wallet = require('bng-core/wallet.js');
                var device = require('bng-core/device.js');
                var config = configService.getSync();
                var firstWc = root.walletClients[lodash.keys(root.walletClients)[0]];
                if (root.profile.xPrivKeyEncrypted){
                    console.log('priv key is encrypted, will wait for UI and request password');
                    // assuming bindProfile is called on encrypted keys only at program startup
                    unlockWalletAndInitDevice();
                    device.setDeviceAddress(root.profile.my_device_address);
                }
                else if (root.profile.xPrivKey)
                    root.focusedClient.initDeviceProperties(profile.xPrivKey, root.profile.my_device_address, config.hub, config.deviceName);
                else
                    throw Error("neither xPrivKey nor xPrivKeyEncrypted");
                //var tempDeviceKey = device.genPrivKey();
                //saveTempKeys(tempDeviceKey, null, function(){});
                var tempDeviceKey = Buffer.from(profile.tempDeviceKey, 'base64');
                var prevTempDeviceKey = profile.prevTempDeviceKey ? Buffer.from(profile.prevTempDeviceKey, 'base64') : null;
                device.setTempKeys(tempDeviceKey, prevTempDeviceKey, saveTempKeys);
                Wallet.readAssetMetadata(null, function(assocAssetMetadata){
                    for (var asset in assocAssetMetadata){
                        if (!root.assetMetadata[asset])
                            root.assetMetadata[asset] = assocAssetMetadata[asset];
                    }
                });
                return cb();
            });
        });
    });
};

root.loadAndBindProfile = function(cb) {
    breadcrumbs.add('loadAndBindProfile');
    storageService.getDisclaimerFlag(function(err, val) {
        if (!val) {
            breadcrumbs.add('Non agreed disclaimer');
            return cb(new Error('NONAGREEDDISCLAIMER: Non agreed disclaimer'));
        } else {
            storageService.getProfile(function(err, profile) {
                if (err) {
                    return cb(err);
                }
                if (!profile) {
                    breadcrumbs.add('no profile');
                    return cb(new Error('NOPROFILE: No profile'));
                } else {
                    return root.bindProfile(profile, cb);
                }

            });
        }
    });
};


root._seedWallet = function(opts, cb) {
    opts = opts || {};

    var walletClient = getClient();
    var network = opts.networkName || 'livenet';


    if (opts.mnemonic) {
        try {
            opts.mnemonic = root._normalizeMnemonic(opts.mnemonic);
            walletClient.seedFromMnemonic(opts.mnemonic, {
                network: network,
                passphrase: opts.passphrase,
                account: opts.account || 0,
                derivationStrategy: opts.derivationStrategy || 'BIP44',
            });

        } catch (ex) {
            return cb(gettext('Could not create: Invalid wallet seed'));
        }
    } else if (opts.extendedPrivateKey) {
        try {
            walletClient.seedFromExtendedPrivateKey(opts.extendedPrivateKey, opts.account || 0);
        } catch (ex) {
            return cb(gettext('Could not create using the specified extended private key'));
        }
    } else if (opts.extendedPublicKey) {
        try {
            walletClient.seedFromExtendedPublicKey(opts.extendedPublicKey, opts.externalSource, opts.entropySource, {
                account: opts.account || 0,
                derivationStrategy: opts.derivationStrategy || 'BIP44',
            });
        } catch (ex) {
            return cb(gettext('Could not create using the specified extended public key'));
        }
    } else {
        var lang = 'en';
        console.log("will seedFromRandomWithMnemonic for language "+lang);
        try {
            walletClient.seedFromRandomWithMnemonic({
                network: network,
                passphrase: opts.passphrase,
                language: lang,
                account: opts.account || 0,
            });
        } catch (e) {
            if (e.message.indexOf('language') > 0) {
                walletClient.seedFromRandomWithMnemonic({
                    network: network,
                    passphrase: opts.passphrase,
                    account: opts.account || 0,
                });
            } else {
                return cb(e);
            }
        }
    }
    return cb(null, walletClient);
};


_createNewProfile = function(opts, cb) {
    console.log("_createNewProfile");
    if (opts.noWallet)
        return cb(null, Profile.create());
    root._seedWallet({}, function(err, walletClient) {
        if (err)
            return cb(err);
        require('bng-core/wallet.js'); // load hub/ message handlers
        var device = require('bng-core/device.js');
        var tempDeviceKey = device.genPrivKey();
        // initDeviceProperties sets my_device_address needed by walletClient.createWallet
        walletClient.initDeviceProperties(walletClient.credentials.xPrivKey, null, 'bsure.vip/bb', "pc");
        var walletName = "pc";
        walletClient.createWallet(walletName, 1, 1, {
            //	isSingleAddress: true,
            network: 'livenet'
        }, function(err) {
            if (err)
                return cb(gettext('Error creating wallet')+": "+err);
            console.log("created wallet, client: ", JSON.stringify(walletClient));
            var xPrivKey = walletClient.credentials.xPrivKey;
            var mnemonic = walletClient.credentials.mnemonic;
            console.log("mnemonic: "+mnemonic+', xPrivKey: '+xPrivKey);
            // var p = Profile.create({
            //     credentials: [JSON.parse(walletClient.export())],
            //     xPrivKey: xPrivKey,
            //     mnemonic: mnemonic,
            //     tempDeviceKey: tempDeviceKey.toString('base64'),
            //     my_device_address: device.getMyDeviceAddress()
            // });
            device.setTempKeys(tempDeviceKey, null, saveTempKeys);
            return cb(null, "done");
        });
    });
};

// create additional wallet (the first wallet is created in _createNewProfile())
createWallet = function(opts, cb) {
    var walletDefinedByKeys = require('bng-core/wallet_defined_by_keys.js');
    walletDefinedByKeys.readNextAccount(function(account){
        console.log("next account = "+account);
        if (!opts.extendedPrivateKey && !opts.mnemonic){
            if (!root.focusedClient.credentials.xPrivKey)
                throw Error("no root.focusedClient.credentials.xPrivKey");
            opts.extendedPrivateKey = root.focusedClient.credentials.xPrivKey;
            opts.mnemonic = root.profile.mnemonic;
            opts.account = account;
        }
        root._seedWallet(opts, function(err, walletClient) {
            if (err)
                return cb(err);

            walletClient.createWallet(opts.name, opts.m, opts.n, {
                network: opts.networkName,
                account: opts.account,
                cosigners: opts.cosigners,
                isSingleAddress: opts.isSingleAddress
            }, function(err) {
                    if (err)
                        return cb(gettext('Error creating wallet')+": "+err);
                    root._addWalletClient(walletClient, opts, cb);
            });
        });
    });
};


root.getClient = function(walletId) {
    return root.walletClients[walletId];
};

root.deleteWallet = function(opts, cb) {
    var client = opts.client || root.focusedClient;
    var walletId = client.credentials.walletId;
    breadcrumbs.add('Deleting Wallet: ' + client.credentials.walletName);

    root.profile.credentials = lodash.reject(root.profile.credentials, {
        walletId: walletId
    });

    delete root.walletClients[walletId];
    root.focusedClient = null;

    storageService.clearBackupFlag(walletId, function(err) {
        // if (err) $log.warn(err);
    });

        root.setWalletClients();
        root.setAndStoreFocus(null, function() {
            storageService.storeProfile(root.profile, function(err) {
                if (err) return cb(err);
                return cb();
            });
        });
};

root.setMetaData = function(walletClient, addressBook, cb) {
    storageService.getAddressbook(walletClient.credentials.network, function(err, localAddressBook) {
        var localAddressBook1 = {};
        try {
            localAddressBook1 = JSON.parse(localAddressBook);
        } catch (ex) {
            // $log.warn(ex);
        }
        var mergeAddressBook = lodash.merge(addressBook, localAddressBook1);
        storageService.setAddressbook(walletClient.credentials.network, JSON.stringify(addressBook), function(err) {
            if (err) return cb(err);
            return cb(null);
        });
    });
};

root._addWalletClient = function(walletClient, opts, cb) {
    var walletId = walletClient.credentials.walletId;

    // check if exists
    var w = lodash.find(root.profile.credentials, { 'walletId': walletId });
    if (w)
        return cb(gettext('Wallet already in Bsure' + ": ") + w.walletName);

    root.profile.credentials.push(JSON.parse(walletClient.export()));
    root.setWalletClients();

    // assign wallet color based on first character of walletId
    var color = configService.colorOpts[walletId.charCodeAt(0) % configService.colorOpts.length];
    var configOpts = {colorFor: {}};
    configOpts.colorFor[walletId] = color;
    configService.set(configOpts, function(err){
        root.setAndStoreFocus(walletId, function() {
            storageService.storeProfile(root.profile, function(err) {
                var config = configService.getSync();
                return cb(err, walletId);
            });
        });
    });
};


root.importWallet = function(str, opts, cb) {

    var walletClient = getClient();

    $log.debug('Importing Wallet:', opts);
    try {
        walletClient.import(str, {
            compressed: opts.compressed,
            password: opts.password
        });
    } catch (err) {
        return cb(gettext('Could not import. Check input file and password'));
    }

    str = JSON.parse(str);

    var addressBook = str.addressBook || {};

    root._addWalletClient(walletClient, opts, function(err, walletId) {
        if (err) return cb(err);
        root.setMetaData(walletClient, addressBook, function(error) {
            if (error) console.log(error);
            return cb(err, walletId);
        });
    });
};


root.importExtendedPrivateKey = function(xPrivKey, opts, cb) {
    var walletClient = getClient();

    walletClient.importFromExtendedPrivateKey(xPrivKey, function(err) {
        if (err)
            return cb(gettext('Could not import')+": "+err);

        root._addWalletClient(walletClient, opts, cb);
    });
};

root._normalizeMnemonic = function(words) {
    var isJA = words.indexOf('\u3000') > -1;
    var wordList = words.split(/[\u3000\s]+/);

    return wordList.join(isJA ? '\u3000' : ' ');
};


root.importMnemonic = function(words, opts, cb) {

    var walletClient = getClient();

    words = root._normalizeMnemonic(words);
    walletClient.importFromMnemonic(words, {
        network: opts.networkName,
        passphrase: opts.passphrase,
        account: opts.account || 0,
    }, function(err) {
        if (err)
            return cb(gettext('Could not import')+": "+err);

        root._addWalletClient(walletClient, opts, cb);
    });
};


root.importExtendedPublicKey = function(opts, cb) {

    var walletClient = getClient();

    walletClient.importFromExtendedPublicKey(opts.extendedPublicKey, opts.externalSource, opts.entropySource, {
        account: opts.account || 0,
        derivationStrategy: opts.derivationStrategy || 'BIP44',
    }, function(err) {
        if (err) {

            // in HW wallets, req key is always the same. They can't addAccess.
            if (err.code == 'NOT_AUTHORIZED')
                err.code = 'WALLET_DOES_NOT_EXIST';

            return cb(gettext('Could not import')+": "+err);
        }

        root._addWalletClient(walletClient, opts, cb);
    });
};


root.create = function(opts, cb) {
    var defaults = configService.getDefaults();

    configService.get(function(err) {
        root._createNewProfile(opts, function(err, p) {
            if (err) return cb(err);

            root.bindProfile(p, function(err) {
                storageService.storeNewProfile(p, function(err) {
                    root.setSingleAddressFlag(true);
                    return cb(err);
                });
            });
        });
    });
};


root.updateCredentialsFC = function(cb) {
    var fc = root.focusedClient;

    var newCredentials = lodash.reject(root.profile.credentials, {
        walletId: fc.credentials.walletId
    });
    newCredentials.push(JSON.parse(fc.export()));
    root.profile.credentials = newCredentials;
    //root.profile.my_device_address = device.getMyDeviceAddress();

    storageService.storeProfile(root.profile, cb);
};

root.clearMnemonic = function(cb){
    delete root.profile.mnemonic;
    delete root.profile.mnemonicEncrypted;
    for (var wid in root.walletClients)
        root.walletClients[wid].clearMnemonic();
    storageService.storeProfile(root.profile, cb);
};

root.setPrivateKeyEncryptionFC = function(password, cb) {
    var fc = root.focusedClient;

    fc.setPrivateKeyEncryption(password);
    if (!fc.credentials.xPrivKeyEncrypted)
        throw Error("no xPrivKeyEncrypted after setting encryption");
    root.profile.xPrivKeyEncrypted = fc.credentials.xPrivKeyEncrypted;
    root.profile.mnemonicEncrypted = fc.credentials.mnemonicEncrypted;
    delete root.profile.xPrivKey;
    delete root.profile.mnemonic;
    root.lockFC();
    for (var wid in root.walletClients){
        root.walletClients[wid].credentials.xPrivKeyEncrypted = root.profile.xPrivKeyEncrypted;
        delete root.walletClients[wid].credentials.xPrivKey;
    }
    storageService.storeProfile(root.profile, function() {
        return cb();
    });
    /*root.updateCredentialsFC(function() {
        $log.debug('Wallet encrypted');
            return cb();
    });*/
};


root.disablePrivateKeyEncryptionFC = function(cb) {
    var fc = root.focusedClient;

    try {
        fc.disablePrivateKeyEncryption();
    } catch (e) {
        return cb(e);
    }
    if (!fc.credentials.xPrivKey)
        throw Error("no xPrivKey after disabling encryption");
    root.profile.xPrivKey = fc.credentials.xPrivKey;
    root.profile.mnemonic = fc.credentials.mnemonic;
    delete root.profile.xPrivKeyEncrypted;
    delete root.profile.mnemonicEncrypted;
    for (var wid in root.walletClients){
        root.walletClients[wid].credentials.xPrivKey = root.profile.xPrivKey;
        delete root.walletClients[wid].credentials.xPrivKeyEncrypted;
    }
    storageService.storeProfile(root.profile, function() {
        return cb();
    });
    /*root.updateCredentialsFC(function() {
        $log.debug('Wallet encryption disabled');
            return cb();
    });*/
};

root.lockFC = function() {
    var fc = root.focusedClient;
    try {
        fc.lock();
    } catch (e) {
    }
};

root.getWallets = function(network) {
    if (!root.profile) return [];

    var config = configService.getSync();
    config.colorFor = config.colorFor || {};
    config.aliasFor = config.aliasFor || {};
    var ret = lodash.map(root.profile.credentials, function(c) {
        return {
            m: c.m,
            n: c.n,
            is_complete: (c.publicKeyRing && c.publicKeyRing.length === c.n),
            name: config.aliasFor[c.walletId] || c.walletName,
            id: c.walletId,
            network: c.network,
            color: config.colorFor[c.walletId] || '#2C3E50'
        };
    });
    ret = lodash.filter(ret, function(w) {
        return (w.network == network && w.is_complete);
    });
    return lodash.sortBy(ret, 'name');
};



root.requestTouchid = function(cb) {
    var fc = root.focusedClient;
    var config = configService.getSync();
    config.touchIdFor = config.touchIdFor || {};
    if (window.touchidAvailable && config.touchIdFor[fc.credentials.walletId]){

    }else
        return cb();
};

root.replaceProfile = function (xPrivKey, mnemonic, myDeviceAddress, cb) {
    var device = require('bng-core/device.js');

    root.profile.credentials = [];
    root.profile.xPrivKey = xPrivKey;
    root.profile.mnemonic = mnemonic;
    root.profile.my_device_address = myDeviceAddress;
    device.setNewDeviceAddress(myDeviceAddress);

    storageService.storeProfile(root.profile, function () {
        return cb();
    });
};

root.setSingleAddressFlag = function(newValue) {
    var fc = root.focusedClient;
    fc.isSingleAddress = newValue;
    var walletId = fc.credentials.walletId;
    var config = configService.getSync();
    var oldValue = config.isSingleAddress || false;

    var opts = {
        isSingleAddress: {}
    };
    opts.isSingleAddress[walletId] = newValue;
    configService.set(opts, function(err) {
        if (err) {
            fc.isSingleAddress = oldValue;

        }
    });
};
_createNewProfile(opts, function (err,data) {
    console.log("==============>"+err+data);
})

