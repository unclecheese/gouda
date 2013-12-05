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
	    Core.Parser.parseComments(node);
	    if (node) {
	      this.applyBindingsToNode(node);
	      if(onReadyCallback) {
	      	onReadyCallback.call(this);
	      }
	    }
	  }


	});

	return ViewModel;
});
