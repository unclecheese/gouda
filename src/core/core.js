define([], function() {

  "use strict";

  var Core = {};

  Core.Config = {};

  Core.Utils = {

    inArray: function (needle, heystack) {
      for (var i in heystack) {
        if (heystack[i] == needle) {
          return true;
        }
      }

      return false;
    },

    forEach: function (arr, cb, context) {
      for (var i in arr) {
        var result = cb.apply(context ? context : window, [i, arr[i]]);
        if (result === false) break;
      }
    },

    trim: function(str) {
       return str.replace(/^\s+|\s+$/g, '');
    },

    getStyle: function(element, property) {
        var strValue = "";
        if(document.defaultView && document.defaultView.getComputedStyle){
            strValue = document.defaultView.getComputedStyle(element, "").getPropertyValue(property);
        }
        else if(element.currentStyle){
            property = property.replace(/\-(\w)/g, function (strMatch, p1){
                return p1.toUpperCase();
            });
            strValue = element.currentStyle[property];
        }
        return strValue;
    }

  };


  Core.EventDispatcher = {

    events: [],

    fire: function (sku) {
      var parts = sku.split(":");
      var type = parts[0];
      var model = parts[1];
      var prop = parts[2];
      var id = parts[3];
      var evt = [];
      for(var i in parts) {
        var part = parts[i];
        evt.push(part);
        var e = evt.join(":");
        var subscribers = (Core.EventDispatcher.events[e]) || [];
        Core.Utils.forEach(subscribers, function(listenerID, func) {
          func(e, type, model, prop, id);
        });
      }
    },



    subscribe: function (sku, listener, func) {
      if(!Core.EventDispatcher.events[sku]) {
        Core.EventDispatcher.events[sku] = []
      }
      Core.EventDispatcher.events[sku]["listener_"+listener.__ID__] = func.bind(listener);
    },

    revoke: function (sku, listener) {
      delete Core.EventDispatcher.events[sku]["listener_"+listener.__ID__];
      if(Core.EventDispatcher.events[sku].length === 0) {
        delete Core.EventDispatcher.events[sku];
      }
    }


  };


  Core.Parser = {

    RXP_OUTPUT_VAR: "\\{=\\s*(.*)\\s*\\}",

    RXP_IF_BLOCK: "\\{\\s*if\\s(.*)\\s*\\}",

    RXP_ELSE_BLOCK: "\\{\\s*else\\s*\\}",

    RXP_END_IF: "\\{\\s*endif\\s*\\}",

    RXP_LOOP_BLOCK: "\\{\\s*loop\\s(.*)\\s*\\}",

    RXP_END_LOOP: "\\{\\s*endloop\\s*\\}",

    ifStack: [],

    loopStack: [],

    ifOpenDepths: [],

    loopOpenDepths: [],

    ifNegation: false,

    parseComments: function (node, depth) {
      var nodes = node.childNodes,
          nLen = nodes.length,
          i = 0,
          current, data, block;

      if(!depth) depth = 1;

      for(i in nodes) {
        current = nodes[i];
        if (current.nodeType === 1) {
            if((block = this._currentIfBlock()) && (this._currentIfDepth() <= depth)) {
              console.log(block);
              current.setAttribute(this.ifNegation ? "cydr-hidden" : "cydr-visible", block);
            }
            else if((block = this._currentLoopBlock()) && (this._currentLoopDepth() <= depth)) {
              current.setAttribute("cydr-repeat", block);
            }
            else {
              this.parseComments(current, depth+1);
              continue;
            }
        }

        data = (current.nodeType === 8) ? current.data : (current.nodeType === 3 ? current.nodeValue : false);

        if(!data || this._matchTag(current, data, depth)) {
          continue;
        }

      }
    },

    _matchTag: function (current, data, depth) {
      return this._matchOutput(current, data) ||
             this._matchLoopBlock(current, data, depth) ||
             this._matchIfBlock(current, data, depth);
    },

    _matchOutput: function (current, data) {
      var replacement,
          matches = data.match(new RegExp(this.RXP_OUTPUT_VAR));
      if(matches) {
        replacement = document.createElement("SPAN");
        replacement.setAttribute("cydr-content", Core.Utils.trim(matches[1]));
        current.parentNode.replaceChild(replacement ,current);
        return true;
      }

      return false;
    },

    _matchLoopBlock: function (current, data, depth) {
      var matches, nodes;
          nodes;
      if(matches = data.match(new RegExp(this.RXP_LOOP_BLOCK))) {
        this.loopStack.push(Core.Utils.trim(matches[1]));
        this.loopOpenDepths.push(depth);
        return true;
      }
      else if(matches = data.match(new RegExp(this.RXP_END_LOOP))) {
        this.loopStack.pop();
        this.loopOpenDepths.pop();
        return true;
      }

      return false;
    },

    _matchIfBlock: function (current, data, depth) {
      var matches, nodes;
          nodes;
      if(matches = data.match(new RegExp(this.RXP_IF_BLOCK))) {
        console.log("found if block!!", matches);
        this.ifNegation = false;
        this.ifStack.push(Core.Utils.trim(matches[1]));
        this.ifOpenDepths.push(depth);
        return true;
      }
      else if(matches = data.match(new RegExp(this.RXP_ELSE_BLOCK))) {
        this.ifNegation = true;
        return true;
      }
      else if(matches = data.match(new RegExp(this.RXP_END_IF))) {
        this.ifStack.pop();
        this.ifOpenDepths.pop();
        return true;
      }

      return false;
    },

    _currentIfBlock: function () {
      return this.ifStack.length ? this.ifStack[this.ifStack.length-1] : false;
    },

    _currentLoopBlock: function () {
      return this.loopStack.length ? this.loopStack[this.loopStack.length-1] : false;
    },

    _currentIfDepth: function () {
      return this.ifOpenDepths.length ? this.ifOpenDepths[this.ifOpenDepths.length-1] : false;
    },

    _currentLoopDepth: function () {
      return this.loopOpenDepths.length ? this.loopOpenDepths[this.loopOpenDepths.length-1] : false;
    }


  }

  return Core;
});