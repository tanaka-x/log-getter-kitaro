const Store = require('electron-store');

class DataStore extends Store {
    constructor(settings) {
        super(settings);

        // initialize with todos or empty array
        this.accessKey = this.get('accessKey') || [];
        this.secretKey = this.get('secretKey') || [];
        this.bucket = this.get('bucket') || [];
        this.key = this.get('key') || [];
    }

    saveTodos(paccessKey, psecretKey, pbucket, pkey) {
        // save todos to JSON file
        this.set('accessKey', paccessKey);
        this.set('secretKey', psecretKey);
        this.set('bucket', pbucket);
        this.set('key', pkey);

        // returning 'this' allows method chaining
        return this;
    }

    getTodos() {
        // set object's todos to todos in JSON file
        this.accessKey = this.get('accessKey') || [];
        this.secretKey = this.get('secretKey') || [];
        this.bucket = this.get('bucket') || [];
        this.key = this.get('key') || [];

        return this;
    }
}

module.exports = DataStore;
