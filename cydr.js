/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
(function () {
  var initializing = false;
  var classCounter = 0;

  fnTest = /xyz/.test(function () {
    var xyx;
  }) ? /\b_super\b/ : /.*/;


  this.Class = function () {};

  this.Class.extend = function (prop) {
    var _super = this.prototype;
    var prototype;

    initializing = true;
    prototype = new this();
    initializing = false;

    for (var name in prop) {
      prototype[name] = (typeof prop[name] == "function" && typeof _super[name] == "function" && fnTest.test(prop[name])) ? (function (name, fn) {
        return function () {
          var tmp = this._super;
          this._super = _super[name];
          var ret = fn.apply(this, arguments);
          this._super = tmp;

          return ret;
        };
      })(name, prop[name]) : prop[name];
    }

    function Class() {
      if (!initializing && this.__construct)
        this.__construct.apply(this, arguments);
    }

    Class.prototype = prototype;
    Class.prototype._classIdentifier = "Class_" + classCounter;
    classCounter++;

    Class.prototype.constructor = Class;

    Class.extend = arguments.callee;

    return Class;
  };
})();

var Cydr = {};

Cydr.Config = {};

Cydr.Utils = {

  inArray: function (needle, heystack) {
    for (i in heystack) {
      if (heystack[i] == needle) {
        return true;
      }
    }

    return false;
  },

  forEach: function (arr, cb, context) {
    for (i in arr) {
      var result = cb.apply(context ? context : window, [i, arr[i]]);
      if (result === false) break;
    }
  }
};


Cydr.EventDispatcher = {

  events: [],

  fire: function (sku) {
    var parts = sku.split(":");
    var type = parts[0];
    var model = parts[1];
    var prop = parts[2];
    var id = parts[3];
    var evt = [];
    for(i in parts) {
      var part = parts[i];
      evt.push(part);
      e = evt.join(":");
      var subscribers = (Cydr.EventDispatcher.events[e]) || [];
      Cydr.Utils.forEach(subscribers, function(listenerID, func) {
        func(e, type, model, prop, id);
      });
    }
  },



  subscribe: function (sku, listener, func) {
    if(!Cydr.EventDispatcher.events[sku]) {
      Cydr.EventDispatcher.events[sku] = []
    }
    Cydr.EventDispatcher.events[sku]["listener_"+listener.__ID__] = func.bind(listener);
  },

  revoke: function (sku, listener) {
    delete Cydr.EventDispatcher.events[sku]["listener_"+listener.__ID__];
    if(Cydr.EventDispatcher.events[sku].length === 0) {
      delete Cydr.EventDispatcher.events[sku];
    }
  }

};


Cydr.Object = Class.extend({

  _instanceCount: 0,

  __ID__: null,

  _className: "Object",

  __construct: function() {
    Cydr.Object.prototype._instanceCount++;
    this.__ID__ = Cydr.Object.prototype._instanceCount;
  },

  getClass: function() {
    return this._className;
  },


  getID: function() {
    return this.__ID__;
  },

  getConfig: function (prop, key) {
    if(!Cydr.Config[this.getClass()]) {
      Cydr.Config[this.getClass()] = []
    }
    if(key) {
      if(!Cydr.Config[this.getClass()][prop]) {
        Cydr.Config[this.getClass()][prop] = []
      }
      return Cydr.Config[this.getClass()][prop][key];
    }

    return Cydr.Config[this.getClass()][prop];
  },


  setConfig: function (prop, val) {
    if(!Cydr.Config[this.getClass()]) {
      Cydr.Config[this.getClass()] = []
    }
    Cydr.Config[this.getClass()][prop] = val;
  },

  pushConfig: function (prop, val1, val2) {
    if(!Cydr.Config[this.getClass()]) {
      Cydr.Config[this.getClass()] = [];
    }
    if(!Cydr.Config[this.getClass()][prop]) {
      Cydr.Config[this.getClass()][prop] = [];
    }
    if(val2) {
      if(!Cydr.Config[this.getClass()][prop][val1]) {
        Cydr.Config[this.getClass()][prop][val1] = [];
      }
      Cydr.Config[this.getClass()][prop][val1].push(val2);
    }

    else {
      Cydr.Config[this.getClass()][prop].push(val1);
    }
  }

});

