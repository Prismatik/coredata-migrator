# Coredata migrator

This module handles migrating key-value data stored in iOS' CoreData to localStorage for use by Cordova.

It currently doesn't handle any relationships or fancy features present in CoreData, just string keys and JSON values.

Coredata stores it's data in a sqlite database. Apple is very clear that they've modified the format (for some reason) so you shouldn't try writing to it except via their blessed channels. Reading from it appears to work fine though, at least for this simple case.

You can optionally pass a transform function to munge the data around after reading from coredata, but before writing to localStorage.

The function signature is:

```migrator.migrateIfNecessary(ids, transform, callback)```

ids is an object containing the properties keyCol, valCol and table.

transform is optional. It should be a function that takes two arguments, key and value. It should return an object with the properties key and value.

callback is not optional

You can optionally pass in a FileSystem object when instantiating the module. If you do, the module will store it's migrated flag in the root of that fs. If you don't, the module will request it's own, which will be Library.
