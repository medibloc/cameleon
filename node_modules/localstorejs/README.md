# LocalStore
A wrapper for localStorage, which will use chrome.storage if used in a chrome packaged app.

Installation
-----------

    $ meteor add frozeman:storage    

    $ npm install localstorejs


Description
-----------

This is a **reactive** wrapper for localstorage, which will use chrome.storage.local if its used in a chrome packaged app.

If using NPM:

    var LocalStore = require('localstorejs');

To set an item just use:

    LocalStore.set('myKey', {my: 'Object'});

    // or

    LocalStore.set('myKey', 'myString');

To get:

    var value = LocalStore.get('myKey');


Additionally you can prevent reactive behavior, by passing `{reactive: false}`:


    LocalStore.set('myKey', 'myString', {reactive: false});

When getting:

    var value = LocalStore.get('myKey', {reactive: false});


As last parameter, you can also run a callback after the data was set, or get

    LocalStore.set('myKey', {my: 'Object'}, false, function(){
    	// do x	
	});


Authors
-------

Fabian Vogelsteller (Ethereum Dev) <fabian.vogelsteller@gmail.com>

NPM Mods by: Nick Dodson <thenickdodson@gmail.com>
