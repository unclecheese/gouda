



    var Gouda = {};

    Gouda.Collection             = require('src/model/collection');
    Gouda.Model                  = require('src/model/model');
    Gouda.DataList               = require('src/model/datalist');
    Gouda.ViewModel              = require('src/model/viewmodel');
    Gouda.JSONData               = require('src/model/jsondata');

    Gouda.Boolean                = require('src/datatypes/boolean');
    Gouda.HTMLText               = require('src/datatypes/htmltext');
    Gouda.Text                   = require('src/datatypes/text');
    Gouda.Float                  = require('src/datatypes/float');
    Gouda.Int                    = require('src/datatypes/int');

    Gouda.CheckedBinding         = require('src/bindings/checked');
    Gouda.ClickBinding           = require('src/bindings/click');
    Gouda.ContentBinding         = require('src/bindings/content');
    Gouda.HiddenBinding          = require('src/bindings/hidden');
    Gouda.VisibleBinding         = require('src/bindings/visible');
    Gouda.SubmitBinding          = require('src/bindings/submit');
    Gouda.ValueBinding           = require('src/bindings/value');
    Gouda.AttrBinding            = require('src/bindings/json/attr');
    Gouda.ExtraclassesBinding    = require('src/bindings/json/extraclasses');
    Gouda.LoopBinding            = require('src/bindings/loop/loop');
    Gouda.OptionsBinding         = require('src/bindings/loop/options');

    Gouda.Model.Gouda = Gouda;
    Gouda.Model.Collection = Gouda.Collection;
    Gouda.Collection.Model = Gouda.Model;

    return Gouda;


}));