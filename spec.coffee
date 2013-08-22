class @TestApp extends Cydr.Controller

	properties:
		FirstName: "Text"
		LastName: "Text"
		IsMember: "Boolean"

	has_many:
		Todos: "Todo"
		Categories: "Category"


	defaults:
		FirstName: ""
		LastName: "Macho"		


	FullName: ->
		"#{@get 'FirstName'} #{@get 'LastName'}"

	createTodo: (formData) ->
		@get("Todos").push(new Todo(formData))

	createCategory: (formData) ->
		@get("Categories").push(new Category(formData))

	FilteredTodos: ->
		if @get("CategoryFilter").length
			console.log "got a filter"
			return @get("Todos").filter "Category", @get "CategoryFilter"
		@get "Todos"


class @Todo extends Cydr.Model

	properties:
		Title: "Text"
		IsDone: "Boolean"
		Category: "Text"

	defaults:
		Title: "New todo"

	Status: ->
		if @get("IsDone") then "done" else "open"

	Categories: ->
		App.get "Categories"


class @Category extends Cydr.Model

	properties:
		Title: "Text"

$ ->
	loadFixtures "spec.html"
	window.App = new TestApp "#spec"

describe "Unit tests", ->

	it "Sets properties", ->
		App.set "FirstName", "Joe"		
		expect(App.get "FirstName").toEqual "Joe"

	it "Applies default values", ->
		expect(App.get "LastName").toEqual "Macho"

	it "Adds to collections", ->
		App.get("Todos").push(new Todo({Title: "Todo1", IsDone: false, Category: "One"}))
		expect(App.get("Todos").getItems().length).toEqual 1

	it "Will assert that a property doesn't exist", ->
		expect(App.hasProp "garbage").toBeFalsy()
		expect(App.hasProp "FirstName").toBeTruthy()

	it "Will assert that a collection doesn't exist", ->
		expect(App.hasCollection "garbage").toBeFalsy()
		expect(App.hasCollection "Todos").toBeTruthy()

	it "Creates methods for every collection and property", ->
		expect(typeof App.LastName).toEqual "function"
		expect(typeof App.Todos).toEqual "function"
		expect(App.LastName().toString()).toEqual "Macho"		
		expect(App.Todos().isDataList).toBeTruthy()

	it "Allows custom getters", ->
		App.set "FirstName", "Joe"
		expect(App.FullName()).toEqual "Joe Macho"


describe "Integration tests", ->

	describe "Bindings", ->
		
		it "Has a functioning 'content' binding", ->
			App.set "FirstName", "Joe"		
			expect($("[cydr-content='FirstName']").html()).toEqual "Joe"

		it "Has a two-way 'value' binding", ->
			App.set "FirstName", "Bob"
			expect($("input[cydr-value='FirstName']").val()).toEqual "Bob"
			expect($("[cydr-content='FirstName']").html()).toEqual "Bob"				
			e = document.createEvent "HTMLEvents"
			e.initEvent "change"
			$("input[cydr-value='FirstName']").val("Roger")[0].dispatchEvent e
			$("[cydr-content='FirstName']").each ->
				expect($(this).html()).toEqual "Roger"
			expect(App.get("FirstName")).toEqual "Roger"
		
		it "Has a two-way 'checked' binding", ->
			App.set "IsMember", true
			expect($("input[cydr-checked='IsMember']")).toBeChecked()
			e = document.createEvent "HTMLEvents"
			e.initEvent "change"		
			$("input[cydr-checked='IsMember']").attr("checked", false)[0].dispatchEvent e
			expect(App.get "IsMember").toBeFalsy()

		it "Has an extra classes binding", ->
			App.set "IsMember", true
			expect($('#extraclass').hasClass("ismember")).toBeTruthy()
			App.set "IsMember", false
			expect($('#extraclass').hasClass("ismember")).toBeFalsy()

		it "Has an attribute binding", ->
			App.set "FirstName", "Paul"
			expect($('#attribute').attr("href")).toEqual "Paul"

		it "Has a click binding", ->
			e = document.createEvent "MouseEvents"
			e.initEvent "click"
			$('[cydr-click]')[0].dispatchEvent e
			expect(App.get "FirstName").toEqual "Susan"

		it "Has a visible binding", ->
			App.set "IsMember", true
			expect($('[cydr-visible]')).toBeVisible()
			App.set "IsMember", false
			expect($('[cydr-visible]')).toBeHidden()

		it "Has a hidden binding", ->
			App.set "IsMember", true
			expect($('[cydr-hidden]')).toBeHidden()
			App.set "IsMember", false
			expect($('[cydr-hidden]')).toBeVisible()

		it "Has an options binding", ->
			App.get("Categories").push(new Category({Title: "One"}));
			App.get("Categories").push(new Category({Title: "Two"}));

		describe "Loops", ->

			it "Will loop through a collection", ->
				App.get("Todos").push(new Todo({Title: "Todo2", IsDone: false, Category: "One"}))
				App.get("Todos").push(new Todo({Title: "Todo3", IsDone: true, Category: "Two"}))				
				expect($('#todoloop > li')).toHaveLength 3			
			it "Will apply bindings to nodes in a loop", ->
				App.get("Todos").push(new Todo({Title: "Todo4", IsDone: false, Category: "One"}))
				App.get("Todos").push(new Todo({Title: "Todo5", IsDone: true, Category: "One"}))
				$todo4 = $('#todoloop > li').eq 3
				$todo5 = $('#todoloop > li').eq 4				
				
				expect($todo4.find('span[cydr-content]').html()).toEqual "Todo4"
				expect($todo4.hasClass("done")).toBeFalsy()
				expect($todo5.find('input')).toBeChecked()
				expect($todo5.find('span[cydr-content]').html()).toEqual "Todo5"
				expect($todo5).toHaveClass "done"


		describe "Binding expressions", ->

			it "Can apply a custom getter with two properties", ->
				App.set "FirstName","Andrew"
				App.set "LastName","Hore"
				expect($('#fullname').text()).toEqual "Andrew Hore"

			it "Can count collections", ->
				l " ********************************************************************************* "						
				App.get("Todos").push(new Todo({Title: "Todo6", IsDone: false, Category: "Two"}))
				expect($('#todocount').text()).toEqual "6"

