define(['./binding', '../core/core'], function (Binding, Core) {

    var DisplayBinding = Binding.extend({

        _elementDisplay: [],

        show: function (element) {
            var old, computed, tag, temp, shouldDisplay;

            element.style.display = "";
            old = element.getAttribute("data-olddisplay");
            if(old && old !== "none") {
                return element.style.display = old;
            }

            tag = element.nodeName;
            computed = Core.getStyle(element, "display");
            if(computed === "none") {
                shouldDisplay = this._elementDisplay[tag];
                if(!shouldDisplay) {
                    temp = document.createElement(tag);
                    document.getElementsByTagName('body')[0].appendChild(temp);
                    shouldDisplay = Core.getStyle(temp, "display");
                    document.getElementsByTagName('body')[0].removeChild(temp);
                    this._elementDisplay[tag] = shouldDisplay;
                }
                element.style.display = shouldDisplay;
            }
            else {
                element.style.display = computed;
            }
        },

        hide: function (element) {
            element.setAttribute("data-olddisplay", element.style.display);
            element.style.display = "none";
        }

    });

    return DisplayBinding;
})