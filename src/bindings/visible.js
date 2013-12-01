define(['./binding'], function(Binding) {
	
	"use strict";
	
	var VisibleBinding = Binding.extend({

	  _className: "VisibleBinding",

	  importValue: function () {
	  	var v = this.getValue();	  	
	    if (!v || (v.isDataType && v.isFalsy())) {	    	
	      this.element.style.display = "none";
	    } else {	    	
	      this.element.style.display = null;
	    }
	  }
	});

	return VisibleBinding;
});