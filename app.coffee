class @TestApp extends Cydr.Controller

	properties:
		FirstName: "Text"
		LastName: "Text"
		CategoryFilter: "Text"

	has_many:
		Todos: "Todo"
		Categories: "Category"


	defaults:
		FirstName: ""		


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

window.App = new TestApp "body"
App.get("Todos").push(new Todo({Title: "Shitty", IsDone: false, Category: "One"}))
App.get("Todos").push(new Todo({Title: "Bitty", IsDone: false, Category: "One"}))
App.get("Todos").push(new Todo({Title: "Litty", IsDone: false, Category: "Two"}))

App.get("Categories").push(new Todo({Title: "One"}))
App.get("Categories").push(new Todo({Title: "Two"}))
App.get("Categories").push(new Todo({Title: "Three"}))
