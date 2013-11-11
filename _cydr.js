/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
(function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

  // The base Class implementation (does nothing)
  this.Class = function(){};

  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var _super = this.prototype;

    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;

    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" &&
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;

            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];

            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);
            this._super = tmp;

            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }

    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.__construct )
        this.__construct.apply(this, arguments);
    }

    // Populate our constructed prototype object
    Class.prototype = prototype;

    // Enforce the constructor to be what we expect
    Class.prototype.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;

    return Class;
  };
})();

var Cydr = {

  analyzedExpressions: [],

  analysisData: [],

  functionDependencies: [],

  cachedExpressions: [],

  eventDispatcher: null,

  getEventDispatcher: function() {
    return this.eventDispatcher ? this.eventDispatcher : (this.eventDispatcher = new Cydr.EventDispatcher());
  },

  isAnalyzedExpression: function(model, exp) {
    return this.analyzedExpressions[model] && this.analyzedExpressions[model][exp];
  },

  registerFunctionDependency: function(model, prop) {
    this.functionDependencies.push(model.getClass()+":"+prop+":"+model.getID());
  },

  getDependentFunctions: function(model, exp) {
    return this.functionDependencies[model][exp] || []
  },

  isAnalyzing: function() {
    return this.analysisData.model;
  },


  beginAnalysis: function (model, exp) {
    if(!this.analyzedExpressions[model]) {
      this.analyzedExpressions[model] = [];
    }
    this.analysisData = {
      model: model,
      expression: exp
    };
  },

  endAnalysis: function() {
    var m = this.analysisData.model, e = this.analysisData.expression;
    this.analyzedExpressions[m][e] = this.functionDependencies;
    this.analysisData = {};
    this.functionDependencies = [];
  }

});


Cydr.Utils = {

  inArray: function(needle, heystack) {
    for(i in heystack) {
      if(heystack[i] == needle) {
        return true;
      }
    }

    return false;
  },

  forEach: function (arr, cb, context) {
    for(i in arr) {
      var result = cb.apply(context ? context : window, [i, arr[i]]);
      if(result === false) break;
    }
  }
}


Cydr.EventDispatcher = Class.extend({

  _events: [],

  fire: function (sku) {
    var subscribers = this._events[sku] || [];
    var i = 0;
    for(id in subscribers) {
      if(typeof subscribers[id] == "function") {
        subscribers[id]();
      }
    }
  },


  subscribe: function (sku, listener, func) {
    if(!this._events[sku]) {
      this._events[sku] = [];
      this._events[sku]["listener_"+listener.__ID__] = func.bind(listener);
    }

  },


});


Cydr.Object = Class.extend({

  _instanceCount: 0,

  _instances: [],

  __ID__: null,

  _className: "Object",

  __construct: function() {
    Cydr.Object.prototype._instanceCount++;
    this.__ID__ = Cydr.Object._instanceCount;
  },

  getClass: function() {
    return this._className;
  }
});



