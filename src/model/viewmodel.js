define(['./model','../core/core'], function(Model, Core) {

	"use strict";

	var ViewModel = Model.extend({

	  _className: "ViewModel",

	  _selector: "body",	  

	  __construct: function (selector) {
	    this._selector = selector;
	    this._super();
	  },


	  run: function (onReadyCallback) {	  	
	    var node = document.querySelector(this._selector);
	    this._parseComments(node);
	    if (node) {
	      this.applyBindingsToNode(node);
	      if(onReadyCallback) {
	      	onReadyCallback.call(this);
	      }
	    }
	  },


	  _parseComments: function (node) {
	  	var nodes = node.childNodes;
	  	var nLen = nodes.length;
	  	var current, matches, replacement;
        while (nLen--) {
            current = nodes[nLen];
            if (current.nodeType !== 8) {
                this._parseComments(current);
                continue;
            }
            matches = current.data.match(/\{%=\s*(.*)\s*%\}/);
			if(matches) {
				replacement = document.createElement("SPAN");
				replacement.setAttribute("cydr-content", Core.Utils.trim(matches[1]));
				current.parentNode.replaceChild(replacement ,current);
			}
        }
	  }
	});

	return ViewModel;
});
