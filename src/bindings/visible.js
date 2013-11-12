define(['bindings/binding'], function(Binding) {
	
	VisibleBinding = Binding.extend({

	  _className: "VisibleBinding",

	  importValue: function () {
	    if (this.getValue().isFalsy()) {
	      this.element.style.display = "none";
	    } else {
	      this.element.style.display = null;
	    }
	  }
	});

	return VisibleBinding;
});