define(['core','bindings/json/json'], function(Cydr, JSONBinding) {
  
  ExtraclassesBinding = JSONBinding.extend({

    _className: "ExtraclassesBinding",

    importValue: function () {
      Cydr.Utils.forEach(this.executeBindingExpression(), function (cssClass, exec) {
        var rx = new RegExp("(^|\\s)" + cssClass, "g");
        var newClass = this.element.className.replace(rx, "");
        if (typeof exec == "function") {
          var result = exec();
          if (!result || !result.isDataType) return;
          if (!result.isFalsy()) {
            this.element.className += this.element.className.length ? " " + cssClass : cssClass;
          } else {
            this.element.className = newClass;
          }
        }

      }, this);
    }
  });

  return ExtraclassesBinding;
});