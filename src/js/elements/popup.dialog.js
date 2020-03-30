(function($) {
    // fake dialogExtend check for ui-dialog
    if (!$.fn.orignalDialogFunc) {
        // sic!
        $.fn.orignalDialogFunc = $.fn.dialog;
    }
    var $doc = $(document);
    if (!$doc.data('visui-monkeypatch-uidialog')) {
        $.fn["dialog"] = function(arg1, arg2) {
            return this.hasClass('popup-dialog') ? this.popupDialog(arg1, arg2) :  this.orignalDialogFunc(arg1, arg2);
        };
        $doc.data('visui-monkeypatch-uidialog', true);
    }

    /**
     * jQueryui dialog with unholy mix of bootstrap and Mapbender custom styles
     *
     * @author Andriy Oblivantsev <eslider@gmail.com>
     * @copyright 05.11.2014 by WhereGroup GmbH & Co. KG
     * @todo: Get this over into a separate repository (WITH a working stylesheet) or into Mapbender (current location of required stylesheet)
     *        it makes no sense to have markup generation and css class modifiers here, separate from the stylesheets that make it work
     */
    $.widget("vis-ui-js.popupDialog", $.ui.dialog, {
        /**
         * @return {*}
         * @private
         */
        _create: function() {
            var element = this.element;
            // Unholy mix of jQuery UI and Bootstrap and Mapbender CSS
            element.addClass('popup-dialog');
            element.addClass('modal-body');

            // overrides default options
            $.extend(this.options, {
                show: {
                    effect:   "fadeIn",
                    duration: 300
                },
                hide: {
                    effect:   "fadeOut",
                    duration: 300
                }
            });

            //resize dialog height fix
            element.bind('popupdialogresize', function(e, ui) {
                var win = $(e.target).closest('.ui-dialog');
                var height = 0;
                $.each($('> .modal-header, > .modal-body, > .modal-footer', win), function(idx, el) {
                    height += $(el).outerHeight();
                });
                win.height(Math.round(height));
                element.width(element.closest('.ui-dialog').find('> .modal-header').width());
            });

            //resize dialog height fix
            element.bind('popupdialogresizestop', function(e, ui) {
                element.width(element.closest('.ui-dialog').find('> .modal-header').width());
            });

            // prevent key listening outside the dialog
            element.on('keydown', function(e) {
                e.stopPropagation();
            });

            this._super();
        },
        _createTitlebar: function() {
            this._super();
            if (this.element.dialogExtend) {
                // NOTE: no widget-level options defaults for these
                var extendableOptions = $.extend(true, {
                    closable:    true,
                    maximizable: true,
                    collapsable: true
                }, this.options);

                this.element.data("ui-dialog", true);
                if (extendableOptions.maximizable && (typeof this.options.dblclick === 'undefined')) {
                    extendableOptions.dblclick = 'maximize';
                }

                this.element.dialogExtend(extendableOptions);
            }
            // Unholy mix of jQuery UI and Bootstrap and Mapbender CSS
            this.uiDialogTitlebar.addClass('modal-header');
            // @todo Mapbender: resolve Mapbender css dependency on generally not advantageous bootstrap .close class
            //                  to generate consistent close button vs jquerydialogextend not-really-button visuals
            $('.ui-dialog-titlebar-close', this.uiDialogTitlebar).addClass('close');
        },
        open: function() {
            this._super();
            if (this.overlay) {
                this.overlay.addClass('mb-element-modal-dialog');
            }
        },
        _createWrapper: function() {
            this._super();
            // Unholy mix of jQuery UI and Bootstrap and Mapbender CSS
            this.uiDialog.addClass('modal-content mb-element-popup-dialog');
        },
        _createButtonPane: function() {
            // Unholy mix of jQuery UI and Bootstrap and Mapbender CSS
            this._super();
            this.uiDialogButtonPane.addClass('modal-footer');
        },
        _createButtons: function() {
            this._super();
            $('button', this.uiButtonSet).each(function() {
                var $b = $(this);
                // leave fully formed Bootstrap buttons alone; add Mapbender .button (for default color) plus
                // Bootstrap .btn (for margin) otherwise
                if (!$b.hasClass('btn')) {
                    $(this).addClass('button btn');
                }
            });
        }
    });

})(jQuery);
