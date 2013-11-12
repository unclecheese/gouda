define(['bindings/binding'], function(Binding) {
  
  CheckedBinding = Binding.extend({

    _className: "CheckedBinding",

    allowedTags: ["INPUT"],

    exportValueEvent: "change",

    importValue: function () {
      var v = this.getValue();
      if ((v && v.isDataType) && (!v.isFalsy())) {
        this.element.setAttribute("checked", "checked");
      } else {
        this.element.removeAttribute("checked");
      }
    },

    exportValue: function () {
      this.model.set(this.bindingExec, this.element.checked);
    }

  });

  return CheckedBinding;
});