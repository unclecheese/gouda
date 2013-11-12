define(['bindings/binding'], function(Binding) {
  
  SubmitBinding = Binding.extend({

    _className: "SubmitBinding",

    allowedTags: ["FORM"],

    initialize: function () {
      var self = this;
      this.element.addEventListener("submit", function (e) {
        e.preventDefault();
        var formData = window.form2object(this.element);
        var func = this.bindingExec;
        if (typeof this.model[func] == "function") {
          this.model[func](formData);
        }
      })
      this._super();
    }
  });

  return SubmitBinding;
});