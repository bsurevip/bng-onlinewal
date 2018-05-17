'use strict';


    var storage = {};
    var ls = null;

    // if (!ls)
      // throw new Error('localstorage not available');

    storage.get = function(k, cb) {
        return cb(null, "");
    };

    /**
     * Same as setItem, but fails if an item already exists
     */
    storage.create = function(name, value, callback) {
      storage.get(name,
        function(err, data) {
          if (data) {
            return callback('EEXISTS');
          } else {
            return storage.set(name, value, callback);
          }
        });
    };

    storage.set = function(k, v, cb) {

        return cb();
    };

    storage.remove = function(k, cb) {
        return cb();
    };


