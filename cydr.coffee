window.l = (msg, msg2) ->
	if msg2 then console.log msg, msg2 else console.log msg


class window.Cydr

	@_modelBindings = []

	@_collectionBindings = []

	@_analyzedFunctions = []

	@_analysisData = {}

	@_functionDependencies = []

	registerModelBinding: (model, binding) ->
		Cydr._modelBindings[model.getClass()] = [] if not Cydr._modelBindings[model.getClass()]
		Cydr._modelBindings[model.getClass()].push binding		

	getModelBindings: (model) ->
		Cydr._modelBindings[model]

	registerCollectionBinding: (collection, binding) ->				
		Cydr._collectionBindings[collection] = [] if not Cydr._collectionBindings[collection]
		Cydr._collectionBindings[collection].push binding

	getCollectionBindings: (collection = null) ->
		if collection then Cydr._collectionBindings[collection] else Cydr._collectionBindings

	isAnalyzedFunction: (model, func) ->
		funcs = Cydr._analyzedFunctions[model] or []
		for f in funcs
			return true if f is func
		false

	registerAnalyzedFunction: (model, func) ->
		Cydr._analyzedFunctions[model] = [] if not Cydr._analyzedFunctions[model]
		Cydr._analyzedFunctions[model].push func

	registerFunctionDependency: (model, prop) ->
		Cydr._functionDependencies[model] = [] if not Cydr._functionDependencies[model]
		Cydr._functionDependencies[model][prop] = [] if not Cydr._functionDependencies[model][prop]
		Cydr._functionDependencies[model][prop].push Cydr._analysisData.model, Cydr._analysisData.func

	getDependentFunctions: (model, prop) -> Cydr._functionDependencies[model][prop] or []

	isAnalyzing: -> 
		Cydr._analysisData.model

	beginAnalysis: (model, func) ->
		Cydr._analysisData =
			model: model
			func: func		

	endAnalysis: ->
		Cydr._analysisData = {}

	reset: ->
		Cydr._modelBindings = []
		Cydr._collectionBindings = []
		Cydr._analyzedFunctions = []
		Cydr._analysisData = {}
		Cydr._functionDependencies = []





class Cydr.Object

	@_instanceCount: 0

	constructor: ->
		Cydr.Object._instanceCount++

	getClass: ->
		@constructor.name

class Cydr.Binding extends Cydr.Object

	bindingAttribute: ""

	bindingExec: null

	element: null

	model: null

	exportValueEvent: null

	importFunction: null

	allowedTags: []


	constructor: (model, element) ->
		super()
		@element = element
		@model = model
		attValue = @element.getAttribute @getBindingAttribute()
		@bindingExec = attValue		
		@importFunction = @createImportFunction()


	init: ->
		if @allowedTags.length and @element.tagName not in @allowedTags
			alert "#{@getBindingAttribute()} binding must be on one of the following tags: #{@allowedTags.join ','}."		
		if @exportValueEvent			
			@element.addEventListener @exportValueEvent, =>
				@exportValue()

		Cydr::registerModelBinding @model, @
		@importValue()


	importValue: ->

	exportValue: ->


	createImportFunction: ->		
		@importFunction = new Function "scope", "with(scope) {return #{@bindingExec}; }"		

	getBindingAttribute: ->
		klass = @constructor.name.replace /Binding$/, ''		
		"cydr-#{klass.toLowerCase()}"


	create: (model, element) ->		
		new Cydr[@getClass()] model, element


	getValue: ->			
		result = @importFunction @model				
		if typeof result is "function"			
			return result.call @model		
		result

	getController: ->
		node = @element
		while node.parentNode			
			if node.controller				
				return node.controller
			node = node.parentNode
		


class Cydr.ContentBinding extends Cydr.Binding

	importValue: ->		
		@element.innerHTML = @getValue()

class Cydr.SubmitBinding extends Cydr.Binding

	allowedTags: ["FORM"]

	init: ->
		@element.addEventListener "submit", (e) =>
			e.preventDefault()
			formData = window.form2object @element
			func = @bindingExec			
			if typeof @model[func] is "function"	
				@model[func](formData)
		super()
			



class Cydr.ValueBinding extends Cydr.Binding

	allowedTags: ["INPUT","SELECT"]

	exportValueEvent: "change"

	importValue: ->
		if @element.tagName is "INPUT"
			@element.value = @getValue()
		else if @element.tagName is "SELECT"			
			for opt in @element.options				
				if opt.value is @getValue()
					opt.selected = true
					break

	exportValue: ->		
		if @element.tagName is "INPUT"
			@model.set @bindingExec, @element.value
		else if @element.tagName is "SELECT"
			@model.set @bindingExec, @element.options[@element.selectedIndex].getAttribute "value"



