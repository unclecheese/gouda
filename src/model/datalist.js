define(['core','object'], function(Cydr, CydrObject) {

  DataList = CydrObject.extend({

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

  return DataList;
});