/**
 *
 * @author Andriy Oblivantsev <eslider@gmail.com>
 * @copyright 25.08.2015 by WhereGroup GmbH & Co. KG
 * @deprecated know your own data types (objects vs arrays) and bring your own appropriate iterations
 * @todo: remove usages from Digitizer 1.1+
 * @todo: remove in v0.3.x
 */

window.DataUtil = new function() {

    var self = this;

    /**
     * Check and replace values recursive if they should be translated.
     * For checking used "translationReg" variable
     *
     *
     * @param items
     */
    function eachItem_(items, callback) {
        var isArray = items instanceof Array;
        if(isArray) {
            for (var k in items) {
                eachItem_(items[k], callback);
            }
        } else {
            if(typeof items["type"] !== 'undefined') {
                callback(items);
            }
            if(typeof items["children"] !== 'undefined') {
                eachItem_(items["children"], callback);
            }
        }
    }
    this.eachItem = function(items, callback) {
        console.warn("Global vis-ui.js window.DataUtil is deprecated and will be removed in v0.3");
        eachItem_(items, callback);
    };

    /**
     * Check if object has a key
     *
     * @param obj
     * @param key
     * @returns {boolean}
     */
    self.has = function(obj, key) {
        console.warn("Global vis-ui.js window.DataUtil is deprecated and will be removed in v0.3");
        return typeof obj[key] !== 'undefined';
    };

    /**
     * Get value from object by the key or return default given.
     *
     * @param obj
     * @param key
     * @param defaultValue
     * @returns {*}
     */
    self.getVal = function(obj, key, defaultValue) {
        console.warn("Global vis-ui.js window.DataUtil is deprecated and will be removed in v0.3");
        return has(obj, key) ? obj[key] : defaultValue;
    }
};
