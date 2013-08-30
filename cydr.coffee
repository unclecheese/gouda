window.fff = (msg, msg2) ->
	if msg2 then console.log msg, msg2 else console.log msg


class window.Cydr

	@_modelBindings = []

	@_collectionBindings = []

	@_analyzedExpressions = []

	@_analysisData = {}

	@_functionDependencies = []

	@_cachedExpressions = []

	@_events: []

	registerModelBinding: (model, binding) ->		
		Cydr._modelBindings[model.getID()] = [] if not Cydr._modelBindings[model.getID()]
		Cydr._modelBindings[model.getID()][binding.id] = binding

	getModelBindings: (model) ->
		Cydr._modelBindings[model]


	isAnalyzedExpression: (model, exp) ->
		Cydr._analyzedExpressions[model]?[exp]


	registerFunctionDependency: (model, prop) ->
		Cydr._functionDependencies.push "#{model.getClass()}:#{prop}:#{model.getID()}"
		#console.log "#{Cydr._analysisData.model}.#{Cydr._analysisData.expression} depends on #{model.getClass()}##{model.getID()}.#{prop}"

	getDependentFunctions: (model, exp) -> Cydr._functionDependencies[model][exp] or []

	isAnalyzing: -> 
		if Cydr._analysisData.model then true else false

	beginAnalysis: (model, exp) ->		
		Cydr._analyzedExpressions[model] = [] if not Cydr._analyzedExpressions[model]
		Cydr._analysisData =
			model: model
			expression: exp		

	endAnalysis: ->
		m = Cydr._analysisData.model
		e = Cydr._analysisData.expression
		Cydr._analyzedExpressions[m][e] = Cydr._functionDependencies
		Cydr._analysisData = {}
		Cydr._functionDependencies = []		

	getDependenciesForExpression: (model, exp) ->
		if Cydr._analyzedExpressions[model]
			return Cydr._analyzedExpressions[model][exp]	
		false


	fireEvent: (sku) ->
		subscribers = (Cydr._events[sku]) or []
		i = 0
		for id, func of subscribers
			i++
			func()
	

	subscribeToEvent: (sku, listener, func) ->		
		Cydr._events[sku] = [] if not Cydr._events[sku]
		Cydr._events[sku]["listener_#{listener.__ID__}"] = func.bind(listener)





class Cydr.Object

	@_instanceCount: 0

	@_instances: []

	__ID__: null

	constructor: ->
		Cydr.Object._instanceCount++
		@__ID__ = Cydr.Object._instanceCount

	getClass: -> @constructor.name

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



	init: ->
		if @allowedTags.length and @element.tagName not in @allowedTags
			alert "#{@getBindingAttribute()} binding must be on one of the following tags: #{@allowedTags.join ','}."		
		if @exportValueEvent			
			@element.addEventListener @exportValueEvent, =>				
				@exportValue()
		@element.setAttribute "title", "ID: #{@model.getID()}"
		@subscribe()
		@importValue()	


	importValue: ->

	exportValue: ->

	subscribe: ->		
		if @model.hasProp(@bindingExec) or @model.hasCollection(@bindingExec)
			evt = "ModelUpdated:#{@model.getClass()}:#{@bindingExec}:#{@model.getID()}"
			t = (@element.getAttribute "title") or ""
			@element.setAttribute "title", "#{t}//#{evt}"
			Cydr::subscribeToEvent evt, @, ->					
				@importValue()

		else if not Cydr::isAnalyzedExpression @model.getClass(), @bindingExec			
			Cydr::beginAnalysis @model.getClass(), @bindingExec			
			@model.exec @bindingExec
			Cydr::endAnalysis()
		
		result = @model.getExpresssionDependencies @bindingExec
		if result
			for dependency in result				
				parts = dependency.split ":"								
				evt = "ModelUpdated:#{parts[0]}:#{parts[1]}:#{parts[2]}"
				t = (@element.getAttribute "title") or ""
				@element.setAttribute "title", "#{t}//#{evt}"
				Cydr::subscribeToEvent evt, @, ->					
					@importValue()


	getBindingAttribute: ->
		klass = @constructor.name.replace /Binding$/, ''		
		"cydr-#{klass.toLowerCase()}"


	create: (model, element) ->		
		new Cydr[@getClass()] model, element


	getValue: -> @model.exec @bindingExec

	getController: ->
		node = @element
		while node.parentNode			
			if node.controller				
				return node.controller
			node = node.parentNode
		


class Cydr.ContentBinding extends Cydr.Binding

	importValue: ->	@element.innerHTML = @getValue()


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
				if opt.value is @getValue().toString()
					opt.selected = true
					break

	exportValue: ->		
		if @element.tagName is "INPUT"
			@model.set @bindingExec, @element.value
		else if @element.tagName is "SELECT"

			val = @element.options[@element.selectedIndex]?.getAttribute "value"
			val ?= ""			
			@model.set @bindingExec, val