class Cydr.CheckedBinding extends Cydr.Binding

	allowedTags: ["INPUT"]

	exportValueEvent: "change"

	importValue: ->				
		if not @getValue().isFalsy() then @element.setAttribute "checked", "checked" else @element.removeAttribute "checked"

	exportValue: ->
		@model.set @bindingExec, @element.checked

class Cydr.ExtraclassesBinding extends Cydr.Binding

	importValue: ->	
		if typeof @getValue() isnt "object"
			console.error "Extraclasses binding must return a JSON object of classname: property/function pairs."					
		for cssClass, exec of @getValue()
			rx = new RegExp "(^|\\s)#{cssClass}", "g"
			newClass = @element.className.replace rx, ""			
			if typeof exec is "function"				
				result = exec()				
				unless result.isFalsy()
					@element.className += if @element.className.length then " #{cssClass}" else cssClass
				else
					@element.className = newClass

class Cydr.AttrBinding extends Cydr.Binding

	importValue: ->
		if typeof @getValue() isnt "object"
			console.error "Extraclasses binding must return a JSON object of classname: property/function pairs."			
		for attribute, exec of @getValue()
			if typeof exec is "function"
				@element.setAttribute attribute, exec()

class Cydr.VisibleBinding extends Cydr.Binding

	importValue: ->
		if @getValue().isFalsy() then @element.style.display = "none" else @element.style.display = null

class Cydr.HiddenBinding extends Cydr.Binding

	importValue: ->		
		if @getValue().isFalsy() then @element.style.display = null else @element.style.display = "none"

class Cydr.ClickBinding extends Cydr.Binding

	init: ->		
		@element.addEventListener "click", (e) =>
			e.preventDefault()			
			@importFunction @model
		super()



class Cydr.LoopBinding extends Cydr.Binding

	template: null

	nodes: []

	init: ->		
		@loadTemplate() if @nodes.length is 0
		super()

	loadTemplate: ->		
		for n in @element.getElementsByTagName "*"			
			n.setAttribute? "cydr-ignore", "true"			
		nodes = @element.innerHTML
		dummy = document.createElement "div"
		dummy.innerHTML = nodes
		@clearContents()		
		for n in dummy.getElementsByTagName "*"
			n.removeAttribute? "cydr-ignore"
		@template = dummy
		sib = @template.children[0]		
		@nodes.push sib
		loop
			sib = sib.nextSibling
			break if not sib
			nodes.push sib if sib.tagName


	clearContents: ->
		while @element.hasChildNodes()			
			@element.removeChild @element.lastChild			

	importValue: ->
		@clearContents()
		list = @model.get @bindingExec		
		for model, i in list.getItems()							
			for node in @nodes				
				n = node.cloneNode true
				@element.appendChild n
				n.removeAttribute? "cydr-ignore"				
				model.applyBindingsToNode n


class Cydr.OptionsBinding extends Cydr.LoopBinding

	valueField: null

	textField: null

	caption: null

	collection: null
	

	init: ->		
		if @element.tagName isnt "SELECT"
			alert "cydr-options binding must be on a select element."		
		@valueField = @element.getAttribute "cydr-optionvalue"
		@textField = @element.getAttribute "cydr-optiontext"
		@caption = @element.getAttribute "cydr-optioncaption"
		Cydr::registerModelBinding @model, @
		@importValue()

	importValue: ->
		@clearContents()
		if @caption
			dummy = document.createElement "option"
			dummy.setAttribute "value", ""
			dummy.innerHTML = @caption
			@element.appendChild dummy
		list = @model.get @bindingExec
		for model, i in list.getItems()			
			opt = document.createElement "option"
			opt.setAttribute "cydr-content", @textField
			opt.setAttribute "cydr-attr", "{value: #{@valueField}}"
			@element.appendChild opt
			model.applyBindingsToNode opt






class Cydr.DataType extends Cydr.Object

	_value: ""

	@isDataType: true

	constructor: (val = "") ->
		super()		
		@_value = val
		
	setValue: (val) ->
		@_value = val

	getValue: ->
		@_value

	isFalsy: ->		
		if not @_value or @_value is "undefined"
			return true
		@_value.length is 0

	toString: ->
		@getValue()

	



class Cydr.Text extends Cydr.DataType

	LimitCharacterCount: (count) ->
		@getValue().substring 0, count

	toString: ->
		@getValue()?.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

class Cydr.HTMLText extends Cydr.DataType

	toString: ->		
		@getValue()


class Cydr.Boolean extends Cydr.DataType

	Nice: ->
		if @getValue() then "Yes" else "No"

	isFalsy: ->
		not @getValue()

