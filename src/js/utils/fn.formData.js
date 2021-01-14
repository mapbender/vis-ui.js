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
window.VisUi = window.VisUi || {};
window.VisUi.validateInput = function(input) {
    var $input = $(input);
    if ($input.attr('type') === 'radio') {
        // Individual radio buttons cannot be invalid and cannot be validated
        return;
    }
    var isValid = $input.is(':valid') || $input.get(0).type === 'hidden';
    var validationCallback = input.data('warn');
    if (isValid && validationCallback) {
        var value = $input.val();
        if (value === '') {
            isValid = validationCallback(null);
        } else {
            isValid = validationCallback(value);
        }
    }
    // NOTE: hidden inputs must be explicitly excluded from jQuery validation
    //       see https://stackoverflow.com/questions/51534473/jquery-validate-not-working-on-hidden-input
    var isValid = (!validationCallback || validationCallback(value)) && $input.is(':valid') || $input.get(0).type === 'hidden';
    var $formGroup = input.closest('.form-group');
    $formGroup.toggleClass('has-error', !isValid);
    $formGroup.toggleClass('has-success', isValid);
    var $messageContainer = $('.invalid-feedback', $formGroup);
    var invalidMessage = $input.attr('data-visui-validation-message');
    if (!isValid && invalidMessage && $input.is(":visible") && $input.attr('type') !== 'checkbox') {
        if (!$messageContainer.length) {
            $messageContainer = $(document.createElement('div')).addClass('help-block invalid-feedback');
            $formGroup.append($messageContainer);
        }
        $messageContainer.text(invalidMessage || '');
    }
    $messageContainer.toggle(!isValid);
    if (!isValid) {
        // Re-validate once on change, to make error message disappear
        $input.one('change', function() {
            VisUi.validateInput(input);
        });
    }
    // .has-warning is set initially to required inputs but its styling conflicts with .has-error / .has-success.
    // After validation, we always either .has-error or .has-success, so .has-warning needs to go
    $formGroup.removeClass('has-warning');
    return isValid;
};

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

            // Ignore unchecked radios to avoid replacing previous checked radio value with the same name attribute
            // NOTE: vis-ui itself makes it possible to generate radio button groups where no radio button is checked
            //       For these cases, we cannot skip all unchecked radios. We have to evaluate at least one, to generate
            //       an empty value.
            if (this.type === 'radio' && values[this.name] && !this.checked) {
                return;
            }

            switch (this.type) {
                case 'checkbox':
                case 'radio':
                    value = input.is(':checked') && input.val();
                    break;
                default:
                    value = input.val();
                    break;
            }

            if (value === "" || (this.type === 'radio' && !this.checked)) {
                value = null;
            }
            var isValid = VisUi.validateInput(input);
            if (!isValid && !firstInput) {
                var $tabElement = input.closest('.ui-tabs');
                var tabIndex = $tabElement.length && $tabElement.find(".ui-tabs-panel").index($panelElement);
                if ($tabElement) {
                    $tabElement.tabs({active: tabIndex});
                }
                firstInput = input;
                input.focus();
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


