define(['datatypes/datatype'], function(DataType) {
	
	HTMLText = DataType.extend({

	  _className: "HTMLText",

	  toString: function () {
	    return this.getValue();
	  },

	  renderSortable: function () {
	    return this._value.toUpperCase();
	  }

	});

	return HTMLText;
});