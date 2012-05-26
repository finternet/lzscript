/* ============================================================
* lzscript.js v0.0.1
* ============================================================
* Copyright 2012 Future Internet
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
* ============================================================ */

(function (name, definition) {
    'use strict';

    this['$' + name] = definition();
} ('lzscript', function () {
    'use strict';
    var scripts = {},
        modules = {},
        doc = document,
        head = doc.getElementsByTagName('head')[0],
        validBase = /^https?:\/\//,
        domContentLoaded = 'DOMContentLoaded',
        readyState = 'readyState',
        addEventListener = 'addEventListener',
        onreadystatechange = 'onreadystatechange',
        scriptpath;
    function every(ar, fn) {
        var i, ii, r;
        for (i = 0, ii = ar.length; i < ii; i += 1) {
            r = fn(ar[i]);
            if (typeof r !== 'undefined' && !r) {
                return false;
            }
        }
        return true;
    }
    function each(ar, fn) {
        every(ar, function (el) {
            fn(el);
        });
    }

    if (!doc[readyState] && doc[addEventListener]) {
        doc[addEventListener](domContentLoaded, function fn() {
            doc.removeEventListener(domContentLoaded, fn, false);
            doc[readyState] = 'complete';
        }, false);
        doc[readyState] = 'loading';
    }

    function create(path, fn, name) {
        var el = doc.createElement('script'),
            loaded = false;

        name = name || path;
        el.onload = el.onerror = el[onreadystatechange] = function () {
            if ((el[readyState] && !(/^c|loade/.test(el[readyState]))) || loaded) {
                return;
            }
            el.onload = el[onreadystatechange] = null;
            loaded = true;
            scripts[name] = 2;
            if (fn) {
                fn();
            }
        };

        el.async = 1;
        el.src = path;
        head.insertBefore(el, head.firstChild);
    }

    function define(name, fn) {
        if (modules.hasOwnProperty(name)) {
            var m = modules[name];
            if (!m.isDefined) {
                m.isDefined = true;
                if (typeof fn === "function") {
                    fn();
                }

                if (m.subscribers && m.subscribers.length) {
                    (function loopF(sb) {
                        if (m.subscribers.length) {
                            sb = m.subscribers[0];
                            if (typeof sb === "function") {
                                sb();
                            }

                            m.subscribers.shift();
                            loopF();
                        }
                    } ());
                }
            }
        } else {
            modules[name] = {
                isDefined: true
            };
            if (typeof fn === "function") {
                fn();
            }
        }
    }

    function loadAndDefineItem(path, name) {
        name = name || path;

        if (!modules.hasOwnProperty(name)) {
            modules[name] = {
                isDefined: false
            };
            if (!scripts.hasOwnProperty(name) && !scripts.hasOwnProperty(path)) {
                create(!validBase.test(path) && scriptpath ? scriptpath + path + '.js' : path, function () {
                    define(name);
                }, name);
            }
        }
    }
    function loadItem(path) {
        if (!scripts.hasOwnProperty(path)) {
            create(!validBase.test(path) && scriptpath ? scriptpath + path + '.js' : path, null, path);
        }
    }

    function $script() {
        return $script;
    }

    $script.DEBUG = function () {
        console.log(scripts);
        console.log(modules);
    };

    function ScriptDefine(dependencies) {
        this.dependencies = dependencies;
        this.queue = this.dependencies && this.dependencies.length ? this.dependencies.length : 0;
        this.definitions = [];
    }

    ScriptDefine.prototype = {
        setDependencies: function (dep) {
            this.dependencies = dep;
            this.queue = this.dependencies && this.dependencies.length ? this.dependencies.length : 0;
        },
        define: function (moduleName, definition) {
            if (this.queue) {
                this.definitions.push({
                    name: moduleName,
                    fn: definition
                });
            } else {
                define(moduleName,definition);
            }
            return this;
        },
        callback: function () {
            this.queue -= 1;
            if (this.queue === 0) {
                each(this.definitions, function (def) {
                    define(def.name, def.fn);
                });
            }
        }
    };

    // Sets the base path, so you don't need to include path in items
    $script.path = function (basePath) {
        scriptpath = basePath;
    };

    // Works same as requireAndDefine with more limitations (you can add one item only), but the path should be absolute path. this is useful to load item from CDN
    $script.get = function (path, name) {
        if (!modules.hasOwnProperty(name)) {
            modules[name] = {
                isDefined: false
            };
            if (!scripts.hasOwnProperty(name)) {
                create(path, function () {
                    define(name);
                }, name);
            }
        }
    };

    // Loads requested items. Please note that after this item you can only chain define. If you chain any other function, you will get nice javascript error.
    // USAGE: requires('jquery','mustache').define('pageme', function(){...})
    $script.requires = function () {
        var pendings = [],
            ret = new ScriptDefine();
        each(arguments, function (s) {
            if (modules.hasOwnProperty(s)) {
                var mo = modules[s];
                if (!mo.isDefined) {
                    pendings.push(s);
                    if (!mo.subscribers) {
                        mo.subscribers = [];
                    }
                    mo.subscribers.push(function () {
                        ret.callback();
                    });
                }
            } else {
                modules[s] = {
                    isDefined: false,
                    subscribers: [function () {
                        ret.callback();
                    }]
                };
                pendings.push(s);
                if (!scripts.hasOwnProperty(s)) {
                    // add script
                    loadItem(s);
                }
            }
        });

        ret.setDependencies(pendings);
        return ret;
    };

    // loads an item if it is not loaded, and defines it as well. This is useful for items without dependencies. Especially third-party items like jQuery, JSON2, etc.
    // USAGE: requireAndDefine('jquery','json2',...)
    $script.requireAndDefine = function () {
        each(arguments, function (sc) {
            loadAndDefineItem(sc, sc);
        });
        return $script;
    };

    // defines a module. Use this when you don't have any dependencies
    // you can use this like: define('MyModule', function() {...})
    // if you omit the definition, system will just mark MyModule as defined
    $script.define = function (moduleName, definition) {
        define(moduleName, definition);
        return $script;
    };
    return $script();
}));