class Cydr.CheckedBinding extends Cydr.Binding

	allowedTags: ["INPUT"]

	exportValueEvent: "change"

	importValue: ->	
		v = @getValue()		
		if (v?.isDataType) and (not v.isFalsy())
			@element.setAttribute "checked", "checked" 
		else
			@element.removeAttribute "checked"
		

	exportValue: -> @model.set @bindingExec, @element.checked


class Cydr.JSONBinding extends Cydr.Binding

	subscribe: ->
		if not Cydr::isAnalyzedExpression @model.getClass(), @bindingExec
			Cydr::beginAnalysis @model.getClass(), @bindingExec			
			obj = @model.exec @bindingExec			
			if typeof obj isnt "object"			
				console.error "#{@getClass()} binding must return a JSON object of classname: property/function pairs."
				return
			for className, prop of obj
				if typeof prop is "function" then prop() else @model.exec prop
			Cydr::endAnalysis()			
		result = @model.getExpresssionDependencies @bindingExec
		if result
			for dependency in result				
				parts = dependency.split ":"				
				Cydr::subscribeToEvent "ModelUpdated:#{@model.getClass()}:#{parts[1]}:#{@model.getID()}", @, ->					
					@importValue()		

class Cydr.ExtraclassesBinding extends Cydr.JSONBinding

	importValue: ->			
		for cssClass, exec of @model.exec @bindingExec
			rx = new RegExp "(^|\\s)#{cssClass}", "g"
			newClass = @element.className.replace rx, ""			
			if typeof exec is "function"				
				result = exec()				
				if not result?.isDataType then return
				unless result.isFalsy()
					@element.className += if @element.className.length then " #{cssClass}" else cssClass
				else
					@element.className = newClass

class Cydr.AttrBinding extends Cydr.JSONBinding

	importValue: ->
		if typeof @getValue() isnt "object"
			console.error "#{@getClass()} binding must return a JSON object of attribute-name: property/function pairs."			
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
			@model.exec @bindingExec
		super()



class Cydr.LoopBinding extends Cydr.Binding

	template: null

	constructor: (model, element) ->
		@nodes = []
		@modelNodeMap = []
		super model, element

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
		list = @model.exec @bindingExec	
		list.each (model) =>		
			cachedNodes = @modelNodeMap[model.getID()]
			if cachedNodes
				for node in cachedNodes					
					@element.appendChild node
			else
				@modelNodeMap[model.getID()] = []
				for node in @nodes				
					n = node.cloneNode true
					@element.appendChild n
					n.removeAttribute? "cydr-ignore"					
					model.applyBindingsToNode n
					@modelNodeMap[model.getID()].push n


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
		
		# ensure the value attribute goes last
		v = @element.getAttribute "cydr-value"
		if v
			@element.removeAttribute "cydr-value"
			@element.setAttribute "cydr-value", v
		@subscribe()
		@importValue()

	importValue: ->
		@clearContents()
		val = @element.getAttribute "cydr-value"
		if @caption
			dummy = document.createElement "option"
			dummy.setAttribute "value", ""
			dummy.innerHTML = @caption
			@element.appendChild dummy
		list = @model.exec @bindingExec		
		list.each (model) =>
			opt = document.createElement "option"
			opt.setAttribute "cydr-content", @textField
			opt.setAttribute "cydr-attr", "{value: #{@valueField}}"
			
			val1 = model.exec(@valueField)
			val2 = @model.exec(val)
			if val1.isDataType and val2.isDataType and (val1.getValue() is val2.getValue())				
				opt.setAttribute "selected", true
			@element.appendChild opt
			model.applyBindingsToNode opt			






class Cydr.DataType extends Cydr.Object

	_value: ""

	@isDataType: true

	isDataType: true

	constructor: (val = "") ->
		super()		
		@_value = val
		
	setValue: (val) -> @_value = val

	getValue: -> @_value

	isFalsy: ->		
		if not @_value or @_value is "undefined"
			return true
		@_value.length is 0

	toString: -> @getValue()

	renderSortable: -> @_value


class Cydr.Text extends Cydr.DataType

	LimitCharacterCount: (count) -> @getValue().substring 0, count

	toString: ->
		@getValue()?.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

	renderSortable: -> @_value.toUpperCase()

class Cydr.HTMLText extends Cydr.DataType

	toString: -> @getValue()


	renderSortable: -> @_value.toUpperCase()


class Cydr.Boolean extends Cydr.DataType

	Nice: -> if @getValue() then "Yes" else "No"

	isFalsy: ->	not @getValue()

	renderSortable: -> parseInt @_value

	getValue: ->
		if (@_value is 1) or (@_value is "1") or (@_value is true)
			return true
		false