class Cydr.Model extends Cydr.Object
	
	
	properties: {}

	has_many: {}

	defaults: {}

	casting: {}

	_mutatedProperties: {}

	_mutatedCollections: {}

	controller: null

	@isModel: true


	stat: (prop) ->		
		Cydr[@getClass()][prop]



	constructor: (data) ->
		super()		
		@_mutatedProperties = {}
		@_mutatedCollections = {}		
		for name, type of @properties			
			if not Cydr[type]?.isDataType
				throw new Error "DataType 'Cydr.#{type}' does not exist!"
				break
			@_mutatedProperties[name] = new Cydr[type]()
			f = new Function "return this.obj('#{name}');"
			@[name] = f.bind @
		for name, type of @has_many			
			if not window[type]?.isModel				
				throw new Error "Model '#{type}' does not exist!"
				break			
			@_mutatedCollections[name] = new Cydr.Collection @, type, name
			f = new Function "return this._mutatedCollections['#{name}'].getList();"
			@[name] = f.bind @
		for prop, val of @defaults			
			@_mutatedProperties[prop].setValue val if @hasProp prop
		for prop, val of data	
			@_mutatedProperties[prop].setValue val if @hasProp prop
		@_mutatedProperties["__id__"] = Cydr.Object._instanceCount
		@_mutatedProperties["__destroyed__"] = false				

	set: (prop, value) ->		
		@_mutatedProperties[prop].setValue value
		@notify()


	obj: (prop) ->
		if (not @hasProp prop) and (not @hasCollection prop)
			return @castFunction prop		
		@_mutatedProperties[prop] or @_mutatedCollections[prop]


	get: (prop) ->
		if (not @hasProp prop) and (not @hasCollection prop)			
			return @castFunction prop
		else
			if Cydr::isAnalyzing()
				Cydr::registerFunctionDependency @getClass(), prop
			if @_mutatedProperties[prop]
				return @_mutatedProperties[prop].getValue()
			else if @_mutatedCollections[prop]			
				return @_mutatedCollections[prop].getList()


	castFunction: (func) ->
		if not Cydr::isAnalyzedFunction @getClass(), func
			Cydr::beginAnalysis @getClass(), func			
			ret = @[func]()	
			Cydr::endAnalysis()
		if not ret.isDataType and not ret.isDataList
			dataType = @casting[func] or "Text"			
			if typeof Cydr[dataType] isnt "function"
				alert "Tried to cast #{func} as #{dataType}, but that datatype doesn't exist."
				return
			return new Cydr[dataType](ret)
		ret


	hasProp: (prop) ->		
		@properties[prop] isnt undefined


	hasCollection: (collection) ->		
		@has_many[collection] isnt undefined


	getID: ->
		@_mutatedProperties["__id__"]


	bindToElement: (el) ->		
		rx = new RegExp '^cydr-', 'i'
		alpha = new RegExp '^[a-z0-9_]+$', 'i'
		atts = el.attributes or []
		for att in atts			
			if rx.test att.name
				type = att.name.split("-").pop()
				klass = "#{type.charAt(0).toUpperCase() + type.slice(1)}Binding"
				if typeof Cydr[klass] is "function"					
					binding = new Cydr[klass](@, el)					
					@controller = binding.getController() if not @controller
					el.context = @					
					binding.init()


	applyBindingsToNode: (node) ->		
		stack = [node]
		nl = node.getElementsByTagName "*" or []
		els = (n for n in nl)
		els.unshift node	
		rx = new RegExp '^cydr-', 'i'
		for el in els			
			atts = el?.attributes or []	
			if not el.getAttribute? "cydr-ignore"				
				for att in atts					
					if rx.test att.name
						@bindToElement el
						break


	notify: ->		
		bindings = (Cydr::getModelBindings @getClass() or [])		
		for binding in bindings					
			binding.importValue()




class Cydr.Collection extends Cydr.Object

	_list: []

	_nodes: []

	owner: null

	model: null

	name: null

	constructor: (@owner, @model, @name, list) ->
		super()
		list = [] if not list
		if list.isDataList
			@_list = list
		else			
			@_list = new Cydr.DataList list
		@_list.setCollection @

	count: ->
		@_list.getItems().length


	push: (data) ->
		@_list.addItem data		
		@owner.notify()

	getItems: ->
		@_list.getItems()

	getList: ->
		@_list






class Cydr.DataList extends Cydr.Object

	isDataList: true

	collection: null

	_items = []


	constructor: (items) ->
		super()
		@_items = items


	setCollection: (collection) ->
		@collection = collection


	getItems: ->
		@_items

	push: (model) ->
		@_items.push model
		@collection.owner.notify()

	filter: (filter, value) ->
		[field, operator] = filter.split ":"
		operator = "EqualTo" if not operator
		result = []
		switch operator
			when "EqualTo" then result.push i for i in items when i.get field is value		
		new DataList result


	isFalsy: -> @_items.length is 0

	count: -> 
		@_items.length




class Cydr.Controller extends Cydr.Model

	constructor: (selector) ->
		super()
		node = document.querySelector selector
		if node		
			node.controller = @
			@applyBindingsToNode node				



