define(['bindings/binding'], function(Binding) {

	ContentBinding = Binding.extend({

	  _className: "ContentBinding",

	  importValue: function () {
	    this.element.innerHTML = this.getValue();
	  }

	});

	return ContentBinding;
})