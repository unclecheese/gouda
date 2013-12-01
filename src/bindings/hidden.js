define(['./binding'], function(Binding) {
	
	"use strict";
	
	var HiddenBinding = Binding.extend({

	  _className: "HiddenBinding",

	  importValue: function () {
	  	var v = this.getValue();
	    if (!v || v.isDataType && v.isFalsy()) {
	      this.element.style.display = null;
	    } else {
	      this.element.style.display = "none";
	    }
	  }

	});

	return HiddenBinding;
});