define(['bindings/binding'], function(Binding) {
	
	ClickBinding = Binding.extend({

	  _className: "ClickBinding",

	  initialize: function () {
	    var self = this;
	    this.element.addEventListener("click", function (e) {
	      e.preventDefault()
	      self.executeBindingExpression();
	    });
	    this._super();
	  }

	});


	return ClickBinding;
});