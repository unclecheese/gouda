define(['object', 'model/datalist', 'model/model'], function(CydrObject, DataList, Model) {

  Collection = CydrObject.extend({

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
      var list = new DataList(this._records);
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
      if(Model.prototype.frozen) return;

      this._records.push(model);
      this.owner.notify(this.name);
    },


    pushMany: function (items) {
      if(Model.prototype.frozen) return;


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

  return Collection;
});