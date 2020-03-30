/**
 *
 * @author Andriy Oblivantsev <eslider@gmail.com>
 * @copyright 08.04.2015 by WhereGroup GmbH & Co. KG
 */
(function($) {

    /**
     * Event list
     * @type {string[]}
     */
    var eventNameList = [
        'load',
        'focus', 'blur',
        'input', 'change', 'paste',
        'click', 'dblclick', 'contextmenu',
        'keydown', 'keypress', 'keyup',
        'dragstart','ondrag','dragover','drop',
        'mousedown', 'mouseenter', 'mouseleave', 'mousemove', 'mouseout', 'mouseover', 'mouseup',
        'touchstart', 'touchmove', 'touchend','touchcancel',
        'filled'
    ];

    // extend jquery to fire event on "show" and "hide" calls
    // @todo: this is bad practice and should be removed ASAP. Figure out who even uses this.
    $.each(['show', 'hide'], function (i, ev) {
        var el = $.fn[ev];
        $.fn[ev] = function () {
            this.trigger(ev);
            return el.apply(this, arguments);
        };
    });

    function isNode(x) {
        // Minimum (DOM level 1) criteria for DOM Nodes or text nodes
        // see https://www.w3.org/TR/REC-DOM-Level-1/ecma-script-language-binding.html
        return x && x.nodeType && x.nodeName;
    }

    /**
     * @param {String} expr
     * @return {RegExp|null}
     */
    function expressionToRegex(expr) {
        // for valid flags see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Advanced_searching_with_flags
        var matches = expr.match(/^[/](.*?)[/]([gimsuy]*)$/);
        if (matches) {
            return new RegExp(matches[1], matches[2]);
        } else {
            return null;
        }
    }

    /**
     * Check if typeof object[key] !== 'undefined'
     *
     * @param obj
     * @param key
     * @returns {boolean}
     */
    function has(obj, key) {
        return typeof obj[key] !== 'undefined';
    }

    function genElement_(declarations, item) {
        if (isNode(item)) {
            return item;
        }
        // @todo: explicitly warn / err on undefined type (there will be an error on calling undefined as a function, but it won't be informative)
        // @todo: fallback to html should ONLY be allowed if the item is a plain string
        var type = has(declarations, item.type) ? item.type : 'html';
        // Use declarations object as this argument for handler function.
        // Do not "beautify" this into discrete assignment of callable to variable followed by invocation, because
        // THAT passes nothing of particular interest as the invoked method's this arg.
        // see https://ecma-international.org/ecma-262/5.1/#sec-4.3.27
        var element = (declarations[type])(item);

        if(has(item, 'cssClass')) {
            element.addClass(item.cssClass);
        }

        if(has(item, 'attr')) {
            $.each(item.attr, function(key, val) {
                element.attr(key,val);
            });
        }

        if(typeof item == "object") {
            addEvents(element, item);
        }

        if(has(item, 'css')) {

            element.css(item.css);
        }

        // @todo: remove excessive data bindings
        element.data('item', item);

        if(has(item, 'mandatory')){
            element.addClass('has-warning');
        }

        return element;
    }

    function genElements_(declarations, items) {
        var items_;
        if (!_.isArray(items)) {
            // @todo: warn, deprecate
            items_ = _.toArray(items);
        } else {
            items_ = items;
        }
        var elements = [];
        for (var i = 0; i < items_.length; ++i) {
            elements.push(genElement_(declarations, items_[i]));
        }
        return elements;
    }
    /**
     * Add jquery events to element y declration
     *
     * @param element
     * @param declaration
     */
    function addEvents(element, declaration) {
        $.each(declaration, function(k, value) {
            if(typeof value == 'function') {
                element.on(k, value);
            } else if(typeof value == "string" && _.contains(eventNameList, k)) {
                var elm = element;
                if(elm.hasClass("form-group")) {
                    elm = elm.find("input,.form-control");
                }
                if(k === 'load'){
                    setTimeout(function(){
                        $(elm).ready(function(e) {
                            var el = elm;
                            var result = false;
                            console.error("Using Javascript code in the configuration is deprecated",value);
                            eval(value);
                            result && e.preventDefault();
                            return result;
                        });
                    },1);
                }else{
                    elm.on(k, function(e) {
                        var el = $(this);
                        var result = false;
                        console.error("Using Javascript code in the configuration is deprecated",value);
                        eval(value);
                        result && e.preventDefault();
                        return result;
                    });
                }
            }
        });
    }

    // Copies a string to the clipboard. Must be called from within an
    // event handler such as click. May return false if it failed, but
    // this is not always possible. Browser support for Chrome 43+,
    // Firefox 42+, Safari 10+, Edge and IE 10+.
    // IE: The clipboard feature may be disabled by an administrator. By
    // default a prompt is shown the first time the clipboard is
    // used (per session).
    function copyToClipboard(text) {
        if (window.clipboardData && window.clipboardData.setData) {
            // IE specific code path to prevent textarea being shown while dialog is visible.
            return clipboardData.setData("Text", text);

        } else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
            var textarea = document.createElement("textarea");
            textarea.textContent = text;
            textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in MS Edge.
            document.body.appendChild(textarea);
            textarea.select();
            try {
                return document.execCommand("copy");  // Security exception may be thrown by some browsers.
            } catch (ex) {
                console.warn("Copy to clipboard failed.", ex);
                return false;
            } finally {
                document.body.removeChild(textarea);
            }
        }
    }
    var readOnlyDeclarations = {
        genElement_: genElement_,
        genElements_: genElements_
    };

    var browserSupportsHtml5Date = (function() {
        // detect support for HTML5 date input; see https://stackoverflow.com/a/10199306
        var dateInput = document.createElement('input');
        var invalidDate = 'not-a-date';
        dateInput.setAttribute('type', 'date');
        dateInput.setAttribute('value', invalidDate);
        return dateInput.value !== invalidDate;
    })();

    // NOTE: bad indents deliberate to minimize diff
    var defaultDeclarations = $.extend({}, readOnlyDeclarations, {
            copyToClipboard: copyToClipboard,
            popup: function(item) {
                var popup = $("<div/>");
                popup.append(this.genElements_(this, item.children || []));
                window.setTimeout(function() {
                    popup.popupDialog(item)
                }, 1);

                return popup;
            },
            form: function(item) {
                var form = $('<form/>').attr(item.attr || {});
                form.append(this.genElements_(this, item.children || []));
                return form;
            },
            fluidContainer: function(item) {
                var container = $('<div/>').attr(item.attr || {}).addClass('container-fluid');
                var hbox = $('<div/>').attr(item.rowAttr || {}).addClass('row');
                hbox.append(this.genElements_(this, item.children || []));
                container.append(hbox);
                return container;
            },
            inline: function(item) {
                var container = $('<div/>').attr(item.attr || {}).addClass('form-inline');
                container.append(this.genElements_(this, item.children || []));
                return container;
            },
            html: function(item) {
                var container = $('<div/>').attr(item.attr || {}).addClass('html-element-container');
                if (typeof item === 'string'){
                    container.html(item);
                } else if (typeof item.html !== 'undefined') {
                    container.html(item.html);
                }else{
                    // WHAT?
                    container.html(JSON.stringify(item));
                }
                return container;
            },
            button: function(item) {
                var title = has(item, 'title') ? item.title : 'Submit';
                // @todo: use .text for escaping (unless it's HTML again :\)
                var button = $('<button>' + title + '</button>').attr(item.attr || {}).addClass('btn button');
                button.attr("title", (item.attr || {}).title || item.hover || title);
                return button;
            },
            submit: function(item) {
                var item_ = $.extend({}, item, {
                    attr: $.extend({}, (item. attr || {}), {
                        type: 'submit'
                    })
                });
                return this.button(item_);
            },
            /**
             * WRAPS the passed input into a form group
             *
             * @param {Object} item
             * @param {jQuery} [input] manufactures a new text-type input if omitted
             * @return {*|jQuery|HTMLElement}
             */
            input: function(item, input) {
                // @todo: fold very apparent copy & paste between this method and "checkbox" method
                var inputField = input;
                if (!input) {
                    var type = (item.type !== 'input' && item.type) || 'text';
                    inputField = $('<input class="form-control" type="' + type + '"/>');
                    inputField.attr(item.attr || {});
                }
                var container = $('<div class="form-group"/>');

                // @todo: remove excessive data bindings
                inputField.data('declaration',item);

                $.each(['name', 'rows', 'placeholder'], function(i, key) {
                    if(has(item, key)) {
                        inputField.attr(key, item[key]);
                    }
                });

                if(has(item, 'value')) {
                    inputField.val(item.value);
                }

                if(has(item, 'disabled') && item.disabled) {
                    inputField.attr('disabled','');
                }

                var label;
                if (item.title) {
                    label = this.label(item);
                    container.append(label);
                }

                if (item.mandatory) {
                    var validationCallback;
                    if (item.mandatory === true) {
                        validationCallback = function(value) {
                            return $.trim(value).length;
                        };
                    } else if (typeof item.mandatory === 'string') {
                        // legacy fun fact: string runs through eval, but result of eval can only be used
                        // if it happens to have an method named .exec accepting a single parameter
                        // => this was never compatible with anything but regex literals
                        var rxp = expressionToRegex(item.mandatory);
                        if (rxp) {
                            validationCallback = function(value) {
                                return rxp.test(value);
                            }
                        }
                    }
                    if (!validationCallback) {
                        console.error("Invalid value in item.mandatory. Use boolean true or a regex literal.", item.mandatory, item);
                        throw new Error("Invalid value in item.mandatory. Use boolean true or a regex literal.");
                    }
                    // @todo: why in the world is this a data attribute? Validation belongs in a form submit handler.
                    //        HTML5 validation already does most of this without custom logic
                    inputField.data('warn', validationCallback);
                }
                if (item.mandatoryText) {
                    inputField.attr('data-visui-validation-message', item.mandatoryText);
                }

                if (label && item.copyClipboard) {
                    label.append('&nbsp;', $('<i/>')
                        .addClass('fa fa-clipboard far-clipboard -visui-copytoclipboard')
                        .attr('aria-hidden', 'true')
                    );
                }

                container.append(inputField);

                return container;
            },
            label: function(item) {
                var label = $('<label/>');
                if(_.has(item, 'text')) {
                    label.html(item.text);
                }
                if(_.has(item, 'title')) {
                    label.html(item.title);
                }
                if(_.has(item, 'name')) {
                    label.attr('for', item.name);
                }
                if (item.infoText) {
                    var $icon = $('<i/>')
                        .addClass('fa fa-info-circle -visui-infotext')
                        .attr('title', item.infoText)
                    ;
                    label.append('&nbsp;', $icon);
                }

                return label;
            },
            checkbox: function(item, input) {
                // @todo: fold very apparent copy & paste between this method and "input" method
                var container = $('<div class="form-group checkbox"/>');
                var label = this.label(item);

                input = input ? input : $('<input type="checkbox"/>');

                // @todo: remove excessive data bindings
                input.data('declaration',item);

                label.prepend(input);
                input.attr({
                    name: item.name || null,
                    value: item.value || null
                });
                input.prop({
                    required: !!item.mandatory,
                    checked: !!item.checked
                });

                container.append(label);

                return container;
            },
            radio: function(item) {
                var input = $('<input type="radio"/>');
                var container = this.checkbox(item, input);
                container.addClass('radio');
                return container;
            },
            formGroup: function(item) {
                var container = $('<div class="form-group"/>');
                container.append(this.genElements_(this, item.children || []));
                return container;
            },
            textArea: function(item) {
                var inputField = $('<textarea class="form-control" rows="3"/>');
                var container = this.input(item, inputField);
                container.addClass('textarea-container');

                // @todo: remove excessive data bindings
                inputField.data('declaration',item);
                return container;
            },
            selectOption: function(item, option) {
                var label, value;
                var labelAttribNames = ['label', '__label', 'title'];
                var valueAttribNames = ['value', '___value', 'id'];
                var noLabel = true;
                var noValue = true;
                var i = 0;
                do {
                    label = option[labelAttribNames[i]];
                    noLabel = (typeof label === 'undefined');
                    ++i;
                } while (noLabel && i < labelAttribNames.length);
                i = 0;
                do {
                    value = option[valueAttribNames[i]];
                    noValue = (typeof value === 'undefined');
                    ++i;
                } while (noLabel && i < valueAttribNames.length);
                if (noLabel || noValue) {
                    var optionAsList = _.toArray(option);
                    if (optionAsList.length < 2) {
                        console.error("Invalid option input, need at least a label and a value", option);
                        return null;    // will be skipped by $.append
                    }
                    if (_.isArray(option) && optionAsList.length > 2) {
                        console.warn("List-style option with more than two entries, results unpredictable. Use an object with 'value' and 'label' instead", option);
                    }
                    if (noValue) {
                        value = optionAsList[0];
                    }
                    if (noLabel) {
                        label = optionAsList[1];
                    }
                }
                var attr = $.extend({}, option.attr, {value: value});
                var $option = $('<option/>')
                    .attr(attr)
                    // Label has historically been set through .html instead of .text ...
                    // @todo: html seems super unsafe to use. Figure out why / if we really want HTML here instead of text
                    .html(label)
                ;
                return $option;
            },
            selectOptionList: function(item) {
                var options = item.options || [];
                if (!_.isArray(options)) {
                    console.warn("Passing an option mapping is deprecated (order cannot be guaranteed). Use a list.", options);
                    // legacy fun time: keys are used as labels, mapped values used as submit values
                    options = _.map(options, function(x, key) {
                        return {value: x, label: key};
                    });
                }
                var optionElements = [];
                for (var i = 0; i < options.length; ++i) {
                    optionElements.push(this.selectOption(item, options[i]));
                }
                return optionElements;
            },
            select: function(item) {
                var select = $('<select class="form-control"/>');
                var container = this.input(item, select);
                var value = item.value;

                container.addClass('select-container');

                select.append(this.selectOptionList(item));
                if (item.multiple) {
                    select.prop('multiple', true);
                    var separator = item.separator || ',';
                    if (value && !$.isArray(value)) {
                        value = value.split(separator);
                    }
                    select.attr('data-visui-multiselect-separator', separator);
                    select.val(value || null);
                } else {
                    select.val(value || "");
                }
                if ((item.multiple || item.select2) && (typeof select.select2 === 'function')) {
                    select.select2(item);
                }

                return container;
            },
            image: function(item) {
                var image = $('<img src="' + (has(item, 'src') ? item.src : '') + '"/>');
                var subContainer = $("<div class='sub-container'/>");
                var container = this.input(item, image);

                container.append(subContainer.append(image.detach()));
                container.addClass("image-container");

                if(has(item, 'enlargeImage') && item.enlargeImage) {
                    image.attr('tabindex', 0);
                    image.css('cursor', 'pointer');
                    image.on('keypress click', function(e) {
                        if(e.type !== 'click' && e.which && e.which !== 13) {
                            return
                        }

                        var bigImage = new Image();
                        bigImage.src = item.src;
                        bigImage.onload = function() {
                            var dialog = $('<div>');
                            var bImage = $('<img src="' + image.attr('src') + '"/>');
                            var _popupConfig = {
                                title: image.title ? image.title : 'Image',
                                width: bigImage.width
                            };
                            var maxHeight = $(window).height() - 100;
                            if(bigImage.height > maxHeight) {
                                _popupConfig.height = maxHeight;
                            }
                            dialog.popupDialog(_popupConfig);
                            bImage.css({
                                height:      'auto',
                                width:       '100%',
                                'max-width': bigImage.width
                            });
                            dialog.append(bImage);
                        };
                    })
                }

                if(has(item, 'imageCss')) {
                    image.css(item['imageCss']);
                } else {
                    image.css({width: "100%"});
                }
                return container;
            },
            file: function(item) {
                var input = $('<input type="hidden"  />');
                var fileInput = $('<input type="file" />');
                var container = this.input(item, input);
                var defaultText = (has(item, 'text') ? item.text : "Select");
                var textSpan = '<span class="upload-button-text"><i class="fa fa-upload" aria-hidden="true"/> ' + defaultText + '</span>';
                var uploadButton = $('<span class="btn btn-success button fileinput-button">' + textSpan + '</span>');
                var buttonContainer = $("<div/>");
                var progressBar = $("<div class='progress-bar'/>");
                var eventHandlers = item.on ? item.on : {};

                if(has(item, 'accept')) {
                    fileInput.attr('accept', item.accept);
                }

                //input.detach();
                container.addClass("file-container");
                uploadButton.append(fileInput);
                buttonContainer.append(uploadButton);
                uploadButton.append(progressBar);
                container.append(buttonContainer);

                function truncate(n, len) {
                    var ext = n.substring(n.lastIndexOf(".") + 1, n.length).toLowerCase();
                    var filename = n.replace('.' + ext, '');
                    if(filename.length <= len) {
                        return n;
                    }
                    filename = filename.substr(0, len) + (n.length > len ? '[...]' : '');
                    return filename + '.' + ext;
                }

                fileInput.fileupload({
                    dataType:    'json',
                    url:         item.uploadHanderUrl,
                    formData:    item.formData,
                    //sequentialUploads: true,
                    add:         function(e, data) {
                        //console.log("added file", data, e);
                        data.submit();
                    },
                    progressall: function(e, data) {
                        var progress = parseInt(data.loaded / data.total * 100, 10);
                        progressBar.css({width: progress + "%"});
                        //progressBar.html(progress + "%");
                        if(eventHandlers.progressall){
                            console.error("Using Javascript code in the configuration is deprecated",eventHandlers.progressall);
                            eval(eventHandlers.progressall);
                        }
                    },
                    always:      function(e, data) {
                        if(eventHandlers.always) {
                            console.error("Using Javascript code in the configuration is deprecated",eventHandlers.always);
                            eval(eventHandlers.always);
                        }
                    },
                    done:        function(e, data) {
                        if(eventHandlers.done){
                            console.error("Using Javascript code in the configuration is deprecated",eventHandlers.done);
                            eval(eventHandlers.done);
                        }
                        progressBar.css({width: 0});
                    },
                    success:     function(result, textStatus, jqXHR) {
                        if(eventHandlers.success){
                            console.error("Using Javascript code in the configuration is deprecated",eventHandlers.success);
                            eval(eventHandlers.success);
                        }

                        if(result.files && result.files[0]) {
                            var fileInfo = result.files[0];
                            var img = container.closest('form').find('img[name="' + item.name + '"]');

                            if(fileInfo.error) {
                                $.notify(fileInfo.error, "error");
                                return;
                            }

                            if(fileInfo.name) {
                                buttonContainer.find('.upload-button-text').html('<i class="fa fa-check-circle-o far-check-circle" aria-hidden="true"/> ' + truncate(fileInfo.name, 10));
                                var newUploadFileInput = container.find('input[type="file"]')
                                    .attr('title', fileInfo.name)
                                    .attr('alt', fileInfo.name)
                                    .attr('label', fileInfo.name);
                            }

                            if(img.size()){
                                img.attr('src', fileInfo.thumbnailUrl);
                            }
                            input.val(fileInfo.url);
                        }
                    }
                });

                return container;
            },
            tabs: function(item) {
                var $tabList = $('<ul/>');
                var container = $('<div/>').append($tabList);
                var children = item.children || [];
                for (var i = 0; i < children.length; ++i) {
                    var subItem = children[i];
                    var panelContent = this.genElement_(this, subItem);
                    var $panel = $('<div>').uniqueId().append(panelContent);
                    var $tabHeader = $('<li>').append($('<a>').attr('href', '#' + $panel.attr('id')).text(subItem.title));
                    $tabList.append($tabHeader);
                    container.append($panel);
                }
                container.tabs({
                    classes: {
                        "ui-tabs": "ui-tabs mapbender-element-tab-navigator",
                        "ui-tabs-nav": "ui-tabs-nav nav nav-tabs",
                        "ui-tabs-panel": "ui-tabs-panel tab-content"
                    }
                });
                return container;
            },
            fieldSet: function(item) {
                var fieldSet = $("<fieldset class='form-group'/>");

                if (item.title) {
                    fieldSet.append(this.label(item));
                }
                if(has(item, 'legend')) {
                    fieldSet.append("<legend>"+item.legend+"</legend>");
                }
                fieldSet.append(this.genElements_(this, item.children || []));

                if (item.breakLine) {
                    fieldSet.append(this.breakLine(item));
                }

                return fieldSet;
            },
            date: function(item) {
                var value = item.value;
                if (item.dateFormat && item.dateFormat !== 'yy-mm-dd') {
                    console.warn("Ignoring invalid dateFormat setting. The only possible value is 'yy-mm-dd'. See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date", item);
                }
                if (value === null || (typeof value === 'undefined')) {
                    value = '';
                }
                if (value !== '' && !(typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/))) {
                    if (!(typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/))) {
                        console.error("Invalid value for date input, ignoring", value);
                        value = '';
                    }
                }
                if (item.mandatory && !value) {
                    value = (new Date()).toISOString().slice(0, 10);
                }

                if (browserSupportsHtml5Date) {
                    return this.input($.extend({}, item, {
                        type: 'date',
                        value: value
                    }));
                } else {
                    var textInput = this.input($.extend({}, item, {
                        type: 'text',
                        value: value
                    }));
                    textInput.dateSelector();
                    return textInput;
                }
            },
            colorPicker: function(item) {
                var container = $('<div class="form-group"/>');
                var inputHolder = this.input(item);
                var label = inputHolder.find('> label');

                inputHolder.append('<span class="input-group-addon"><i></i></span>');
                inputHolder.addClass("input-group colorpicker-element colorpicker-component");
                container.prepend(label);
                container.append(inputHolder);
                inputHolder.find('> label').remove();

                if (item.value) {
                    item.color = item.value;
                }

                if(!item.hasOwnProperty("format")){
                    item.format = "hex";
                }

                inputHolder.colorpicker(item);

                var input = inputHolder.find("input");
                input.addClass("form-control");

                return container;
            },
            slider: function(item) {
                var container = $('<div class="form-group input-group slider-holder"/>');
                var inputHolder = this.input(item);
                var label = inputHolder.find('> label');
                var input = inputHolder.find('> input');
                var sliderRange = $('<div class="input-group"/>');

                label.append('<span/>')

                inputHolder.prepend(sliderRange);
                inputHolder.find('> label').remove();
                inputHolder.find('> input').attr('type', 'hidden');

                container.prepend(label);
                container.append(inputHolder);

                label.find('> span').text(' ' + item.value);

                sliderRange.slider($.extend({
                    range:  "max",
                    min:    1,
                    max:    10,
                    value:  1,
                    step:   1,
                    slide:  function(event, ui) {
                        input.val(ui.value);
                        label.find('> span').text(' ' + ui.value);
                    },
                    change: function(event, ui) {
                        var value = input.val();
                        label.find('> span').text(' ' + value);
                    }
                }, item));

                input.on('change', function() {
                    var value = input.val();
                    label.find('> span').text(' ' + value);
                    sliderRange.slider("value", value);
                });

                return container;
            },
            resultTable: function(item) {
                var container = $("<div/>").attr(item.attr || {});
                $.each(['name'], function(i, key) {
                    if(has(item, key)) {
                        container.attr(key, item[key]);
                    }
                });

                return container
                    // @todo: remove excessive data bindings
                    .data('declaration', item)
                    .resultTable($.extend({
                        lengthChange: false,
                        pageLength:   10,
                        searching:    false,
                        info:         true,
                        processing:   false,
                        ordering:     true,
                        paging:       true,
                        selectable:   false,
                        autoWidth:    false
                    }, item));
            },
            digitizingToolSet: function(item) {
                var $div = $("<div/>").attr(item.attr || {});
                // @todo: remove excessive data bindings
                $div.data('declaration',item);
                return $div.digitizingToolSet(item);
            },

            /**
             * Break line
             *
             * @param item
             * @return {*|HTMLElement}
             */
            breakLine: function(item) {
                return $("<hr/>").attr(item.attr || {}).addClass('break-line');
            },

            /**
             *
             * @param item
             */
            text: function(item) {
                var callback;
                if (!item.text) {
                    console.error('Missing value property .text for type "text" item', item);
                    throw new Error('Missing value property .text for type "text" item');
                }
                var text = $('<div/>').attr(item.attr || {}).addClass('text -visui-text-callback');
                if (typeof item.text === 'function') {
                    callback = function(values) {
                        return (item.text)(values);
                    };
                } else {
                    console.warn("Using eval'd JavaScript code for item type text is deprecated. Supply a function.", item);
                    callback = function(values) {
                        try {
                            var data = values;  // for eval scope
                            var declaration = item; // for eval scope
                            return eval(item.text);
                        } catch (e) {
                            console.error('Failed to evaluate text type item content', item.text, item, values);
                            throw new Error('Failed to evaluate text type item content');
                        }
                    };
                }
                text.data('visui-text-callback', callback);
                var container = this.input(item, text);
                container.addClass('text');
                return container;
            },

            /**
             * Simple container
             *
             * @param item
             * @todo v0.2.x: remove this
             */
            container: function(item) {
                console.warn("Generating a type: container via vis-ui.js is deprecated and will be removed in v0.2", item);
                var container = $('<div/>').attr(item.attr || {}).addClass('form-group');
                container.append(this.genElements_(this, item.children || []));
                return container;
            },

            /**
             * Simple accordion
             *
             * @param item
             * @todo v0.2.x: remove this
             */
            accordion: function(item) {
                console.warn("Generating a type: accordion via vis-ui.js is deprecated and will be removed in v0.2", item);
                var declarations = this;
                var container = $('<div class="accordion"/>');
                if(has(item, 'children')) {
                    _.each(item.children, function(child, k) {
                        var pageContainer = $("<div class='container' data-id='" + k + "'/>");
                        var pageHeader = $("<h3 class='header' data-id='" + k + "'/>");

                        if(has(child, 'head')) {
                            pageHeader.append(declarations.genElement_(declarations, child.head));
                        }

                        if(has(child, 'content')) {
                            pageContainer.append(this.genElement_(declarations, child.content));
                        }

                        container.append(pageHeader);
                        container.append(pageContainer);
                    })
                }
                // @todo: remove excessive data bindings
                container.data('declaration', item);
                container.accordion(item);
                return container;
            }
    });
    $.widget('vis-ui-js.generateElements', {
        options:      {},
        /**
         * Constructor
         *
         * @private
         */
        _create:      function() {
            this._setOptions(this.options);
        },

        /**
         * Generate element by declaration
         *
         * @param item declaration
         * @return jquery html object
         */
        genElement: function(item) {
            return genElement_(this.declarations, item);
        },

        /**
         * Generate elements
         *
         * @param element jQuery object
         * @param children declarations
         */
        genElements: function(element, children) {
            element.append(genElements_(this.declarations, children));
        },

        /**
         * Set options
         *
         * @param options
         * @private
         * @todo: this should be _create (minus options argument)
         */
        _setOptions: function(options) {
            // always deep-copy to prevent monkey-patches affecting other instances
            // Re-add readOnlyDeclarations on top to prevent overrides.
            this.declarations = $.extend({}, defaultDeclarations, options.declarations, readOnlyDeclarations);
            if (options.type && !options.children) {
                console.warn("Invocation of generateElements (plural!) with single item is deprecated. Put your item in a list and pass it in the children property.");
                this.genElements(this.element, [options]);
            } else if(has(options, 'children')) {
                this.genElements(this.element, options.children);
            }

            this.element.addClass('vis-ui');
            this.element.on('click touch press', '.-visui-infotext[title]', function() {
                $.notify($(this).attr('title'), 'info');
            });
            this.element.on('click', '.-visui-copytoclipboard', function() {
                var $input = $('input, select, textarea', $(this).closest('.form-group'));
                copyToClipboard($input.val());
            });

            this._super(options);
            this.refresh();
        },

        /**
         * Refresh generated elements
         */
        refresh:     function() {
            this._trigger('refresh');
        }
    });

    /**
     * Update existing select element
     *
     * @param values
     * @param idKey
     * @param valueKey
     */
    $.fn.updateSelect = function(values, idKey, valueKey) {
        var select = this;
        var val = select.val();
        select.empty();

        if(idKey && valueKey){
            values = _.object(_.pluck(values, idKey), _.pluck(values, valueKey));
        }

        _.each(values, function(value, key) {
            select.append('<option value="'+key+'">'+value+'</option>');
        });

        select.val(val);
    };

    /**
     * Grabbed from here: http://jsfiddle.net/DkHyd/
     */
    $.fn.togglepanels = function(args) {
        return this.each(function() {
            $(this).addClass("ui-accordion ui-accordion-icons ui-widget ui-helper-reset")
                .find("h3")
                .addClass("ui-accordion-header ui-helper-reset ui-state-default ui-corner-top ui-corner-bottom")
                .hover(function() {
                    $(this).toggleClass("ui-state-hover");
                })
                .prepend('<span class="ui-icon ui-icon-triangle-1-e"></span>')
                .click(function(e) {
                    $(this)
                        .toggleClass("ui-accordion-header-active ui-state-active ui-state-default ui-corner-bottom")
                        .find("> .ui-icon").toggleClass("ui-icon-triangle-1-e ui-icon-triangle-1-s").end()
                        .next().slideToggle(0);

                    if(args.onChange) {
                        var title = $(e.currentTarget);
                        args.onChange(e, {
                            'title':   title,
                            'content': title.next()
                        });
                    }
                    return false;
                })
                .next()
                .addClass("ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom")
                .hide();
        });
    };

})(jQuery);
