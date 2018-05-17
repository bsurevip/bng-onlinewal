'use strict';

    var storageService = {};

    // File storage is not supported for writting according to 
    // https://github.com/apache/cordova-plugin-file/#supported-platforms
    var shouldUseFileStorage = false;

    var getUUID = function(cb) {
      // TO SIMULATE MOBILE
      return cb('hola');

    };

    var encryptOnMobile = function(text, cb) {

      // UUID encryption is disabled.
      return cb(null, text);
      //
      // getUUID(function(uuid) {
      //   if (uuid) {
      //     $log.debug('Encrypting profile');
      //     text = sjcl.encrypt(uuid, text);
      //   }
      //   return cb(null, text);
      // });
    };


    var decryptOnMobile = function(text, cb) {
      var json;
      try {
        json = JSON.parse(text);
      } catch (e) {};

      if (!json) return cb('Could not access storage')

      if (!json.iter || !json.ct) {
        $log.debug('Profile is not encrypted');
        return cb(null, text);
      }

      $log.debug('Profile is encrypted');
      getUUID(function(uuid) {
        $log.debug('Device UUID:' + uuid);
        if (!uuid)
          return cb('Could not decrypt storage: could not get device ID');

        try {
          text = sjcl.decrypt(uuid, text);

          $log.info('Migrating to unencrypted profile');
          return storage.set('profile', text, function(err) {
            return cb(err, text);
          });
        } catch(e) {
          $log.warn('Decrypt error: ', e);
          return cb('Could not decrypt storage: device ID mismatch');
        };
        return cb(null, text);
      });
    };

    // on mobile, the storage keys are files, we have to avoid slashes in filenames
    function getSafeWalletId(walletId){
        return walletId.replace(/[\/+=]/g, '');
    }

    storageService.storeNewProfile = function(profile, cb) {
      encryptOnMobile(profile.toObj(), function(err, x) {
        storage.create('profile', x, cb);
      });
    };

    storageService.storeProfile = function(profile, cb) {
      encryptOnMobile(profile.toObj(), function(err, x) {
        storage.set('profile', x, cb);
      });
    };

    storageService.getProfile = function(cb) {
      storage.get('profile', function(err, str) {
        //console.log("prof="+str+", err="+err);
        if (err || !str)
          return cb(err);

        decryptOnMobile(str, function(err, str) {
          if (err) return cb(err);
          var p, err;
          try {
            p = Profile.fromString(str);
          } catch (e) {
            $log.debug('Could not read profile:', e);
            err = new Error('Could not read profile:' + e);
          }
          return cb(err, p);
        });
      });
    };

    storageService.deleteProfile = function(cb) {
      storage.remove('profile', cb);
    };

    storageService.storeFocusedWalletId = function(id, cb) {
      storage.set('focusedWalletId', id || '', cb);
    };

    storageService.getFocusedWalletId = function(cb) {
      storage.get('focusedWalletId', cb);
    };

    storageService.setBackupFlag = function(walletId, cb) {
      storage.set('backup-' + getSafeWalletId(walletId), Date.now(), cb);
    };

    storageService.getBackupFlag = function(walletId, cb) {
      storage.get('backup-' + getSafeWalletId(walletId), cb);
    };

    storageService.clearBackupFlag = function(walletId, cb) {
      storage.remove('backup-' + getSafeWalletId(walletId), cb);
    };

    storageService.getConfig = function(cb) {
      storage.get('config', cb);
    };

    storageService.storeConfig = function(val, cb) {
      $log.debug('Storing Preferences', val);
      storage.set('config', val, cb);
    };

    storageService.clearConfig = function(cb) {
      storage.remove('config', cb);
    };

    storageService.setDisclaimerFlag = function(cb) {
      storage.set('agreeDisclaimer', true, cb);
    };

    storageService.getDisclaimerFlag = function(cb) {
      storage.get('agreeDisclaimer', cb);
    };

    storageService.setRemotePrefsStoredFlag = function(cb) {
      storage.set('remotePrefStored', true, cb);
    };

    storageService.getRemotePrefsStoredFlag = function(cb) {
      storage.get('remotePrefStored', cb);
    };

    storageService.setAddressbook = function(network, addressbook, cb) {
      storage.set('addressbook-' + network, addressbook, cb);
    };

    storageService.getAddressbook = function(network, cb) {
      storage.get('addressbook-' + network, cb);
    };

    storageService.removeAddressbook = function(network, cb) {
      storage.remove('addressbook-' + network, cb);
    };

    storageService.setPushInfo = function(projectNumber, registrationId, enabled, cb) {
      storage.set('pushToken', JSON.stringify({projectNumber: projectNumber, registrationId: registrationId, enabled: enabled}), cb);
    };

    storageService.getPushInfo = function(cb) {
      storage.get('pushToken', function(err, data) {
      	err ? cb(err) : cb(null, (data ? JSON.parse(data) : data));
	  });
    };
      
    storageService.removePushInfo = function(cb){
      storage.remove('pushToken', cb);
    };

