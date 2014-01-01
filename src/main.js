define(function(require, exports, module) {

	"use strict";

	var Gouda = {};

	Gouda.Collection 			= require('./model/collection');
	Gouda.Model 				= require('./model/model');
	Gouda.DataList 				= require('./model/datalist');
	Gouda.ViewModel 			= require('./model/viewmodel');
	Gouda.JSONData 				= require('./model/jsondata');

	Gouda.Boolean				= require('./datatypes/boolean');
	Gouda.HTMLText 				= require('./datatypes/htmltext');
	Gouda.Text	 				= require('./datatypes/text');
	Gouda.Float	 				= require('./datatypes/float');
	Gouda.Int	 				= require('./datatypes/int');

	Gouda.CheckedBinding 		= require('./bindings/checked');
	Gouda.ClickBinding 			= require('./bindings/click');
	Gouda.ContentBinding 		= require('./bindings/content');
	Gouda.HiddenBinding 		= require('./bindings/hidden');
	Gouda.VisibleBinding 		= require('./bindings/visible');
	Gouda.SubmitBinding 		= require('./bindings/submit');
	Gouda.ValueBinding 			= require('./bindings/value');
	Gouda.AttrBinding 			= require('./bindings/json/attr');
	Gouda.ExtraclassesBinding 	= require('./bindings/json/extraclasses');
	Gouda.LoopBinding 			= require('./bindings/loop/loop');
	Gouda.OptionsBinding 		= require('./bindings/loop/options');

	Gouda.Model.Gouda = Gouda;
	Gouda.Model.Collection = Gouda.Collection;
	Gouda.Collection.Model = Gouda.Model;

	return Gouda;

});