Cydr.Binding = Cydr.Object.extend({

  _className: "Binding",

  bindingAttribute: "",

  bindingExec: null,

  element: null,

  model: null,

  exportValueEvent: null,

  importFunction: null,

  allowedTags: [],

  parent: null,

  __construct: function(model, element) {
    this._super();
    this.element = element;
    this.model = model;
    this.attValue = this.element.getAttribute(this.getBindingAttribute());
    this.bindingExec = attValue;



  initialize: function() {
    if(this.allowedTags.length && !Cydr.Utils.inArray(this.element.tagName, this.allowedTags)) {
      console.error(this.getBindingAttribute() + "binding must be on one of the following tags: " + this.allowedTags.join(',') + ".");
    }
    if(this.exportValueEvent) {
      var self = this;
      this.element.addEventListener(this.exportValueEvent, function() {
        self.exportValue();
      });
    }
    this.element.setAttribute("title", "ID: "+ this.model.getID());
    this.subscribe();
    this.importValue();
  },

  importValue: function() {},

  exportValue: function() {},

  subscribe: function() {
    if(this.model.hasProp(this.bindingExec) || this.model.hasCollection(this.bindingExec)) {
      var evt = "ModelUpdated:"+this.model.getClass()+":"+this.bindingExec+":"+this.model.getID();
      var t = (this.element.getAttribute("title")) || "";
      this.element.setAttribute("title", t+"//"+evt);
      this.model.getController().getEventDispatcher().subscribe(evt, this, function() {
        this.importValue()
      });
    }
    else if(!Cydr.isAnalyzedExpression(this.model.getClass(), this.bindingExec)) {
      Cydr.beginAnalysis(this.model.getClass(), this.bindingExec);
      this.model.exec(this.bindingExec);
      Cydr.endAnalysis();
    }

    var result = this.model.getExpresssionDependencies(this.bindingExec);
    if(result) {
      Cydr.Utils.forEach(dependency, function(key, val) {
        var parts = val.split ":"
        var evt = "ModelUpdated:"+parts[0]+":"+parts[1]+":"+parts[2];
        var t = (this.element.getAttribute("title")) || "";
        this.element.setAttribute("title", t+"//"+evt);
        Cydr.subscribeToEvent(evt, this, function() {
          this.importValue()
        });
      }, this);
    }
  },

  getBindingAttribute: function() {
    var klass = this.getClass().replace(/Binding$/, '');
    return "cydr-"+klass.toLowerCase();
  },


  create: function(model, element) {
    return new Cydr[this.getClass()](model, element);
  },


  getValue: function() {
    return this.executeBindingExpression();
  },


  executeBindingExpression: function() {
    return this.model.exec(this.bindingExec, this);
  },


  getParentBinding: function() {
    if(this.parent) return this.parent;
    var node = this.element;
    while(node.parentNode) {
      if(node.parent) {
        this.parent = node.parent;
        return this.parent;
      }
      node = node.parentNode;
    }
  }


});


Cydr.ContentBinding = Cydr.Binding.extend({

  _className: "ContentBinding",

  importValue: function() {
    this.element.innerHTML = this.getValue();
  }

});


Cydr.SubmitBinding = Cydr.Binding.extend({

  _className: "SubmitBinding",

  allowedTags: ["FORM"],

  initialize: function() {
    var self = this;
    this.element.addEventListener("submit", function(e) {
      e.preventDefault();
      var formData = window.form2object(this.element);
      var func = this.bindingExec;
      if(typeof this.model[func] == "function") {
        this.model[func](formData);
      }
    })
    this._super();
  }
});


Cydr.ValueBinding = Cydr.Binding.extend({

  _className: "ValueBinding",

  allowedTags: ["INPUT","SELECT"],

  exportValueEvent: "change",

  importValue: function() {
    if(this.element.tagName == "INPUT") {
      this.element.value = this.getValue();
    }
    else if(this.element.tagName == "SELECT") {
      Cydr.Utils.forEach(this.element.options, function(key, opt) {
        if(opt.value == this.getValue().toString()) {
          opt.selected = true;
          return false;
        }
      }, this);
    }

  exportValue: function() {
    if(this.element.tagName == "INPUT") {
      this.model.set(this.bindingExec, this.element.value);
    }
    else if(this.element.tagName is "SELECT") {
      var val = this.element.options[this.element.selectedIndex] ? this.element.options[this.element.selectedIndex].getAttribute("value") : "";
      this.model.set(this.bindingExec, val);
    }

});

Cydr.CheckedBinding = Cydr.Binding.extend({

  _className: "CheckedBinding",

  allowedTags: ["INPUT"],

  exportValueEvent: "change",

  importValue: function() {
    var v = this.getValue();
    if((v && v.isDataType) && (!v.isFalsy())) {
      this.element.setAttribute("checked", "checked");
    }
    else {
      this.element.removeAttribute("checked");
    }
  },

  exportValue: function() {
    this.model.set(this.bindingExec, this.element.checked);
  }

});


Cydr.JSONBinding = Cydr.Binding.extend({

  _className: "JSONBinding",

  subscribe: function() {
    if(!Cydr.isAnalyzedExpression(this.model.getClass(), this.bindingExec)) {
      Cydr.beginAnalysis(this.model.getClass(), this.bindingExec);
      var obj = this.executeBindingExpression();
      if(typeof obj != "object") {
        console.error(this.getClass()+ " binding must return a JSON object of classname: property/function pairs.");
        return;
      }
      Cydr.Utils.forEach(obj, function(className, prop) {
        if(typeof prop == "function") {
          prop();
        }
        else {
          this.model.exec(prop);
        }
      });
      Cydr.endAnalysis();
    }
    var result = this.model.getExpresssionDependencies(this.bindingExec);
    if(result) {
      Cydr.Utils.forEach(result, function(dependency, dummy) {
        var parts = dependency.split ":"
        Cydr.subscribeToEvent("ModelUpdated:"+this.model.getClass()+":"+parts[1]+":"+this.model.getID(), this, function() {
          this.importValue();
        });
      },this);
    }
});

Cydr.ExtraclassesBinding = Cydr.JSONBinding.extend({

  _className: "ExtraclassesBinding",

  importValue: function() {
    Cydr.Utils.forEach(this.executeBindingExpression(), function(cssClass, exec) {
      var rx = new RegExp("(^|\\s)"+cssClass, "g");
      var newClass = this.element.className.replace(rx, "");
      if(typeof exec == "function") {
        var result = exec();
        if(!result || !result.isDataType) return;
        if(!result.isFalsy()) {
          this.element.className += this.element.className.length ? " " + cssClass : cssClass;
        }
        else {
          this.element.className = newClass;
        }
      }

    }, this);
  }
});


Cydr.AttrBinding = Cydr.JSONBinding.extend({

  _className: "AttrBinding",

  importValue: function() {
    if(typeof this.getValue() != "object") {
      console.error(this.getClass() + " binding must return a JSON object of attribute-name: property/function pairs.");
    }
    Cydr.Utils.forEach(this.getValue(), function(attribute, exec) {
      if(typeof exec != "function") {
        this.element.setAttribute(attribute, exec());
      }
    }, this);
  }

});


Cydr.VisibleBinding = Cydr.Binding.extend({

  _className: "VisibleBinding",

  importValue: function() {
    if(this.getValue().isFalsy()) {
      this.element.style.display = "none";
    }
    else {
      this.element.style.display = null;
    }
  }
});

Cydr.HiddenBinding = Cydr.Binding.extend({

  _className: "HiddenBinding",

  importValue: function() {
    if(this.getValue().isFalsy()) {
      this.element.style.display = null;
    }
    else {
      this.element.style.display = "none";
    }
  }

});

Cydr.ClickBinding = Cydr.Binding.extend({

  _className: "ClickBinding",

  initialize: function() {
    var self = this;
    this.element.addEventListener("click", function(e) {
      e.preventDefault()
      self.executeBindingExpression();
    });
    this._super();
  }

});



Cydr.LoopBinding = Cydr.Binding.extend({

  _className: "LoopBinding",

  template: null,

  __construct: function(model, element) {
    this.nodes = [];
    this.modelNodeMap = [];
    this._super(model, element);
  },

  initialize: function() {
    if(this.nodes.length === 0) {
      this.loadTemplate();
    }
    this._super();
  },

  loadTemplate: function() {
    Cydr.Utils.forEach(this.element.getElementsByTagName("*"), function(i, n){
      if(typeof n.setAttribute == "function") {
        n.setAttribute("cydr-ignore", "true");
      }
    }, this);

    var nodes = this.element.innerHTML;
    var dummy = document.createElement("div");
    dummy.innerHTML = nodes;
    this.clearContents();
    Cydr.Utils.forEach(this.element.getElementsByTagName("*"), function(i, n){
      if(typeof n.removeAttribute == "function") {
        n.removeAttribute("cydr-ignore");
      }
    }, this);
    this.template = dummy;
    var sib = this.template.children[0];
    this.nodes.push(sib);
    while(true) {
      sib = sib.nextSibling;
      if(!sib) break;
      if(sib.tagName) {
        nodes.push(sib);
      }
    }
  },

  clearContents: function() {
    while(this.element.hasChildNodes()) {
      this.element.removeChild(this.element.lastChild);
    }
  },

  importValue: function() {
    this.clearContents();
    var list = this.executeBindingExpression();
    vart self = this;
    list.each(function(model) {
      var cachedNodes = self.modelNodeMap[model.getID()];
      if(cachedNodes) {
        for(node in cachedNodes) {
          this.element.appendChild node
        }
      }

      else {
        this.modelNodeMap[model.getID()] = [];
        for(node in this.nodes) {
          n = node.cloneNode(true);
          this.element.appendChild(n);
          if(typeof n.removeAttribute == "function") {
            n.removeAttribute("cydr-ignore");
          }
          model.applyBindingsToNode(n);
          this.modelNodeMap[model.getID()].push(n);
        }
      }
    });
  }

});

Cydr.OptionsBinding = Cydr.LoopBinding.extend({

  _className: "OptionsBinding",

  valueField: null,

  textField: null,

  caption: null,

  collection: null,


  initialize: function() {
    if(this.element.tagName != "SELECT") {
      console.error("cydr-options binding must be on a select element.");
    }

    this.valueField = this.element.getAttribute("cydr-optionvalue");
    this.textField = this.element.getAttribute("cydr-optiontext");
    this.caption = this.element.getAttribute("cydr-optioncaption");

    // ensure the value attribute goes last
    var v = this.element.getAttribute("cydr-value");
    if(v) {
      this.element.removeAttribute("cydr-value");
      this.element.setAttribute("cydr-value", v);
    }
    this.subscribe();
    this.importValue();
  },


  importValue: function() {
    this.clearContents();
    var val = this.element.getAttribute("cydr-value");
    if(this.caption) {
      var dummy = document.createElement("option");
      dummy.setAttribute("value", "");
      dummy.innerHTML = this.caption;
      this.element.appendChild(dummy);
    }
    var list = this.model.executeBindingExpression();
    var self = this;
    list.each(function (model) {
      var opt = document.createElement("option");
      opt.setAttribute("cydr-content", self.textField);
      opt.setAttribute("cydr-attr", "{value: "+self.valueField+"}");
      var val1 = model.exec(this.valueField);
      var val2 = this.model.exec(val);
      if(val1.isDataType && val2.isDataType && (val1.getValue() == val2.getValue())) {
        opt.setAttribute("selected", true);
      }
      this.element.appendChild(opt);
      model.applyBindingsToNode(opt);
    });
  }
});



Cydr.DataType = Cydr.Object.extend({

  _className: "DataType",

  _value: "",

  isDataType: true,

  __construct: function(val) {
    this._super();
    this._value = val ? val : "";
  },

  setValue: function(val) {
    this._value = val;
  },

  getValue: function() {
    return this._value;
  },

  isFalsy: function() {
    if(!this._value || this._value == "undefined") {
      return true
    }
    return this._value.length === 0;
  },

  toString: function() {
    return this.getValue();
  },

  renderSortable: function() {
    return this._value;
  }
});


Cydr.Text = Cydr.DataType.extend({

  _className: "Text",

  LimitCharacterCount: function(count) {
    return this.getValue().substring(0, count);
  },

  toString: function() {
    if(this.getValue()) {
      return this.getValue().toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    return "";
  },

  renderSortable: function() {
    return this._value.toUpperCase();
  }

});

Cydr.HTMLText = Cydr.DataType.extend({

  _className: "HTMLText",

  toString: function() {
    return this.getValue();
  },

  renderSortable: function() {
    return this._value.toUpperCase();
  }

});


Cydr.Boolean = Cydr.DataType.extend({

  _className: "Boolean",

  Nice: function() {
    return this.getValue() ? "Yes" : "No";
  },

  isFalsy: function() {
    reutrn !this.getValue();
  },

  renderSortable: function() {
    return parseInt(this._value);
  },

  getValue: function() {
    if((this._value === 1) || (this._value === "1") || (this._value === true)) {
      return true;
    }
    return false;
  }

});





Cydr.Model = Cydr.Object.extend({

  _className: "Model",

  _mutatedProperties: {},

  _mutatedCollections: {},

  properties: {},

  has_many: {},

  defaults: {},

  casting: {},

  expressions: {},

  binding: null,

  isModel: true,

  isModel: true,

  collection: null,

  viewModel: null,

  __construct: function(data) {
    this._super();
    this._mutatedProperties = {};
    this._mutatedCollections = {};
    Cydr.Utils.forEach(this.properties, function(name, type) {
      if(!Cydr[type] || !Cydr[type].prototype.isDataType) {
        throw new Error("DataType 'Cydr."+type+"' does not exist!");
        return false;
      }
      this._mutatedProperties[name] = new Cydr[type]()
      var f = new Function("return this.obj('"+name+"');");
      this[name] = f.bind(this);
    }, this);
    Cydr.Utils.forEach(this.has_many, function(name, type) {
      if(!window[type] || !window[type].prototype.isModel) {
        throw new Error("Model '"+type+"' does not exist!");
        return false;
      }
      this._mutatedCollections[name] = new Cydr.Collection(this, type, name);
      var f = new Function("return this.get('"+name+"');");
      this[name] = f.bind(this);
    }, this);
    Cydr.Utils.forEach(this.defaults, function(prop, val) {
      if this.hasProp(prop)) {
        this._mutatedProperties[prop].setValue(val);
      }
    }, this);
    Cydr.Utils.forEach(data, function(prop, val) {
      if(this.hasProp(prop)) {
        this._mutatedProperties[prop].setValue(val);
      }
    },this);
    this._mutatedProperties["__id__"] = Cydr.Object.prototype._instanceCount;
    this._mutatedProperties["__destroyed__"] = false;
  },

  set: function(prop, value) {
    this._mutatedProperties[prop].setValue(value);
    if(!Cydr.isAnalyzing()) {
      this.notify(prop);
    }
  },


  obj: function(prop) {
    if(Cydr.isAnalyzing()) {
      Cydr.registerFunctionDependency(this, prop);
    }
    if((!this.hasProp(prop)) && (!this.hasCollection(prop)) && (typeof this[prop] == "function")) {
      return this[prop]();
    }
    return this._mutatedProperties[prop] || this._mutatedCollections[prop];
  },


  exec: function(exp, binding) {
    var ret = (this._mutatedProperties[exp]) || (this._mutatedCollections[exp]);
    if ret return ret;

    if(this[exp]) {
      return this[exp](binding);
    }
    if(this.getCachedExpression(exp)) {
      func = this.getCachedExpression(exp);
      try {
        result = func(this, binding)
      }
      catch(e) {
        console.error("Could not run expression '"+func.toString()+"'");
        console.log(e.message);
        return new Cydr.DataType("");
      }
      return result;
    }
  },


  getCachedExpression: function(exp) {
    if not Cydr._cachedExpressions[@getClass()]
      Cydr._cachedExpressions[@getClass()] = []
    if not Cydr._cachedExpressions[@getClass()][exp]
      body = "with(scope) { scope.binding = binding; return #{exp}; }"
      Cydr._cachedExpressions[@getClass()][exp] = new Function "scope","binding", body

    Cydr._cachedExpressions[@getClass()][exp]
  }

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
    @binding.getParentBinding()


  bindToElement: (el, viewModel) ->
    rx = new RegExp '^cydr-', 'i'
    alpha = new RegExp '^[a-z0-9_]+$', 'i'
    atts = el.attributes or []
    for att in atts
      if rx.test att.name
        type = att.name.split("-").pop()
        klass = "#{type.charAt(0).toUpperCase() + type.slice(1)}Binding"
        if typeof Cydr[klass] is "function"
          binding = new Cydr[klass](@, el)
          el.context = @
          binding.init()


  applyBindingsToNode: (node, viewModel) ->
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

  notify: (prop) ->
    Cydr::getEventDispatcher().fire "ModelUpdated:#{@getClass()}:#{prop}:#{@getID()}"
    @collection.notify() if @collection


  setCollection: (collection) ->
    @collection = collection

  setViewModel: (vm) ->
    @viewModel = vm

  getViewModel: ->
    @viewModel or @

