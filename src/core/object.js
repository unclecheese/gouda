define(['./base','./core'], function(Class, Gouda) {

  "use strict";
  
  var GoudaObject = Class.extend({

    _instanceCount: 0,

    __ID__: null,

    _className: "GoudaObject",

    __construct: function() {
      GoudaObject.prototype._instanceCount++;
      this.__ID__ = GoudaObject.prototype._instanceCount;
    },

    getClass: function() {
      return this._className;
    },


    getID: function() {
      return this.__ID__;
    },

    getConfig: function (prop, key) {
      if(!Gouda.Config[this.getClass()]) {
        Gouda.Config[this.getClass()] = []
      }
      if(key) {
        if(!Gouda.Config[this.getClass()][prop]) {
          Gouda.Config[this.getClass()][prop] = []
        }
        return Gouda.Config[this.getClass()][prop][key];
      }

      return Gouda.Config[this.getClass()][prop];
    },


    setConfig: function (prop, val) {
      if(!Gouda.Config[this.getClass()]) {
        Gouda.Config[this.getClass()] = []
      }
      Gouda.Config[this.getClass()][prop] = val;
    },

    pushConfig: function (prop, val1, val2) {
      if(!Gouda.Config[this.getClass()]) {
        Gouda.Config[this.getClass()] = [];
      }
      if(!Gouda.Config[this.getClass()][prop]) {
        Gouda.Config[this.getClass()][prop] = [];
      }
      if(val2) {
        if(!Gouda.Config[this.getClass()][prop][val1]) {
          Gouda.Config[this.getClass()][prop][val1] = [];
        }
        Gouda.Config[this.getClass()][prop][val1].push(val2);
      }

      else {
        Gouda.Config[this.getClass()][prop].push(val1);
      }
    }

  });

  return GoudaObject;
});
