define([
  'model/model',
  'model/collection',
  'model/datalist',
  'model/viewmodel',

  'datatypes/bool',
  'datatypes/htmltext',
  'datatypes/plaintext',

  'bindings/checked',
  'bindings/click',
  'bindings/content',
  'bindings/hidden',
  'bindings/visible',
  'bindings/submit',
  'bindings/value',
  'bindings/json/attr',
  'bindings/json/extraclasses',
  'bindings/loop/loop',
  'bindings/loop/options'


], function(
	Model,
	Collection,
	DataList,
	ViewModel,

	Bool,
	HTMLText,
	PlainText,

	CheckedBinding,
	ClickBinding,
	ContentBinding,
	HiddenBinding,
	VisibleBinding,
	SubmitBinding,
	ValueBinding,
	AttrBinding,
	ExtraclassesBinding,
	LoopBinding,
	OptionsBinding

) {

	var Cydr = {};

	Cydr.Model = Model;
	Cydr.Collection = Collection;
	Cydr.DataList = DataList;
	Cydr.ViewModel = ViewModel;

	Cydr.Bool = Bool;
	Cydr.HTMLText = HTMLText;
	Cydr.PlainText = PlainText;

	Cydr.CheckedBinding = CheckedBinding;
	Cydr.ClickBinding = ClickBinding;
	Cydr.ContentBinding = ContentBinding;
	Cydr.HiddenBinding = HiddenBinding;
	Cydr.VisibleBinding = VisibleBinding;
	Cydr.SubmitBinding = SubmitBinding;
	Cydr.ValueBinding = ValueBinding;
	Cydr.AttrBinding = AttrBinding;
	Cydr.ExtraclassesBinding = ExtraclassesBinding;
	Cydr.LoopBinding = LoopBinding;
	Cydr.OptionsBinding = OptionsBinding;

	return Cydr;
});