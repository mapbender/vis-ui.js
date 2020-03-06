(function($) {

    /**
     * Date selector based on $.ui.datepicker
     * Replacement for <input type="date"> for browsers without proper HTML5 supprt.
     * Hard-coded to German locale.
     * Accepts no options. Accepting any options would conflict with operation of native HTML5 inputs.
     *
     * Widget can't be extended:
     * http://bugs.jqueryui.com/ticket/6228
     *
     * @author Andriy Oblivantsev <eslider@gmail.com>
     */
    $.widget("vis-ui-js.dateSelector", {
        _init: function() {
            var $input = $('input', this.element);
            var datePicker = $input.datepicker({
                changeMonth:       true,
                changeYear:        true,
                gotoCurrent:       true,
                defaultDate:       null,
                firstDay:          1, //showWeek:          true,
                dayNamesMin:       ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
                monthNamesShort:   ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"], //showButtonPanel: true,
                dateFormat:        'yy-mm-dd'
            }).data('datepicker');
            // legacy styling hacks
            // @todo: style via proper datepicker selectors in proper scope, do not add random classes that "seem to work"
            // @todo: better yet, use original jquery ui css to style original jquery ui widgets
            datePicker.dpDiv.addClass('dropdown-menu').addClass('modal-body');
        }
    });

})(jQuery);
