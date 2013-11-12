define(['bindings/binding'], function(Binding) {
	
	HiddenBinding = Binding.extend({

	  _className: "HiddenBinding",

	  importValue: function () {
	    if (this.getValue().isFalsy()) {
	      this.element.style.display = null;
	    } else {
	      this.element.style.display = "none";
	    }
	  }

	});

	return HiddenBinding;
});