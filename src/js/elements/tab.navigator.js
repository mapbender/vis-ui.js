(function($) {

    /**
     * jQuery tabs with bootstrap styles and auto-generation of tab headers and content panels
     * Internally unreachable
     */
    $.widget("vis-ui-js.tabNavigator", $.ui.tabs, {
        options: {
        },
        _create: function() {
            var widget = this;
            var options = widget.options;
            var el = widget.element;
            if (!this._getList().length) {
                this.element.prepend('<ul/>');
            }
            this._getList().addClass('nav nav-tabs');

            el.addClass('mapbender-element-tab-navigator');

            if(options.hasOwnProperty('children')){
                // internally unreachable path
                $.each(options.children,function(){
                    var $tab = widget._add(this);
                    $tab.data('item', this);
                });
                el.on('tabnavigatoractivate',function(e,ui) {
                    var item = $(ui.newTab).data('item');
                    if(item.hasOwnProperty('active')){
                        item.active(e,ui);
                    }
                });
            }

            return this._super();
        },
        /**
         * Static (no this context)
         * @param {jQuery} $panel
         * @param {String} title
         * @return {jQuery}
         */
        _renderTab: function($panel, title) {
            var $anchor = $('<a>')
                .attr('href', '#' + $panel.attr('id'))
                .text(title)
            ;
            return $('<li>')
                .append($anchor)
            ;
        },
        /**
         * Static (no this context)
         * @param {(jQuery|String)} content
         * @private
         */
        _renderPanel: function(content) {
            return $("<div>")
                .uniqueId()
                .addClass('tab-content')
                .append(content)
            ;
        },
        _add: function (item){
            var $panel = this._renderPanel(item.html);
            var $tab = this._renderTab($panel, item.title);
            this._getList().append($tab);
            this.element.append($panel);
            return $tab;
        },

        add: function(title, htmlElement, activate) {
            var content = this._add({
                html:  htmlElement,
                title: title
            });
            if(activate) {
                this.option('active', this.size() - 1);
            }
            this.refresh();
            return content;
        },

        size: function() {
            return this.tabs.length;
        }
    });
})(jQuery);