Cydr.Binding = Cydr.Object.extend({

  _className: "Binding",

  isDataBinding: true,

  bindingAttribute: "",

  bindingExec: null,

  element: null,

  model: null,

  exportValueEvent: null,

  importFunction: null,

  allowedTags: [],

  parent: null,

  __construct: function (model, element, parent) {
    this._super();
    this.element = element;
    this.model = model;
    this.attValue = this.element.getAttribute(this.getBindingAttribute());
    this.bindingExec = this.attValue;
    this.parent = parent;
  },


  initialize: function () {
    if (this.allowedTags.length && !Cydr.Utils.inArray(this.element.tagName, this.allowedTags)) {
      console.error(this.getBindingAttribute() + "binding must be on one of the following tags: " + this.allowedTags.join(',') + ".");
    }
    if (this.exportValueEvent) {
      var self = this;
      this.element.addEventListener(this.exportValueEvent, function () {
        self.exportValue();
      });
    }
    this.element.setAttribute("title", "ID: " + this.model.getID());
    this.subscribe();
    this.importValue();
  },

  importValue: function () {},

  exportValue: function () {},

  subscribe: function () {
    if (this.model.hasProp(this.bindingExec) || this.model.hasCollection(this.bindingExec)) {
      var evt = "ModelUpdated:" + this.model.getClass() + ":" + this.bindingExec + ":" + this.model.getID();
      var t = (this.element.getAttribute("title")) || "";
      this.element.setAttribute("title", t + "//" + evt);
      Cydr.EventDispatcher.subscribe(evt, this, function () {
        this.importValue();
      });
    } else if (!this.model.isAnalysedExpression(this.bindingExec)) {
      var b = this.bindingExec;
      this.model.subscribeToEvent("ModelAccessed", function (evt, type, model, prop, id) {
        this.pushConfig("analysedExpressions", b, model+":"+prop+":"+id);
      });
      Cydr.Model.prototype.frozen = true;
      this.executeBindingExpression();
      Cydr.Model.prototype.frozen = false;
      this.model.revokeSubscription("ModelAccessed");
    }

    var result = this.model.getDependenciesForExpression(this.bindingExec);
    if (result) {
      Cydr.Utils.forEach(result, function (key, val) {
        var parts = val.split(":");
        var evt = "ModelUpdated:" + parts[0] + ":" + parts[1] + ":" + parts[2];
        var t = (this.element.getAttribute("title")) || "";
        this.element.setAttribute("title", t + "//" + evt);
        Cydr.EventDispatcher.subscribe(evt, this, function () {
          this.importValue();
        });
      }, this);
    }
  },

  getBindingAttribute: function () {
    var klass = this.getClass().replace(/Binding$/, '');
    return "cydr-" + klass.toLowerCase();
  },


  create: function (model, element) {
    return new Cydr[this.getClass()](model, element);
  },


  executeBindingExpression: function () {
    return this.model.exec(this.bindingExec, this);
  },


  getValue: function () {
    return this.executeBindingExpression();
  },


});


Cydr.ContentBinding = Cydr.Binding.extend({

  _className: "ContentBinding",

  importValue: function () {
    this.element.innerHTML = this.getValue();
  }

});


Cydr.SubmitBinding = Cydr.Binding.extend({

  _className: "SubmitBinding",

  allowedTags: ["FORM"],

  initialize: function () {
    var self = this;
    this.element.addEventListener("submit", function (e) {
      e.preventDefault();
      var formData = window.form2object(this.element);
      var func = this.bindingExec;
      if (typeof this.model[func] == "function") {
        this.model[func](formData);
      }
    })
    this._super();
  }
});


