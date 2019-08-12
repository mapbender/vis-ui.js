/**
 *
 * @author Andriy Oblivantsev <eslider@gmail.com>
 * @copyright 08.04.2015 by WhereGroup GmbH & Co. KG
 */
(function ($) {

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
        'dragstart', 'ondrag', 'dragover', 'drop',
        'mousedown', 'mouseenter', 'mouseleave', 'mousemove', 'mouseout', 'mouseover', 'mouseup',
        'touchstart', 'touchmove', 'touchend', 'touchcancel'
    ];

    // extend jquery to fire event on "show" and "hide" calls
    $.each(['show', 'hide'], function (i, ev) {
        var el = $.fn[ev];
        $.fn[ev] = function () {
            this.trigger(ev);
            return el.apply(this, arguments);
        };
    });

    /**
     * Check if object has a key
     *
     * @param obj
     * @param key
     * @returns {boolean}
     */
    function has(obj, key) {
        return typeof obj[key] !== 'undefined';
    }

    /**
     * Get value from object by the key or return default given.
     *
     * @param obj
     * @param key
     * @param defaultValue
     * @returns {*}
     */
    function getVal(obj, key, defaultValue) {
        return has(obj, key) ? obj[key] : defaultValue;
    }

    /**
     * Add jquery events to element y declration
     *
     * @param element
     * @param declaration
     */
    function addEvents(element, declaration) {
        $.each(declaration, function (k, value) {
            if (typeof value == 'function') {
                element.on(k, value);
            } else if (typeof value == "string" && _.contains(eventNameList, k)) {
                var elm = element;
                if (elm.hasClass("form-group")) {
                    elm = elm.find("input,.form-control");
                }
                if (k === 'load') {
                    setTimeout(function () {
                        $(elm).ready(function (e) {
                            var el = elm;
                            var result = false;
                            eval(value);
                            result && e.preventDefault();
                            return result;
                        });
                    }, 1);
                } else {
                    elm.on(k, function (e) {
                        var el = $(this);
                        var result = false;
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

    $.widget('vis-ui-js.generateElements', {
        options: {},
        declarations: {
            popup: function (item, declarations, widget) {
                var popup = $("<div/>");
                if (has(item, 'children')) {
                    $.each(item.children, function (k, item) {
                        popup.append(widget.genElement(item));
                    });
                }
                window.setTimeout(function () {
                    popup.popupDialog(item)
                }, 1);

                return popup;
            },
            form: function (item, declarations, widget) {
                var form = $('<form/>');
                if (has(item, 'children')) {
                    $.each(item.children, function (k, item) {
                        form.append(widget.genElement(item));
                    })
                }
                return form;
            },
            fluidContainer: function (item, declarations, widget) {
                var container = $('<div class="container-fluid"/>');
                var hbox = $('<div class="row"/>');
                if (has(item, 'children')) {
                    $.each(item.children, function (k, item) {
                        hbox.append(widget.genElement(item));
                    })
                }
                container.append(hbox);
                return container;
            },
            inline: function (item, declarations, widget) {
                var container = $('<div class="form-inline"/>');
                if (has(item, 'children')) {
                    $.each(item.children, function (k, item) {
                        container.append(widget.genElement(item));
                    })
                }
                return container;
            },
            html: function (item, declarations) {
                var container = $('<div class="html-element-container"/>');
                if (typeof item === 'string') {
                    container.html(item);
                } else if (has(item, 'html')) {
                    container.html(item.html);
                } else {
                    container.html(JSON.stringify(item));
                }
                return container;
            },
            button: function (item, declarations) {
                var title = has(item, 'title') ? item.title : 'Submit';
                var button = $('<button class="btn button">' + title + '</button>');
                button.attr("title", title);
                return button;
            },
            submit: function (item, declarations) {
                var button = declarations.button(item, declarations);
                button.attr('type', 'submit');
                return button;
            },
            input: function (item, declarations, widget, input) {
                var type = has(declarations, 'type') ? declarations.type : 'text';
                var inputField = input ? input : $('<input class="form-control" type="' + type + '"/>');
                var container = $('<div class="form-group"/>');
                var icon = '<span class="glyphicon glyphicon-ok form-control-feedback" aria-hidden="true"></span>';

                // IE8 bug: type can't be changed...
                /// inputField.attr('type', type);
                inputField.data('declaration', item);

                $.each(['name', 'rows', 'placeholder'], function (i, key) {
                    if (has(item, key)) {
                        inputField.attr(key, item[key]);
                    }
                });

                if (has(item, 'value')) {
                    inputField.val(item.value);
                }

                if (has(item, 'disabled') && item.disabled) {
                    inputField.attr('disabled', '');
                }


                if (has(item, 'title')) {
                    container.append(declarations.label(item, declarations));
                    container.addClass('has-title')
                }

                if (has(item, 'mandatory') && item.mandatory) {
                    inputField.data('warn', function (value) {
                        var hasValue = $.trim(value) != '';
                        var isRegExp = item.mandatory !== true;

                        if (isRegExp) {
                            hasValue = eval(item.mandatory).exec(value) != null;
                        }

                        if (hasValue) {
                            container.removeClass('has-error');
                        } else {
                            if (inputField.is(":visible")) {
                                var text = item.hasOwnProperty('mandatoryText') ? item.mandatoryText : "Please, check!";
                                $.notify(inputField, text, {position: "top right", autoHideDelay: 2000});
                            }
                            container.addClass('has-error');
                        }
                        return hasValue;
                    });
                }

                if (has(item, 'infoText')) {
                    var infoButton = $('<a class="infoText"></a>');
                    infoButton.on('click touch press', function (e) {
                        var button = $(e.currentTarget);
                        $.notify(button.attr('title'), 'info');
                    });
                    infoButton.attr('title', item.infoText);
                    container.append(infoButton);
                }


                if (has(item, 'copyClipboard')) {

                    var copyButton = $('<a class="copy-to-clipboard"><i class="fa fa-clipboard far-clipboard" aria-hidden="true"></i></a>');
                    copyButton.on('click', function (e) {
                        var button = $(e.currentTarget);
                        var data = container.formData(false);
                        copyToClipboard(data[item.name]);
                    });
                    container.append(copyButton);
                }

                container.append(inputField);
                //container.append(icon);

                return container;
            },
            label: function (item, declarations) {
                var label = $('<label/>');
                if (_.has(item, 'text')) {
                    label.html(item.text);
                }
                if (_.has(item, 'title')) {
                    label.html(item.title);
                }
                if (_.has(item, 'name')) {
                    label.attr('for', item.name);
                }
                return label;
            },
            checkbox: function (item, declarations, widget, input) {
                var container = $('<div class="form-group checkbox"/>');
                var label = $('<label/>');

                input = input ? input : $('<input type="checkbox"/>');

                input.data('declaration', item);

                label.append(input);

                if (has(item, 'name')) {
                    input.attr('name', item.name);
                }

                if (has(item, 'value')) {
                    input.val(item.value);
                }

                if (has(item, 'title')) {
                    label.append(item.title);
                }

                if (has(item, 'checked') && item.checked) {
                    input.attr('checked', "checked");
                }

                if (has(item, 'mandatory') && item.mandatory) {
                    input.data('warn', function () {
                        var isChecked = input.is(':checked');
                        if (isChecked) {
                            container.removeClass('has-error');
                        } else {
                            container.addClass('has-error');
                            if (input.is(':visible')) {
                                var text = item.hasOwnProperty('mandatoryText') ? item.mandatoryText : "Please confirm!";
                                $.notify(input, text, {position: "top left", autoHideDelay: 2000});
                            }

                        }
                        return isChecked;
                    });
                }

                container.append(label);

                if (has(item, 'infoText')) {
                    var infoButton = $('<a class="infoText">Info</a>');
                    infoButton.attr('title', item.infoText);
                    container.append(infoButton);
                }

                return container;
            },
            radio: function (item, declarations, widget) {
                var input = $('<input type="radio"/>');
                var container = declarations.checkbox(item, declarations, widget, input);
                container.addClass('radio');
                return container;
            },
            formGroup: function (item, declarations, widget) {
                var container = $('<div class="form-group"/>');
                if (has(item, 'children')) {
                    $.each(item.children, function (k, item) {
                        container.append(widget.genElement(item));
                    });
                }
                return container;
            },
            textArea: function (item, declarations, widget) {
                var inputField = $('<textarea class="form-control" rows="3"/>');
                var container = declarations.input(item, declarations, widget, inputField);
                container.addClass('textarea-container');

                inputField.data('declaration', item);
                return container;
            },
            select: function (item, declarations, widget) {
                var select = $('<select class="form-control"/>');
                var container = declarations.input(item, declarations, widget, select);
                var value = has(item, 'value') ? item.value : null;

                container.addClass('select-container');

                if (has(item, 'multiple') && item.multiple) {
                    select.attr('multiple', 'multiple');
                }

                if (has(item, 'options')) {
                    var isValuePack = _.isArray(_.first(item.options)) && _.size(_.first(item.options)) == 2;
                    _.each(item.options, function (title, value) {
                        if (isValuePack) {
                            value = title[0];
                            title = title[1];
                        } else if (_.isObject(title)) {
                            var a = _.toArray(title);
                            value = a[0];
                            title = a[1];
                        }

                        var option = $("<option/>");
                        option.attr('value', value);
                        option.html(title);
                        select.append(option);
                    });
                }

                window.setTimeout(function () {
                    select.val(value);
                    if (has(item, 'multiple') && item.multiple && (typeof select.select2 === 'function')) {
                        select.select2(item);
                    }
                }, 20);

                return container;
            },
            image: function (item, declarations, widget) {
                var image = $('<img src="' + (has(item, 'src') ? item.src : '') + '"/>');
                var subContainer = $("<div class='sub-container'/>");
                var container = declarations.input(item, declarations, widget, image);

                container.append(subContainer.append(image.detach()));
                container.addClass("image-container");

                if (has(item, 'enlargeImage') && item.enlargeImage) {
                    image.attr('tabindex', 0);
                    image.css('cursor', 'pointer');
                    image.on('keypress click', function (e) {
                        if (e.type !== 'click' && e.which && e.which !== 13) {
                            return
                        }

                        var bigImage = new Image();
                        bigImage.src = item.src;
                        bigImage.onload = function () {
                            var dialog = $('<div>');
                            var bImage = $('<img src="' + image.attr('src') + '"/>');
                            var _popupConfig = {
                                title: image.title ? image.title : 'Image',
                                width: bigImage.width
                            };
                            var maxHeight = $(window).height() - 100;
                            if (bigImage.height > maxHeight) {
                                _popupConfig.height = maxHeight;
                            }
                            dialog.popupDialog(_popupConfig);
                            bImage.css({
                                height: 'auto',
                                width: '100%',
                                'max-width': bigImage.width
                            });
                            dialog.append(bImage);
                        };
                    })
                }

                if (has(item, 'imageCss')) {
                    image.css(item['imageCss']);
                } else {
                    image.css({width: "100%"});
                }
                return container;
            },
            file: function (item, declarations, widget) {
                var input = $('<input type="hidden"  />');
                var fileInput = $('<input type="file" />');
                var container = declarations.input(item, declarations, widget, input);
                var defaultText = (has(item, 'text') ? item.text : "Select");
                var textSpan = '<span class="upload-button-text"><i class="fa fa-upload" aria-hidden="true"/> ' + defaultText + '</span>';
                var uploadButton = $('<span class="btn btn-success button fileinput-button">' + textSpan + '</span>');
                var buttonContainer = $("<div/>");
                var progressBar = $("<div class='progress-bar'/>");
                var eventHandlers = item.on ? item.on : {};

                if (has(item, 'accept')) {
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
                    if (filename.length <= len) {
                        return n;
                    }
                    filename = filename.substr(0, len) + (n.length > len ? '[...]' : '');
                    return filename + '.' + ext;
                }

                fileInput.fileupload({
                    dataType: 'json',
                    url: item.uploadHanderUrl,
                    formData: item.formData,
                    //sequentialUploads: true,
                    add: function (e, data) {
                        //console.log("added file", data, e);
                        data.submit();
                    },
                    progressall: function (e, data) {
                        var progress = parseInt(data.loaded / data.total * 100, 10);
                        progressBar.css({width: progress + "%"});
                        //progressBar.html(progress + "%");
                        if (eventHandlers.progressall) {
                            eval(eventHandlers.progressall);
                        }
                    },
                    always: function (e, data) {
                        if (eventHandlers.always) {
                            eval(eventHandlers.always);
                        }
                    },
                    done: function (e, data) {
                        if (eventHandlers.done) {
                            eval(eventHandlers.done);
                        }
                        progressBar.css({width: 0});
                    },
                    success: function (result, textStatus, jqXHR) {
                        if (eventHandlers.success) {
                            eval(eventHandlers.success);
                        }

                        if (result.files && result.files[0]) {
                            var fileInfo = result.files[0];
                            var img = container.closest('form').find('img[name="' + item.name + '"]');

                            if (fileInfo.error) {
                                $.notify(fileInfo.error, "error");
                                return;
                            }

                            if (fileInfo.name) {
                                buttonContainer.find('.upload-button-text').html('<i class="fa fa-check-circle-o far-check-circle" aria-hidden="true"/> ' + truncate(fileInfo.name, 10));
                                var newUploadFileInput = container.find('input[type="file"]')
                                    .attr('title', fileInfo.name)
                                    .attr('alt', fileInfo.name)
                                    .attr('label', fileInfo.name);
                            }

                            if (img.size()) {
                                img.attr('src', fileInfo.thumbnailUrl);
                            }
                            input.val(fileInfo.url);
                        }
                    }
                });

                return container;
            },
            tabs: function (item, declarations, widget) {
                var container = $('<div/>');
                var tabs = [];
                if (has(item, 'children')) {
                    $.each(item.children, function (k, subItem) {
                        var htmlElement = widget.genElement(subItem);
                        var tab = {
                            html: htmlElement
                        };

                        if (has(subItem, 'title')) {
                            tab.title = subItem.title;
                        }
                        tabs.push(tab);
                    });
                }
                container.tabNavigator({children: tabs});
                return container;
            },
            fieldSet: function (item, declarations, widget) {
                var fieldSet = $("<fieldset class='form-group'/>");

                if (has(item, 'title')) {
                    fieldSet.append(declarations.label(item, declarations));
                }
                if (has(item, 'legend')) {
                    fieldSet.append("<legend>" + item.legend + "</legend>");
                }

                if (has(item, 'children')) {
                    $.each(item.children, function (k, item) {
                        fieldSet.append(widget.genElement(item));
                    })
                }

                if (has(item, 'breakLine') && item.breakLine) {
                    fieldSet.append(declarations.breakLine(item, declarations, widget));
                }

                return fieldSet;
            },
            date: function (item, declarations, widget) {
                var inputHolder = declarations.input(item, declarations, widget);
                var input = inputHolder.find('> input');
                input.dateSelector(item);
                return inputHolder;
            },
            colorPicker: function (item, declarations, widget) {
                var container = $('<div class="form-group"/>');
                var inputHolder = declarations.input(item, declarations, widget);
                var label = inputHolder.find('> label');

                inputHolder.append('<span class="input-group-addon"><i></i></span>');
                inputHolder.addClass("input-group colorpicker-element colorpicker-component");
                container.prepend(label);
                container.append(inputHolder);
                inputHolder.find('> label').remove();

                if (item.value) {
                    item.color = item.value;
                }

                if (!item.hasOwnProperty("format")) {
                    item.format = "hex";
                }

                inputHolder.colorpicker(item);

                var input = inputHolder.find("input");
                input.addClass("form-control");
                input.on('changeValue', function () {
                    var clr = input.val();
                    inputHolder.colorpicker('setValue', clr);
                });

                return container;
            },
            slider: function (item, declarations, widget) {
                var container = $('<div class="form-group input-group slider-holder"/>');
                var inputHolder = declarations.input(item, declarations, widget);
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
                    range: "max",
                    min: 1,
                    max: 10,
                    value: 1,
                    step: 1,
                    slide: function (event, ui) {
                        input.val(ui.value);
                        label.find('> span').text(' ' + ui.value);
                    },
                    change: function (event, ui) {
                        var value = input.val();
                        label.find('> span').text(' ' + value);
                    }
                }, item));

                input.on('change', function () {
                    var value = input.val();
                    label.find('> span').text(' ' + value);
                    sliderRange.slider("value", value);
                });

                return container;
            },
            resultTable: function (item, declarations, widget) {
                var container = $("<div/>");
                $.each(['name'], function (i, key) {
                    if (has(item, key)) {
                        container.attr(key, item[key]);
                    }
                });

                return container
                    .data('declaration', item)
                    .resultTable($.extend({
                        lengthChange: false,
                        pageLength: 10,
                        searching: false,
                        info: true,
                        processing: false,
                        ordering: true,
                        paging: true,
                        selectable: false,
                        autoWidth: false
                    }, item));
            },
            digitizingToolSet: function (item, declarations, widget) {
                var $div = $("<div/>");
                $div.data('declaration', item);
                return $div.digitizingToolSet(item);
            },

            /**
             * Break line
             *
             * @param item
             * @param declarations
             * @param widget
             * @return {*|HTMLElement}
             */
            breakLine: function (item, declarations, widget) {
                return $("<hr class='break-line'/>");
            },

            /**
             * Map eleemnt.
             *
             * @param item
             * @param declarations
             * @param widget
             * @returns {*|HTMLElement}
             */
            map: function (item, declarations, widget) {
                var container = $("<div><div class='leaflat-map'/></div>");
                var tileLayerUrl = getVal(item, "tileLayerUrl", 'https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png');
                var zoomLevel = getVal(item, 'zoomLevel', 13);
                var viewPosition = getVal(item, 'viewPosition', [51.505, -0.09]);
                var maxZoom = getVal(item, 'maxZoom', 20);
                var popup = L.popup();
                L.Icon.Default.imagePath = "../../components/leaflet/images/";

                container.on('DOMNodeInsertedIntoDocument', function () {
                    var mapContainer = container.find('.leaflat-map');
                    mapContainer.css({
                        height: "100%",
                        width: '100%'
                    });

                    var map = window.lmap = L.map(mapContainer[0], {
                        trackResize: true,
                        inertia: true
                    }).setView(viewPosition, zoomLevel);
                    L.tileLayer(tileLayerUrl, {
                        maxZoom: getVal(item, 'maxZoom', 20),
                        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' + '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' + 'Imagery © <a href="http://mapbox.com">Mapbox</a>',
                        id: 'examples.map-i875mjb7'
                    }).addTo(map);
                    L.marker(viewPosition).addTo(map);
                    map.on('click', function (e) {
                        console.log("You clicked the map at " + e.latlng.toString());
                    });

                    container.closest('.popup-dialog').bind('popupdialogresize', function (e) {
                        map.invalidateSize();

                        console.log("resized")
                    });

                });

                container.data('declaration', item);
                return container;
            },

            /**
             *
             * @param item
             * @param declarations
             * @param widget
             */
            text: function (item, declarations, widget) {
                var text = $('<div class="text"/>');
                var container = declarations.input(item, declarations, widget, text);
                container.addClass('text');
                return container;
            },

            /**
             * Simple container
             *
             * @param item
             * @param declarations
             * @param widget
             */
            container: function (item, declarations, widget) {
                var container = $('<div class="form-group"/>');
                if (has(item, 'children')) {
                    $.each(item.children, function (k, item) {
                        container.append(widget.genElement(item));
                    })
                }
                return container;
            },

            /**
             * Simple accordion
             *
             * @param item
             * @param declarations
             * @param widget
             */
            accordion: function (item, declarations, widget) {
                var container = $('<div class="accordion"/>');
                if (has(item, 'children')) {
                    _.each(item.children, function (child, k) {
                        var pageContainer = $("<div class='container' data-id='" + k + "'/>");
                        var pageHeader = $("<h3 class='header' data-id='" + k + "'/>");

                        if (has(child, 'head')) {
                            pageHeader.append(widget.genElement(child.head));

                            // if(has(child.head, 'title')) {
                            //     pageHeader.append(widget.label(headItem));
                            // }
                            //
                            // if(has(child.head, 'children')) {
                            //     _.each(child.head.children, function(headItem) {
                            //         pageHeader.append(widget.genElement(headItem));
                            //     })
                            // }
                        }

                        if (has(child, 'content')) {
                            pageContainer.append(widget.genElement(child.content));
                        }

                        container.append(pageHeader);
                        container.append(pageContainer);
                    })
                }
                container.data('declaration', item);
                container.accordion(item);
                return container;
            }

        },

        /**
         * Constructor
         *
         * @private
         */
        _create: function () {
            this._setOptions(this.options);
        },

        /**
         * Generate element by declaration
         *
         * @param item declaration
         * @return jquery html object
         */
        genElement: function (item) {
            var widget = this;
            var type = has(widget.declarations, item.type) ? item.type : 'html';
            var declaration = widget.declarations[type];
            var element = declaration(item, widget.declarations, widget);

            if (has(item, 'cssClass')) {
                element.addClass(item.cssClass);
            }

            if (has(item, 'attr')) {
                $.each(item.attr, function (key, val) {
                    element.attr(key, val);
                });
            }

            if (typeof item == "object") {
                addEvents(element, item);
            }

            if (has(item, 'css')) {

                element.css(item.css);
            }

            element.data('item', item);

            if (has(item, 'mandatory')) {
                element.addClass('has-warning');
            }

            return element;
        },

        /**
         * Generate elements
         *
         * @param element jQuery object
         * @param children declarations
         */
        genElements: function (element, children) {
            var widget = this;
            $.each(children, function (k, item) {
                element.append(widget.genElement(item));
            })
        },

        /**
         * Set options
         *
         * @param options
         * @private
         */
        _setOptions: function (options) {
            var widget = this;
            var element = $(widget.element);

            if (has(options, 'type')) {
                element.append(widget.genElement(options));
            } else if (has(options, 'children')) {
                widget.genElements(element, options.children);
            }

            widget._super(options);
            widget.refresh();
        },

        /**
         * Refresh generated elements
         */
        refresh: function () {
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
    $.fn.updateSelect = function (values, idKey, valueKey) {
        var select = this;
        var val = select.val();
        select.empty();

        if (idKey && valueKey) {
            values = _.object(_.pluck(values, idKey), _.pluck(values, valueKey));
        }

        _.each(values, function (value, key) {
            select.append('<option value="' + key + '">' + value + '</option>');
        });

        select.val(val);
    };

    /**
     * Grabbed from here: http://jsfiddle.net/DkHyd/
     */
    $.fn.togglepanels = function (args) {
        return this.each(function () {
            $(this).addClass("ui-accordion ui-accordion-icons ui-widget ui-helper-reset")
                .find("h3")
                .addClass("ui-accordion-header ui-helper-reset ui-state-default ui-corner-top ui-corner-bottom")
                .hover(function () {
                    $(this).toggleClass("ui-state-hover");
                })
                .prepend('<span class="ui-icon ui-icon-triangle-1-e"></span>')
                .click(function (e) {
                    $(this)
                        .toggleClass("ui-accordion-header-active ui-state-active ui-state-default ui-corner-bottom")
                        .find("> .ui-icon").toggleClass("ui-icon-triangle-1-e ui-icon-triangle-1-s").end()
                        .next().slideToggle(0);

                    if (args.onChange) {
                        var title = $(e.currentTarget);
                        args.onChange(e, {
                            'title': title,
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


    var processResultTable = function (item) {

        var onCreateClick;
        var onEditClick;

        if (!item.hasOwnProperty('dataManagerLink')) {
            onCreateClick = function (e) {
                e.preventDefault();
                var item = $(this).next().data("item");
                var popup = item.popupItems;
                var table = $(this).siblings(".mapbender-element-result-table");
                var uniqueIdKey = item.dataStore.uniqueId;

                var feature = table.data('olFeature');
                var data = {};

                item.allowRemove = false;
                data['linkId'] = feature.getProperties()[item.dataStoreLink.uniqueId];
                data.item = item;
                data[uniqueIdKey] = null;
                widget._openEditDialog(data, popup, item, table);
                return false;
            };

            onEditClick = function (rowData, ui, e) {
                e.defaultPrevented && e.defaultPrevented();
                e.preventDefault && e.preventDefault();

                var table = ui.parents('.mapbender-element-result-table');
                var item = table.data('item');
                var popup = item.popupItems;
                var feature = table.data('olFeature');

                item.allowRemove = true;
                rowData.externalId = feature.getProperties()[item.dataStoreLink.uniqueId];

                widget._openEditDialog(rowData, popup, item, table);

                return false;
            };
        } else if (item.hasOwnProperty('dataManagerLink')) {
            var schemaName = item.dataManagerLink.schema;
            var fieldName = item.dataManagerLink.fieldName;
            var schemaFieldName = item.dataManagerLink.schemaFieldName;

            onCreateClick = function (e) {
                e.preventDefault && e.preventDefault();

                var dm = Mapbender.elementRegistry.listWidgets()['mapbenderMbDataManager'];
                withSchema(dm, schemaName, function (schema) {
                    dm._openEditDialog(schema.create());
                });

                return false;
            };

            onEditClick = function (rowData, ui, e) {
                e.defaultPrevented && e.defaultPrevented();
                e.preventDefault && e.preventDefault();

                var dm = Mapbender.elementRegistry.listWidgets()['mapbenderMbDataManager'];

                withSchema(dm, schemaName, function (schema) {
                    var dataItem = _.find(schema.dataItems, function (d) {
                        return d[schemaFieldName] === rowData[fieldName];
                    });
                    dm._openEditDialog(dataItem);
                });

                return false;
            };
        }

        var cloneItem = $.extend({}, item);
        cloneItem.isProcessed = true;
        item.type = "container";
        var button = {
            type: "button",
            title: "",
            cssClass: "fa fa-plus",
            click: onCreateClick
        };

        item.children = [button, cloneItem];

        var buttons = [];

        buttons.push({
            title: translate('feature.edit'),
            className: 'edit',
            onClick: onEditClick
        });

        cloneItem.buttons = buttons;


    }

})(jQuery);
