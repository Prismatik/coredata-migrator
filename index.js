var ds = require('cordova-datastore');
Migrator = function(fs) {
  var _this = this;
  this.fs = fs;
  var getFs = function(callback) {
    if (!_this.fs) {
      requestFileSystem(3, 0, function(fs) {
        _this.fs = fs;
        return callback(null);
      }, callback);
    } else {
      return callback(null);
    };
  };

  var checkForMarker = function(callback) {
    if (!_this.fs) return callback(new Error('no fs defined'));
    var success = function(fileHandle) {
      return callback(null, true);
    };
    var failure = function(err) {
      if (err && err.code === 1) return callback(null, false);
      if (!err) return callback(new Error('something went wrong attempting to read the migration marker'));
      return callback(err);
    };
    _this.fs.root.getFile('migrated', {create: false, exclusive: false}, success, failure);
  };

  var setMarker = function(callback) {
    if (!_this.fs) return callback(new Error('no fs defined'));
    var success = function(fileHandle) {
      var writeSuccess = function(writer) {
        writer.onwrite = function() {
          return callback();
        };
        writer.write('migrated');
      };
      fileHandle.createWriter(writeSuccess, callback);
    };
      _this.fs.root.getFile('migrated', {create: true, exclusive: false}, success, callback);
  };

  var readDb = function(ids, transform, callback) {
    var store = function(key, value, callback) {
      if (transform) {
        var ret = transform(key, value);
        key = ret.key;
        value = ret.value;
      };

      ds.setItem(key, JSON.stringify(value), function(err) {
        return callback(err);
      });
    };

    var db = sqlitePlugin.openDatabase({name: 'french_glossary_7_1.sqlite'});
    var rowHandler = function(res) {
      var data = [];
      for (var i = 0 ; i < res.rows.length ; i++) {
        var item = res.rows.item(i);
        try {
          var val = JSON.parse(item[ids.valCol]);
        } catch (e) {
          console.error('error parsing migrated data', e);
          continue;
        }
        store(item[ids.keyCol], val, function(err) {
          console.log('migrated', err, item[ids.keyCol], val);
        });
      }
      callback(null);
    };
    var failure = function(err) {
      if (err.message === 'no such table: '+ids.table) return callback(null);
      return callback(err);
    };
    db.executeSql('SELECT '+ids.keyCol+', '+ids.valCol+' FROM '+ids.table, [], rowHandler, failure);
  };

  this.migrateIfNecessary = function(ids, dsName, transform, callback) {
    if (arguments.length < 4) {
      callback = transform;
      transform = null;
    }
    dataStore.init(dsName, function(err) {
      if (err) return callback(err);
      getFs(function(err) {
        if (err) return callback(err);
        checkForMarker(function(err, present) {
          if (err) return callback(err);
          if (present) return callback(false);
          readDb(ids, transform, function(err) {
            if (err) return callback(err);
            setMarker(callback);
          });
        });
      });
    });
  };

  return this;
};

module.exports = Migrator;