Cydr.ValueBinding = Cydr.Binding.extend({

  _className: "ValueBinding",

  allowedTags: ["INPUT", "SELECT"],

  exportValueEvent: "change",

  importValue: function () {
    if (this.element.tagName == "INPUT") {
      this.element.value = this.getValue();
    } else if (this.element.tagName == "SELECT") {
      Cydr.Utils.forEach(this.element.options, function (key, opt) {
        if (opt.value == this.getValue().toString()) {
          opt.selected = true;
          return false;
        }
      }, this);
    }
  },

  exportValue: function () {
    if (this.element.tagName == "INPUT") {
      this.model.set(this.bindingExec, this.element.value);
    } else if (this.element.tagName == "SELECT") {
      var val = this.element.options[this.element.selectedIndex] ? this.element.options[this.element.selectedIndex].getAttribute("value") : "";
      this.model.set(this.bindingExec, val);
    }
  }

});

Cydr.CheckedBinding = Cydr.Binding.extend({

  _className: "CheckedBinding",

  allowedTags: ["INPUT"],

  exportValueEvent: "change",

  importValue: function () {
    var v = this.getValue();
    if ((v && v.isDataType) && (!v.isFalsy())) {
      this.element.setAttribute("checked", "checked");
    } else {
      this.element.removeAttribute("checked");
    }
  },

  exportValue: function () {
    this.model.set(this.bindingExec, this.element.checked);
  }

});


Cydr.JSONBinding = Cydr.Binding.extend({

  _className: "JSONBinding",

  subscribe: function() {
    if(!this.model.isAnalysedExpression(this.bindingExec)) {
      var b = this.bindingExec;
      this.model.subscribeToEvent("ModelAccessed", function (evt, type, model, prop, id) {
        this.pushConfig("analysedExpressions", b, model+":"+prop+":"+id);
      });
      Cydr.Model.prototype.frozen = true;
      var obj = this.executeBindingExpression();
      if(typeof obj !== "object") {
        console.error(this.getClass() + " binding must return a JSON object of classname: property/function pairs.");
        return;
      }
      Cydr.Utils.forEach(obj, function(className, prop) {
        if(typeof prop == "function") {
          prop();
        }
        else {
          this.model.exec(prop);
        }
      }, this);
      Cydr.Model.prototype.frozen = false;
      this.model.revokeSubscription("ModelAccessed");
    }
    var result = this.model.getDependenciesForExpression(this.bindingExec);
    if(result) {
      for(i in result) {
        var dependency = result[i];
        var parts = dependency.split(":");
        Cydr.EventDispatcher.subscribe("ModelUpdated:"+this.model.getClass()+":"+parts[1]+":"+this.model.getID(), this, function() {
          this.importValue();
        });
      }
    }
  }
});

Cydr.ExtraclassesBinding = Cydr.JSONBinding.extend({

  _className: "ExtraclassesBinding",

  importValue: function () {
    Cydr.Utils.forEach(this.executeBindingExpression(), function (cssClass, exec) {
      var rx = new RegExp("(^|\\s)" + cssClass, "g");
      var newClass = this.element.className.replace(rx, "");
      if (typeof exec == "function") {
        var result = exec();
        if (!result || !result.isDataType) return;
        if (!result.isFalsy()) {
          this.element.className += this.element.className.length ? " " + cssClass : cssClass;
        } else {
          this.element.className = newClass;
        }
      }

    }, this);
  }
});


