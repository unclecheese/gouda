define([], function() {
  
  var Cydr = {};

  Cydr.Config = {};

  Cydr.Utils = {

    inArray: function (needle, heystack) {
      for (i in heystack) {
        if (heystack[i] == needle) {
          return true;
        }
      }

      return false;
    },

    forEach: function (arr, cb, context) {
      for (i in arr) {
        var result = cb.apply(context ? context : window, [i, arr[i]]);
        if (result === false) break;
      }
    }
  };


  Cydr.EventDispatcher = {

    events: [],

    fire: function (sku) {
      var parts = sku.split(":");
      var type = parts[0];
      var model = parts[1];
      var prop = parts[2];
      var id = parts[3];
      var evt = [];
      for(i in parts) {
        var part = parts[i];
        evt.push(part);
        e = evt.join(":");
        var subscribers = (Cydr.EventDispatcher.events[e]) || [];
        Cydr.Utils.forEach(subscribers, function(listenerID, func) {
          func(e, type, model, prop, id);
        });
      }
    },



    subscribe: function (sku, listener, func) {
      if(!Cydr.EventDispatcher.events[sku]) {
        Cydr.EventDispatcher.events[sku] = []
      }
      Cydr.EventDispatcher.events[sku]["listener_"+listener.__ID__] = func.bind(listener);
    },

    revoke: function (sku, listener) {
      delete Cydr.EventDispatcher.events[sku]["listener_"+listener.__ID__];
      if(Cydr.EventDispatcher.events[sku].length === 0) {
        delete Cydr.EventDispatcher.events[sku];
      }
    }


  };

  return Cydr;
});