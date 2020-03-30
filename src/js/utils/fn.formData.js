/**
 *
 * @author Andriy Oblivantsev <eslider@gmail.com>
 */
/**
 * Form helper plugin for jQuery
 *
 * @author Andriy Oblivantsev <eslider@gmail.com>
 * @copyright 02.02.2015 by WhereGroup GmbH & Co. KG
 *
 */
$.fn.formData = (function() {
    function setValues(form, values) {
        $('.-visui-text-callback', form).each(function() {
            var textElement = $(this);
            var callback = textElement.data('visui-text-callback');
            /** @todo: why .html? .text would be safer */
            textElement.html(callback.call(null, values));
        });
        $(':input[name]', form).each(function() {
            var input = $(this);
            var value = values[this.name];

            if(values.hasOwnProperty(this.name)) {

                switch (this.type) {
                    case 'select-multiple':
                        if (value && !$.isArray(value)) {
                            var separator = input.attr('data-visui-multiselect-separator') || ',';
                            input.val(value.split(separator));
                        } else {
                            input.val(value);
                        }
                        break;
                    case 'checkbox':
                        input.prop('checked', value !== null && value);
                        break;
                    case 'radio':
                        if (value === null) {
                            input.prop('checked', false);
                        } else if (input.val() == value) {
                            input.prop("checked", true);
                        }
                        break;
                    case 'hidden':
                        input.val(value);
                        input.trigger('change');
                        break;

                    case 'text':
                        if(input.hasClass('hasDatepicker')) {
                            if(value === '' || value === 0 || value === '0') {
                                value = null;
                            }

                            input.datepicker("setDate", value);
                            input.datepicker("refresh");
                        } else {
                            input.val(value);
                        }
                        break;
                    default:
                        input.val(value);
                        break;
                }
                // Use scoped events to visually update select2 / colorpicker, if initialized
                // @todo: ... why exactly do we avoid triggering regular 'change', except for 'hidden'-type inputs?
                input.trigger('change.select2');
                /** magical 'filled' event, purpose unknown. Emit warnings on event data property access */
                var filledEventData = {};
                Object.defineProperties(filledEventData, {
                    data: {
                        get: function() {
                            console.warn("Stop subscribing to custom 'filled' event. Explicitly call your code after repopulating a form.");
                            return values;
                        }
                    },
                    value: {
                        get: function() {
                            console.warn("Stop subscribing to custom 'filled' event. Explicitly call your code after repopulating a form.");
                            return value;
                        }
                    }
                });

                input.trigger('filled', filledEventData);
                input.trigger('change.colorpicker');
            }
        });
        return form;
    }
    function getValues(form) {
        var values = {};
        var firstInput;
        $(':input[name]', form).each(function() {
            var input = $(this);
            var value;

            switch (this.type) {
                case 'checkbox':
                case 'radio':
                    if(values.hasOwnProperty(this.name) && values[this.name] != null){
                        return;
                    }
                    value = input.is(':checked') && input.val();
                    break;
                default:
                    value = input.val();
            }

            if(value === ""){
                value = null;
            }
            var validationCallback = input.data('warn');
            var isValid = (!validationCallback || validationCallback(value)) && input.is(':valid');
            input.closest('.form-group').toggleClass('has-error', !isValid);
            if (!isValid && !firstInput) {
                var $tabElement = input.closest('.ui-tabs');
                var tabIndex = $tabElement.length && input.closest('.ui-tabs-panel').index('.ui-tabs-panel');
                if ($tabElement) {
                    $tabElement.tabs({active: tabIndex});
                }
                firstInput = input;
                input.focus();
            }

            if (!isValid && input.is(":visible") && $.notify) {
                var text = input.attr('data-visui-validation-message') || "Please, check!";
                $.notify(input, text, {position: "top right", autoHideDelay: 2000});
            }
            values[this.name] = value;
        });
        return values;
    }
    function handleArgs(values) {
        if (values) {
            return setValues($(this), values);
        } else {
            return getValues($(this));
        }
    }
    return handleArgs;
})();

$.fn.disableForm = function() {
    var form = this;
    var inputs = $(" :input", form);
    form.attr('readonly', true);
    form.css('cursor', 'wait');
    $.each(inputs, function(idx, el) {
        var $el = $(el);
        if($el.is(':checkbox') || $el.is(':radio') || $el.is('select')) {
            $el.attr('disabled', 'disabled');
        } else {
            $el.attr('readonly', 'true');
        }
    })
};

$.fn.enableForm = function() {
    var form = this;
    var inputs = $(" :input", form);
    form.css('cursor', '');
    $.each(inputs, function(idx, el) {
        var $el = $(el);
        if($el.is(':checkbox') || $el.is(':radio') || $el.is('select')) {
            $el.removeAttr('disabled', 'disabled');
        } else {
            $el.removeAttr('readonly', 'true');
        }
    })
};