class Cydr.Model extends Cydr.Object
	
	
	properties: {}

	has_many: {}

	defaults: {}

	casting: {}

	expressions: {}

	_mutatedProperties: {}

	_mutatedCollections: {}

	controller: null

	@isModel: true

	isModel: true

	collection: null


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
			f = new Function "return this.get('#{name}');"
			@[name] = f.bind @
		for prop, val of @defaults			
			@_mutatedProperties[prop].setValue val if @hasProp prop
		for prop, val of data			
			@_mutatedProperties[prop].setValue val if @hasProp prop
		@_mutatedProperties["__id__"] = Cydr.Object._instanceCount
		@_mutatedProperties["__destroyed__"] = false				

	set: (prop, value) ->		
		@_mutatedProperties[prop].setValue value		
		@notify(prop) if not Cydr::isAnalyzing()


	obj: (prop) ->
		if Cydr::isAnalyzing()			
			Cydr::registerFunctionDependency @, prop		
		if (not @hasProp prop) and (not @hasCollection prop) and (typeof @[prop] is "function")
			return @[prop]()		
		@_mutatedProperties[prop] or @_mutatedCollections[prop]


	exec: (exp) ->
		ret = (@_mutatedProperties[exp]) or (@_mutatedCollections[exp])
		return ret if ret
		
		if @[exp]			
			return @[exp]()
		if @getCachedExpression exp
			func = @getCachedExpression exp
			try				
				result = func(@)				
			catch e
				console.log "Could not run expression '#{func.toString()}' on #{@getClass()}"
				console.log e.message
				return new Cydr.DataType ""
			result


	getCachedExpression: (exp) ->
		if not Cydr._cachedExpressions[@getClass()]
			Cydr._cachedExpressions[@getClass()] = []
		if not Cydr._cachedExpressions[@getClass()][exp]
			body = "with(scope) { return #{exp}; }"			
			Cydr._cachedExpressions[@getClass()][exp] = new Function "scope", body

		Cydr._cachedExpressions[@getClass()][exp]
	

	getExpresssionDependencies: (exp) ->
		Cydr::getDependenciesForExpression @getClass(), exp

	get: (prop) ->		
		if Cydr::isAnalyzing()			
			Cydr::registerFunctionDependency @, prop
		if @_mutatedProperties[prop]
			return @_mutatedProperties[prop].getValue()
		else if @_mutatedCollections[prop]				
			return @_mutatedCollections[prop]


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

	Up: ->
		@controller


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

	getBindings: ->
		Cydr._modelBindings[@getID()]

	notify: (prop) ->		
		Cydr::fireEvent "ModelUpdated:#{@getClass()}:#{prop}:#{@getID()}"
		@collection.notify() if @collection
			

	setCollection: (collection) ->
		@collection = collection


class Cydr.Collection extends Cydr.Object

	owner: null

	model: null

	name: null

	constructor: (@owner, @model, @name) ->
		super()
		@_records = []

	count: -> @_records.length

	get: -> 
		list = new Cydr.DataList @_records
		list.setCollection @
		list

	each: (callback) -> @get().each callback

	notify: -> @owner.notify @name

	push: (model) ->	
		@_records.push model
		@owner.notify @name


	pushMany: (items = []) ->
		@_records.push(i) for i in items
		@owner.notify @name





class Cydr.DataList extends Cydr.Object

	isDataList: true

	sortField: null

	sortDir: "ASC"

	limitNumber: null

	collection: null


	constructor: (items = []) ->
		super()
		@_items = items
		@filters = []
		@resultSet = []	


	setCollection: (collection) ->
		@collection = collection


	getItems: ->		
		@_items


	filter: (filter, value) ->
		@filters.push
			filter: filter
			value: value
		@

	sort: (field, dir) ->
		@sortField = field
		@sortDir = dir
		@


	limit: (limit) ->
		@limitNumber = parseInt limit
		@


	execute: ->	
		if @filters.length			
			@resultSet
			for filterData in @filters
				[field, operator] = filterData.filter.split ":"
				operator = "EqualTo" if not operator
				switch operator
					when "EqualTo"
						for i in @_items
							if i.get(field) is filterData.value
								@resultSet.push i 
		else
			@resultSet = @_items					
		if @sortField			
			@resultSet = @resultSet.sort (a, b) =>
				reverse = if @sortDir is "DESC" then true else false
				A = a.obj(@sortField).renderSortable()
				B = b.obj(@sortField).renderSortable()
				if (A < B) 
					ret = -1
				else if (A > B) 
					ret = 1
				else 
					ret = 0
				ret * [-1,1][+!!reverse]		
		if @limitNumber		
			@resultSet = @resultSet.slice 0, @limitNumber
		model.setCollection @collection for model in @resultSet
		@resultSet

	isFalsy: -> @_items.length is 0


	count: -> 
		@execute().length		

	each: (callback) ->		
		results = @execute()
		callback(item) for item in results

	reset: ->
		@filters = []
		@sortField = null
		@sortDir = "ASC"
		@limit = null
		@executed = false
		@resultSet = []



class Cydr.Controller extends Cydr.Model

	constructor: (selector) ->
		super()
		node = document.querySelector selector
		if node		
			node.controller = @
			@applyBindingsToNode node				


# Cuz68a32
# 1074329
