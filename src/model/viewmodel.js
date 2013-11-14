define(['model/model'], function(Model) {

	ViewModel = Model.extend({

	  _className: "ViewModel",

	  __construct: function (selector) {
	    this._super();
	    node = document.querySelector(selector);
	    if (node) {
	      this.applyBindingsToNode(node);
	    }
	  }
	});

	return ViewModel;
});
