define(['core','bindings/json/json'], function(Cydr, JSONBinding) {
  
  AttrBinding = JSONBinding.extend({

    _className: "AttrBinding",

    importValue: function () {
      if (typeof this.getValue() != "object") {
        console.error(this.getClass() + " binding must return a JSON object of attribute-name: property/function pairs.");
      }
      Cydr.Utils.forEach(this.getValue(), function (attribute, exec) {
        if (typeof exec == "function") {
          this.element.setAttribute(attribute, exec());
        }
      }, this);
    }

  });

  return AttrBinding;
});