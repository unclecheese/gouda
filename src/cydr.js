define(function(require, exports, module) {
	
	var Cydr = {};

	Cydr.Collection 			= require('model/collection');
	Cydr.Model 					= require('model/model');
	Cydr.DataList 				= require('model/datalist');
	Cydr.ViewModel 				= require('model/viewmodel');

	Cydr.Boolean				= require('datatypes/bool');
	Cydr.HTMLText 				= require('datatypes/htmltext');
	Cydr.Text	 				= require('datatypes/plaintext');

	Cydr.CheckedBinding 		= require('bindings/checked');
	Cydr.ClickBinding 			= require('bindings/click');
	Cydr.ContentBinding 		= require('bindings/content');
	Cydr.HiddenBinding 			= require('bindings/hidden');
	Cydr.VisibleBinding 		= require('bindings/visible');
	Cydr.SubmitBinding 			= require('bindings/submit');
	Cydr.ValueBinding 			= require('bindings/value');
	Cydr.AttrBinding 			= require('bindings/json/attr');
	Cydr.ExtraclassesBinding 	= require('bindings/json/extraclasses');
	Cydr.LoopBinding 			= require('bindings/loop/loop');
	Cydr.OptionsBinding 		= require('bindings/loop/options');

	for(i in Cydr) {
		exports[i] = Cydr[i];
	}
	return Cydr;

});