Cydr.AttrBinding = Cydr.JSONBinding.extend({

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


Cydr.VisibleBinding = Cydr.Binding.extend({

  _className: "VisibleBinding",

  importValue: function () {
    if (this.getValue().isFalsy()) {
      this.element.style.display = "none";
    } else {
      this.element.style.display = null;
    }
  }
});

Cydr.HiddenBinding = Cydr.Binding.extend({

  _className: "HiddenBinding",

  importValue: function () {
    if (this.getValue().isFalsy()) {
      this.element.style.display = null;
    } else {
      this.element.style.display = "none";
    }
  }

});

Cydr.ClickBinding = Cydr.Binding.extend({

  _className: "ClickBinding",

  initialize: function () {
    var self = this;
    this.element.addEventListener("click", function (e) {
      e.preventDefault()
      self.executeBindingExpression();
    });
    this._super();
  }

});



Cydr.LoopBinding = Cydr.Binding.extend({

  _className: "LoopBinding",

  template: null,

  modelNodeMap: [],

  nodes: [],


  __construct: function(model, element, parent) {
    this.modelNodeMap[this.getID()] = [];
    this.nodes[this.getID()] = [];
    this._super(model, element, parent);
  },


  initialize: function () {
    if(!this.getNodes() || this.getNodes().length === 0) {
      this.loadTemplate();
    }
    this._super();
  },


  getNodes: function() {
    return this.nodes[this.getID()];
  },


  addNode: function(node) {
    if(!this.nodes[this.getID()]) {
      this.nodes[this.getID()] = [];
    }
    this.nodes[this.getID()].push(node);
  },

  getCachedNodes: function(modelID) {
    if(!this.modelNodeMap[this.getID()]) {
      this.modelNodeMap[this.getID()] = [];
    }

    return this.modelNodeMap[this.getID()][modelID];
  },


  addCachedNode: function(modelID, node) {
    if(!this.modelNodeMap[this.getID()]) {
      this.modelNodeMap[this.getID()] = [];
    }
    if(!this.modelNodeMap[this.getID()][modelID]) {
      this.modelNodeMap[this.getID()][modelID] = [];
    }
    this.modelNodeMap[this.getID()][modelID].push(node);
  },

  loadTemplate: function () {
    var n, i, nodes, dummy;

    nodeList = this.element.getElementsByTagName("*");
    for(i in nodeList) {
      n = nodeList[i];
      if (typeof n.setAttribute == "function") {
        n.setAttribute("cydr-ignore", "true");
      }
    }

    nodes = this.element.innerHTML;
    dummy = document.createElement("div");
    dummy.innerHTML = nodes;
    this.clearContents();
    nodeList = dummy.getElementsByTagName("*");
    for(i in nodeList) {
      n = nodeList[i];
      if (typeof n.removeAttribute == "function") {
        n.removeAttribute("cydr-ignore");
      }
    }
    this.template = dummy;
    var sib = this.template.children[0];
    this.addNode(sib);
    while (true) {
      sib = sib.nextSibling;
      if (!sib) break;
      if (sib.tagName) {
        this.addNode(sib);
      }
    }
  },

  clearContents: function () {
    while (this.element.hasChildNodes()) {
      this.element.removeChild(this.element.lastChild);
    }
  },

  importValue: function () {
    this.clearContents();
    var list = this.executeBindingExpression();
    var self = this;
    list.each(function (model) {
      var cachedNodes = self.getCachedNodes(model.getID());
      if (cachedNodes) {
        for (i in cachedNodes) {
          var node = cachedNodes[i];
          self.element.appendChild(node);
          if(self.element.id == "todoloop") {
          }
        }
      } else {
        var nl = self.getNodes();
        for (i in nl) {
          var node = nl[i];
          var n = node.cloneNode(true);
          self.element.appendChild(n);
          if (typeof n.removeAttribute == "function") {
            n.removeAttribute("cydr-ignore");
          }
          model.applyBindingsToNode(n, self);
          self.addCachedNode(model.getID(), n);
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


  initialize: function () {
    if (this.element.tagName != "SELECT") {
      console.error("cydr-options binding must be on a select element.");
    }

    this.valueField = this.element.getAttribute("cydr-optionvalue");
    this.textField = this.element.getAttribute("cydr-optiontext");
    this.caption = this.element.getAttribute("cydr-optioncaption");

    // ensure the value attribute goes last
    var v = this.element.getAttribute("cydr-value");
    if (v) {
      this.element.removeAttribute("cydr-value");
      this.element.setAttribute("cydr-value", v);
    }
    this.subscribe();
    this.importValue();
  },


  importValue: function () {
    this.clearContents();
    var val = this.element.getAttribute("cydr-value");
    if(!val) {
      console.error("cydr-options binding assigned to an element with no cydr-value binding", this.element);
    }
    if (this.caption) {
      var dummy = document.createElement("option");
      dummy.setAttribute("value", "");
      dummy.innerHTML = this.caption;
      this.element.appendChild(dummy);
    }
    var list = this.executeBindingExpression();
    var self = this;
    list.each(function (model) {
      var opt = document.createElement("option");
      opt.setAttribute("cydr-content", self.textField);
      opt.setAttribute("cydr-attr", "{value: " + self.valueField + "}");
      var val1 = model.exec(self.valueField);
      var val2 = self.model.exec(val);

      if (val1.isDataType && val2.isDataType && (val1.getValue() == val2.getValue())) {
        opt.setAttribute("selected", true);
      }
      self.element.appendChild(opt);
      model.applyBindingsToNode(opt, self);
    });
  }
});



Cydr.DataType = Cydr.Object.extend({

  _className: "DataType",

  _value: "",

  isDataType: true,

  __construct: function (val) {
    this._super();
    this._value = val ? val : "";
  },

  setValue: function (val) {
    this._value = val;
  },

  getValue: function () {
    return this._value;
  },

  isFalsy: function () {
    if (!this._value || this._value == "undefined") {
      return true
    }
    return this._value.length === 0;
  },

  toString: function () {
    return this.getValue();
  },

  renderSortable: function () {
    return this._value;
  }
});


Cydr.Text = Cydr.DataType.extend({

  _className: "Text",

  LimitCharacterCount: function (count) {
    return this.getValue().substring(0, count);
  },

  toString: function () {
    if (this.getValue()) {
      return this.getValue().toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    return "";
  },

  renderSortable: function () {
    return this._value.toUpperCase();
  }

});

Cydr.HTMLText = Cydr.DataType.extend({

  _className: "HTMLText",

  toString: function () {
    return this.getValue();
  },

  renderSortable: function () {
    return this._value.toUpperCase();
  }

});


Cydr.Boolean = Cydr.DataType.extend({

  _className: "Boolean",

  Nice: function () {
    return this.getValue() ? "Yes" : "No";
  },

  isFalsy: function () {
    return !this.getValue();
  },

  renderSortable: function () {
    return parseInt(this._value);
  },

  getValue: function () {
    if ((this._value === 1) || (this._value === "1") || (this._value === true)) {
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

    currentBinding: null,

    isModel: true,

    collection: null,

    viewModel: null,

    frozen: false,

    __construct: function (data) {

      this._super();
      this._mutatedProperties = {};
      this._mutatedCollections = {};

      Cydr.Utils.forEach(this.properties, function (name, type) {
        if (!Cydr[type] || !Cydr[type].prototype.isDataType) {
          throw new Error("DataType 'Cydr." + type + "' does not exist!");
          return false;
        }
        this._mutatedProperties[name] = new Cydr[type]()
        var f = new Function("return this.obj('" + name + "');");
        this[name] = f.bind(this);
      }, this);

      Cydr.Utils.forEach(this.has_many, function (name, type) {
        if (!window[type] || !window[type].prototype.isModel) {
          throw new Error("Model '" + type + "' does not exist!");
          return false;
        }
        this._mutatedCollections[name] = new Cydr.Collection(this, type, name);
        var f = new Function("return this.get('" + name + "');");
        this[name] = f.bind(this);
      }, this);

      Cydr.Utils.forEach(this.defaults, function (prop, val) {
        if(this.hasProp(prop)) {
          this._mutatedProperties[prop].setValue(val);
        }
      }, this);

      Cydr.Utils.forEach(data, function (prop, val) {
        if (this.hasProp(prop)) {
          this._mutatedProperties[prop].setValue(val);
        }
      }, this);

      this._mutatedProperties["__id__"] = Cydr.Object.prototype._instanceCount;
      this._mutatedProperties["__destroyed__"] = false;
  },


  getClass: function () {
    return this._className == "Model" ? this._classIdentifier : this._className;
  },

  set: function (prop, value) {
    if(Cydr.Model.prototype.frozen) {return;}

    this._mutatedProperties[prop].setValue(value);
    this.notify(prop);
  },


  obj: function (prop) {
    Cydr.EventDispatcher.fire("ModelAccessed:"+this.getClass()+":"+prop+":"+this.getID());
    if ( (!this.hasProp(prop)) && (!this.hasCollection(prop)) && (typeof this[prop] == "function")) {
      return this[prop]();
    }

    return this._mutatedProperties[prop] || this._mutatedCollections[prop];
  },


  exec: function (exp, binding) {
    var ret = (this._mutatedProperties[exp]) || (this._mutatedCollections[exp]);
    if(ret) return ret;

    if (this[exp]) {
      return this[exp]();
    }

    if (this.getCachedExpression(exp)) {
      func = this.getCachedExpression(exp);
      try {
        this.currentBinding = binding;
        var result = func(this, binding);
        this.currentBinding = null;
      } catch (e) {
        console.error("Could not run expression '" + func.toString() + "'");
        console.log(e.message);
        return new Cydr.DataType("");
      }
      return result;
    }
  },


  getCachedExpression: function (exp) {
    if(!this.getConfig("cachedExpressions", exp)) {
      var body = "with(scope) { return "+exp+";  }";
      var f = new Function("scope", "binding", body);
      this.pushConfig("cachedExpressions", exp, f);
    }
    var ret = this.getConfig("cachedExpressions", exp);

    return ret[0];
  },


  isAnalysedExpression: function(exp) {
    return (this.getConfig("analysedExpressions", exp)) ? true : false;
  },

  getDependenciesForExpression: function (exp) {
    return this.getConfig("analysedExpressions", exp);
  },

  get: function (prop) {
    if(this._mutatedProperties[prop]) {
      Cydr.EventDispatcher.fire("ModelAccessed:"+this.getClass()+":"+prop+":"+this.getID());
      return this._mutatedProperties[prop].getValue();
    }
    else if(this._mutatedCollections[prop]) {
      Cydr.EventDispatcher.fire("ModelAccessed:"+this.getClass()+":"+prop+":"+this.getID());
      return this._mutatedCollections[prop];
    }
  },

  castFunction: function (func) {
    if(!ret.isDataType && !ret.isDataList) {
      var dataType = this.casting[func] || "Text";
      if(typeof Cydr[dataType] != "function") {
        console.error("Tried to cast "+func+" as "+dataType+", but that datatype doesn't exist.");
        return;
      }
      return new Cydr[dataType](ret);
    }

    return ret;
  },


  hasProp: function (prop) {
    return this.properties.hasOwnProperty(prop);
  },


  hasCollection: function (collection) {
    return this.has_many.hasOwnProperty(collection);
  },


  getID: function () {
    return this._mutatedProperties["__id__"];
  },

  Up: function () {
    if(this.currentBinding && this.currentBinding.parent) {
      return this.currentBinding.parent.model;
    }
  },


  bindToElement: function (el, parentBinding) {
    var rx = new RegExp('^cydr-', 'i');
    var alpha = new RegExp('^[a-z0-9_]+$', 'i');
    var atts = el.attributes || []
    Cydr.Utils.forEach(atts, function (i, att) {
      if (rx.test(att.name)) {
        var type = att.name.split("-").pop();
        var klass = type.charAt(0).toUpperCase() + type.slice(1) + "Binding";
        if (typeof Cydr[klass] == "function" && Cydr[klass].prototype.isDataBinding) {
          var binding = new Cydr[klass](this, el, parentBinding);
          binding.initialize();
        }
      }
    }, this);
  },


  applyBindingsToNode: function (node, parentBinding) {
    var stack = [node];
    var nl = node.getElementsByTagName("*") || [];
    var els = [];

    for (n in nl) {
      els.push(nl[n]);
    }

    els.unshift(node);
    var rx = new RegExp('^cydr-', 'i');
    Cydr.Utils.forEach(els, function (i, el) {
      var atts = (el && el.attributes) ? el.attributes : [];
      if (el && typeof el.getAttribute == "function" && !el.getAttribute("cydr-ignore")) {
        for (att in atts) {
          if (rx.test(atts[att].name)) {
            this.bindToElement(el, parentBinding);
            break;
          }
        }
      }
    }, this);
  },

  notify: function (prop) {
    Cydr.EventDispatcher.fire("ModelUpdated:" + this.getClass() + ":" + prop + ":" + this.getID());
    if (this.collection) {
      this.collection.notify();
    }
  },


  setCollection: function (collection) {
    this.collection = collection;
  },

  getCollection: function() {
    return this.collection;
  },

  getViewModel: function() {
    if(this.viewModel) return this.viewModel;

    var m = this;
    while(true) {
      if(!m.getCollection()) break;
      m = m.getCollection().getOwner();
    }
    this.viewModel = m;

    return this.viewModel;
  },

  subscribeToEvent: function(evt, func) {
    Cydr.EventDispatcher.subscribe(evt, this, func);
  },

  revokeSubscription: function(evt) {
    Cydr.EventDispatcher.revoke(evt, this);
  }
});


Cydr.Collection = Cydr.Object.extend({

  _className: "Collection",

  owner: null,

  model: null,

  name: null,

  __construct: function (owner, model, name) {
    this.owner = owner;
    this.model = model;
    this.name = name;
    this._super();
    this._records = [];
  },

  count: function () {
    return this._records.length;
  },

  get: function () {
    var list = new Cydr.DataList(this._records);
    list.setCollection(this);
    return list;
  },

  each: function (callback) {
    return this.get().each(callback);
  },

  notify: function () {
    return this.owner.notify(this.name);
  },

  push: function (model) {
    if(Cydr.Model.prototype.frozen) return;

    this._records.push(model);
    this.owner.notify(this.name);
  },


  pushMany: function (items) {
    if(Cydr.Model.prototype.frozen) return;


    if (!items) items = [];
    for(i in items) {
      this._records.push(items[i]);
    }
    this.owner.notify(this.name);
  },


  getOwner: function() {
    return this.owner;
  }

});


Cydr.DataList = Cydr.Object.extend({

  _className: "DataList",

  isDataList: true,

  sortField: null,

  sortDir: "ASC",

  limitNumber: null,

  collection: null,

  __construct: function (items) {
    if (!items) items = [];
    this._super();
    this._items = items;
    this.filters = [];
    this.resultSet = [];
  },


  setCollection: function (collection) {
    this.collection = collection;
  },


  getItems: function () {
    return this._items;
  },


  filter: function (filter, value) {
    this.filters.push({
      filter: filter,
      value: value
    });

    return this;
  },

  sort: function (field, dir) {
    this.sortField = field;
    this.sortDir = dir;

    return this;
  },


  limit: function (limit) {
    this.limitNumber = parseInt(limit);
    return this;
  },


  execute: function () {
    if (this.filters.length) {
      Cydr.Utils.forEach(this.filters, function (i, filterData) {
        var parts = filterData.filter.split(":");
        var field = parts[0];
        var operator = parts[1];
        if (!operator) operator = "EqualTo";
        switch (operator) {
        case "EqualTo":
          Cydr.Utils.forEach(this._items, function (index, i) {
            if (i.get(field) == filterData.value) {
              this.resultSet.push(i);
            }
          }, this);
          break;
        }
      }, this);
    } else {
      this.resultSet = this._items
    }
    if (this.sortField) {
      var self = this;
      this.resultSet = this.resultSet.sort(function (a, b) {
        var reverse = self.sortDir == "ASC" ? true : false;
        var A = a.obj(self.sortField).renderSortable();
        var B = b.obj(self.sortField).renderSortable();
        var ret;
        if (A < B) {
          ret = -1;
        } else if (A > B) {
          ret = 1;
        } else {
          ret = 0;
        }
        return ret * [-1, 1][+ !! reverse];
      });
    }

    if (this.limitNumber) {
      this.resultSet = this.resultSet.slice(0, this.limitNumber);
    }

    Cydr.Utils.forEach(this.resultSet, function (i, model) {
      model.setCollection(this.collection);
    }, this);

    return this.resultSet;

  },

  isFalsy: function () {
    return this._items.length === 0;
  },


  count: function () {
    return this.execute().length;
  },

  each: function (callback) {
    var results = this.execute();
    for (item in results) callback(results[item]);
  },

  reset: function () {
    this.filters = []
    this.sortField = null;
    this.sortDir = "ASC";
    this.limit = null;
    this.executed = false;
    this.resultSet = [];
  }
});



Cydr.ViewModel = Cydr.Model.extend({

  _className: "ViewModel",

  __construct: function (selector) {
    this._super();
    node = document.querySelector(selector);
    if (node) {
      this.applyBindingsToNode(node);
    }
  }
});