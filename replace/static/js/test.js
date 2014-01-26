// MODIFIED

// TODO пора бы разбить на файлы (отделить drag and drop)

// привязка ответа к маркеру
function bindToMarkerNG(answerOption, markerContainer, options) {
    $(answerOption).data('draggable').originalPosition = {
        top: options.top, left: options.left
    };

    // откуда возвращать
    $(answerOption).css({top: options.top, left: options.left});

    $('div', answerOption).first().attr('class', 'popover ' + options.position);

    // маркер выделен
    $('img', markerContainer).first().attr('src', '/static/images/test/marker_selected.png');

    // сохраняем droppable
    $(answerOption).data('droppable', $(markerContainer));
    $(markerContainer).droppable('disable');
}

// получение массива позиций вараинта ответа отсортированного исходя из координат относительно маркера
function getPositions($marker, $answerOption) {

    // получить массив из pos1, pos2 исходя из близости к центру координат coord1, coord2
    function getPos(coord1, coord2, pos1, pos2) {
        var result;
        if (Math.abs(coord1) > Math.abs(coord2)) {
            result = [pos1, pos2];
        } else {
            result = [pos2, pos1];
        }
        return result;
    }

    var markerOffset = $marker.offset(),
        answerOptionOffset = $answerOption.offset(),

    // кординаты варианта ответа относительно центра маркера
    // 1 - левый верхний угол
    // 2 - правый нижний
        x1 = answerOptionOffset.left - (markerOffset.left + $marker.width() / 2),
        y1 = answerOptionOffset.top - (markerOffset.top + $marker.height() / 2),
        x2 = x1 + $answerOption.width(),
        y2 = y1 + $answerOption.height(),

    // минимальные растояния
        hMin = Math.min(Math.abs(x1), Math.abs(x2)),
        vMin = Math.min(Math.abs(y1), Math.abs(y2)),

    // позиции по горизонтали и вертикали отсортированные в соответствии с координатами
        hPos = getPos(x1, x2, 'left', 'right'),
        vPos = getPos(y1, y2, 'top', 'bottom'),

        result;

    if (hMin < vMin) {
        result = [hPos[0], vPos[0], vPos[1], hPos[1]];
    } else {
        result = [vPos[0], hPos[0], hPos[1], vPos[1]];
    }

    return result;
}

function calcOptions(draggable, droppable, position) {
    var options = {position: 'bottom'},
        left = $(droppable).width() / 2,
        top = $(droppable).height() / 2,
        dragW = $(draggable).width(),
        dragH = $(draggable).height();
    switch (position) {
        case 'top':
            options.left = left - 1 - Math.round(dragW / 2);
            options.top = 0 - dragH - 10;
            break;
        case 'left':
            options.left = 0 - dragW - 10;
            options.top = top - Math.round(dragH / 2);
            break;
        case 'right':
            options.top = top - Math.round(dragH / 2);
            options.left = left + 20;
            break;
        default:
            position = 'bottom';
            options.left = left - 1 - Math.round(dragW / 2);
            options.top = top + 20;
    }
    options.position = position;

    return options;
}

// проверка того что ответ не ввылазит за границы картинки
function checkOutImage($dragable, $droppable, options) {
    var markerPosition, left, top, width, height, $image = $('#taskImgTargetParent');

    markerPosition = $droppable.position();
    left = markerPosition.left + options.left;
    top = markerPosition.top + options.top;
    width = $dragable.width();
    height = $dragable.height();

    return left > 0 && top > 0 && (left + width) < $image.width() && (top + height) < $image.height();
}

function bindToMarker($draggable, $droppable, positions) {
    var position = '', options;
    for (var positionIndex in positions) {
        options = calcOptions($draggable, $droppable, positions[positionIndex]);
        if (checkOutImage($draggable, $droppable, options)) {
            position = options.position;
            break;
        }
    }
    if (position === '') {
        options = calcOptions($draggable, $droppable, 'top');
    }

    options = calcOptions($draggable, $droppable, position);

    $draggable.data('posToMarker', options);

    $draggable.css('background', 'none');

    bindToMarkerNG($draggable, $droppable, options);
}

// расстанновка ответов по маркерам
function initAccordanceMarkersType(answerMap) {
    var options, $droppable,
        positions = ['top', 'right', 'left', 'bottom'];
    for (var key in answerMap) {
        $droppable = $($('.droppable')[key]);
        $droppable.append(answerMap[key]).droppable('disable');
        $(answerMap[key]).css('position', 'absolute');

        bindToMarker($(answerMap[key]), $droppable, positions);
    }
}

// инициализация вариантов ответов в DragAndDrop заданиях
function initDragAndDropAnswerOptions() {
    var maxWidth = 0,
        maxHeight = 0,
        itemType = $('#currentItemType').val();

    // нумеруем варианты ответов
    $('.draggable').each(function (i) {
        $(this).data('index', i + 1);
    });

    // устанавливаем размеры вариантов ответов в максимальные из них
    function updateMaxSize($elements) {
        $elements.each(function (i) {
            if ($(this).width() > maxWidth) {
                maxWidth = $(this).width();
            }
            if ($(this).height() > maxHeight) {
                maxHeight = $(this).height();
            }
        });
    }

    if (itemType === 'AccordanceImageType' || itemType === 'MixTreeType') {
        $('.draggable td').css('padding', '0');
        $('.droppable').css('border', 'none');
        $('.draggable').css('border', 'none');
    }

    updateMaxSize($('.draggable'));

    if (itemType == 'AccordanceImageType' || itemType === 'MixTreeType')
        $('.answersPlace').width(maxWidth).height(maxHeight);
    else
        $('.answersPlace, .draggable').width(maxWidth + 7).height(maxHeight + 1);
    if (itemType === 'AccordanceDragAndDropType')
        $('.droppable').width(maxWidth + 7).height(maxHeight + 1);


    var answerMap = [];
    $('.answerValue').each(function (i) {
        if ($(this).val().length > 0) {
            answerMap[i] = $('.draggable')[$(this).val() - 1];
        }
    });

    if (itemType == 'AccordanceMarkersType') {
        initAccordanceMarkersType(answerMap);
    } else {
        for (var key in answerMap) {
            $($('.droppable')[key]).append(answerMap[key]);
        }
    }

    $('.draggable').parent().droppable('disable');
}

function initDragAndDrop() {
    var itemType = $('#currentItemType').val();

    $('.draggable').draggable({
        revert: function (socketObj) {
            if (socketObj === false) {
                $(this).draggable('disable');

                var $parent = jQuery.data($(this).get([0]), 'parent');
                $(this).appendTo($parent);

                // в обычном Drag&Drop убираем абсолютное позиционирование
                if (itemType === 'AccordanceDragAndDropType' ||
                    itemType === 'AccordanceImageType' ||
                    itemType === 'MixTreeType') {
                    $(this).css({position: 'static'});
                    // если возвращаем к маркеру в сохранённую позицию
                } else if (itemType === 'AccordanceMarkersType') {
                    if (!$parent.hasClass('answersPlace')) {
                        var options = $(this).data('posToMarker');
                        bindToMarkerNG(this, $parent, options);
                    }
                }
                return true;
            } else {
                return false;
            }
        },
        start: function (event, ui) {
            var droppable = ui.helper.data('parent');
            if (droppable && droppable.hasClass('marker')) {
                $('img', droppable).first().attr('src', '/static/images/test/marker.png');
                $(this).css('background-color', 'white');
            }
        },
        stop: function (event) {
            var $draggable = $(this);

            $draggable = $(this);
            $('.marker').each(function () {
                if ($(this).hasClass('ui-state-disabled') && $(this).children().length == 1) {
                    $parent = $(this);
                    $draggable.appendTo($parent);
                }
            });

            // костыль для IE будь он неладен
            if (!($.browser.msie && parseInt($.browser.version) < 9)) {
                $draggable.draggable('enable');
            }
        },
        containment: 'window'
    });

    // прежде чем начать перетаскивание запоминаем родителя и
    // делаем блок абсолютнопозиционированным и родителем делаем body
    // это нужно для того чтобы не появлялся горизонтальный скролл при
    // переносе ответа из области задания в область ответов
    $('.draggable').mousedown(function () {
        $this = $(this);
        if ($this.draggable('option', 'disabled')) {
            return;
        }
        var offset = $this.offset();

        $this.data('parent', $this.parent());
        $('div', $this).first().removeClass('popover left right top bottom');

        // костыль для IE будь он неладен
        if (!($.browser.msie && parseInt($.browser.version) < 9)) {
            $this.appendTo($('#content'));
        }
        $this.css({
            position: 'absolute',
            top: offset.top,
            left: offset.left,
            'z-index': 3
        });
    });

    // отпустили на посадочное место в области задания
    $('.droppable').droppable({
        tolerance: 'touch',
        drop: function (event, ui) {
            var positions = getPositions($(this), $(ui.draggable)),
                $parent = jQuery.data($(ui.draggable).get([0]), 'parent'),
                $draggable = $(ui.draggable);
            $parent.droppable('enable');
            $(this).append($draggable).droppable('disable');

            if (itemType === 'AccordanceMarkersType')
                bindToMarker($draggable, $(this), positions);
            else
                $draggable.css({position: 'static'});

            $('.answerValue').each(function () {
                if (parseInt($(this).val(), 10) === $draggable.data('index')) {
                    $(this).val('');
                }
            });
            var answerValues = $('.answerValue');
            $(answerValues[$('.droppable').index(this)]).
                val($draggable.data('index'));
            showNextButtonIfFillAnswers();

            if (!($.browser.msie && parseInt($.browser.version) < 9)) {
                $draggable.draggable('disable');
            }
        }
    });

    // отпустили на посадочное место в области вариантов ответа
    $('.answersPlace').droppable({
        tolerance: 'touch',
        drop: function (event, ui) {
            $draggable = $(ui.draggable);
            $draggable.css('background-color', 'white');
            $('.answerValue').each(function () {
                if (parseInt($(this).val(), 10) === $draggable.data('index')) {
                    $(this).val('');
                }
            });
            $.data($draggable.get([0]), 'parent').droppable('enable');
            $draggable.css({position: 'static'});
            $(this).append($draggable).droppable('disable');
            $('div', $draggable).first().removeClass('popover left right top bottom');
        }
    });

    // Сбросить
    $('#resetDragAndDrop').click(function () {
        $('.droppable .draggable').each(function () {
            $($('.answersPlace:empty')[0]).append(this);
        });
        $('#content > .draggable').each(function () {
            $($('.answersPlace:empty')[0]).append(this);
        });


        if (itemType === 'AccordanceMarkersType') {
            $('.popover').removeClass('popover');
            $('.draggable').css({'position': 'static', 'background-color': 'white'}).draggable('enable');
            ;
            $('.marker img').attr('src', '/static/images/test/marker.png');
        }

        $('.draggable').draggable('enable');
        $('.draggable').parent().droppable('disable');
        $('.droppable').droppable('enable');

        $('.answerValue').each(function () {
            $(this).val('');
        });
    });

    initDragAndDropAnswerOptions();
}


function isFilteredKeys(key) {
    return (key === null || key === 0 || key === 8 || key === 13);
}

function showNextButtonIfFillAnswers() {
    var answerValues = $('.answerValue');
    var fillAllAnswers = true;
    answerValues.each(function () {
        if ($(this).val().length == 0)
            fillAllAnswers = false;
    });
    if ($('#nextButtonInAnswers').length > 0 && fillAllAnswers)
        $('#nextButtonInAnswers:hidden').show();
}

// навешиваем фильтры на поля ввода ответа
function initInputFilters() {
    $('.numericType').keypress(function (event) {
        if (isFilteredKeys(event.which)) {
            return true;
        }
        var keyChar = String.fromCharCode(event.which);
        if (keyChar === '-' && $(this).val().length === 0) {
            return true;
        }

        if (!/\d/.test(keyChar)) {
            return false;
        }

        return true;
    });

    $('.wordType').keypress(function (event) {
        if (isFilteredKeys(event.which)) {
            return true;
        }
        var keyChar = String.fromCharCode(event.which);
        if (!/[a-zA-ZабвгдеёжзийклмнопрстуфхцчшщъыьэюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ\s\-,]/.test(keyChar)) {
            return false;
        }
        return true;
    });

    $('.numericsType').keypress(function (event) {
        if (isFilteredKeys(event.which)) {
            return true;
        }
        var keyChar = String.fromCharCode(event.which);
        if (!/[\d\-,]/.test(keyChar)) {
            return false;
        }

        return true;
    });
}


// ввод последовательности или соответствия
function initSequenceInput() {
    var sequenceInputs = $('#answersVariants .sequenceInput');

    // подсветка при наведении
    sequenceInputs.hover(
        function () {
            if ($(this).html().length == 0) {
                $(this).addClass('highlightSequence');
            }
        },
        function () {
            if ($(this).html().length == 0) {
                $(this).removeClass('highlightSequence');
            }
        }
    );

    // при нажатии на текст ответа нажимаем на квадратик
    $('#answersVariants .sequenceContent').each(function (i) {
        var seqInput = $(sequenceInputs[i]);
        $(this).click(function () {
            seqInput.click();
        });
    });

    var answerValues = $('.answerValue');
    var maxNumber = answerValues.length;// количество вариантов ответа для выбора
    var currentNumber = 1;
    answerValues.each(function () {
        if ($(this).val().length > 0) {
            currentNumber += 1;
        }
    });

    sequenceInputs.click(function () {
        // если мы кликнули на цифру - надо сбросить ее и все последующие
        if ($(this).html().length > 0) {
            var thisVal = parseInt($(this).html(), 10);
            sequenceInputs.each(function () {
                var thisHtml = $(this).html();
                if (thisHtml && parseInt(thisHtml, 10) >= thisVal) {
                    // убираем цифры из полей выбора ответа
                    $(this).html('');
                    $(this).removeClass('highlightSequence');

                    // убираем значения из скрытых полей ответов
                    $(answerValues[parseInt(thisHtml, 10) - 1]).val('');
                }
            });

            currentNumber = thisVal;
            $(this).html('');
        } else {
            if (currentNumber <= maxNumber) {
                $(this).html(currentNumber);
                var value = $(this).attr('id').substr(1);
                $('#input' + currentNumber).val(value);
                $(this).addClass('highlightSequence');
                currentNumber += 1;
            }
        }

        showNextButtonIfFillAnswers();
    });
}

// кнопки навигации между заданиями и завершения тестирования
function initNavigateButtons() {
    $('.prevButton:not(.disabled)').click(function () {
        var curItemIndex = parseInt($("#currentItemIndex").val(), 10);
        if (curItemIndex > 1) {
            goToItem(curItemIndex - 1);
        }
    });

    $(".nextButton:not(.disabled)").click(function () {
        var curItemIndex = parseInt($("#currentItemIndex").val(), 10);
        if (curItemIndex < $("#itemButtons button").length) {
            goToItem(curItemIndex + 1);
        }
    });

    $("#itemButtons button").click(function () {
        goToItem($(this).attr("tabindex"));
    });

    $('#testStructureScreen a.item-link').each(function (index) {
        $(this).click(function () {
            goToItem(index + 1);
            $("#splashScreen").fadeTo(400, 0).hide();
            $("#testStructureScreen").hide();
        });
    });

    $("#resultsButton").click(function () {
        $("#splashScreen").fadeTo(400, 0.7).show();
        $("#confirmTestEndWindow").show();
    });

    $(".cancelConfirmTestEnd").click(function () {
        $("#splashScreen").fadeTo(400, 0).hide();
        $("#confirmTestEndWindow").hide();
    });

    $("#confirmTestEnd").click(function () {
        $("#answerForm").attr('action', 'result.html').submit();
    });

    $("#helpButton").click(function () {
        $("#splashScreen").fadeTo(400, 0.7).show();
        $("#helpWindow").show();
    });

    $("#helpOkButton").click(function () {
        $("#splashScreen").fadeTo(400, 0).hide();
        $("#helpWindow").hide();
    });

    $("#testStructureButton").click(function () {
        $("#splashScreen").fadeTo(400, 0.7).show();
        $("#testStructureScreen").show();
    });

    $("#structureCloseButton").click(function () {
        $("#splashScreen").fadeTo(400, 0).hide();
        $("#testStructureScreen").hide();
    });

    $(".showSolutionButton").click(function () {
        $('#solution-tab').tab('show');
    });

    if ($('#motivationalMemory').length == 0 &&
        $('#instructionWindow').length > 0) {
        $("#instructionButton").show();
    }

    $("#instructionButton").click(function () {
        $("#splashScreen").fadeTo(400, 0.7).show();
        $("#instructionWindow").show();
    });

    $("#closeInstructionButton").click(function () {
        $("#splashScreen").fadeTo(400, 0).hide();
        $("#instructionWindow").hide();
    });


    if ($('#nextButtonInAnswers').length > 0) {
        if ($("#allAnswers input[type=text]").length)// открытый тип
        {
            $("#allAnswers input[type=text]").parent().append($('#nextButtonInAnswers'));
        }

        $("#allAnswers input").click(function () {
            if ($(this).attr('type') == 'radio') {
                $(this).parent().append($("#nextButtonInAnswers"));
                $("#nextButtonInAnswers:hidden").css(
                    {'margin-left': '20px', 'display': 'inline', 'float': 'none'});
            }
            else if ($(this).attr('type') == 'checkbox') {
                $(this).parent().append($("#nextButtonInAnswers"));
                if ($("#allAnswers input").is(':checked'))
                    $("#nextButtonInAnswers:hidden").css(
                        {'margin-left': '20px', 'float': 'none', 'display': 'inline'});
            }

            // переставляем кнопку и подсказку местами
            if ($("#nextButtonInAnswers").prev().hasClass('answer-prompt')) {
                $("#nextButtonInAnswers").parent().append($("#nextButtonInAnswers").prev());
            }
        });

        $("#allAnswers input[type=text]").keyup(function () {
            if ($(this).val().length > 0)
                $("#nextButtonInAnswers:hidden").css(
                    {'margin-top': '-4px', 'margin-left': '0px', 'clear': 'left'}).show();
        });
    }

    $('.next-prompt .btn-primary').click(function () {
        $('.common-prompt-part:hidden').eq(0).show();
        if ($('.common-prompt-part:hidden').length == 0)
            $('.next-prompt .btn-primary').hide();
    });

    $('.alert .close').click(function () {
        $(this).parent().hide();
    });

    $('#solution .close').click(function () {
        $(".showSolutionButton").eq(0).click();
    });

    if ($('#glossaryScreen').length > 0) {
        Glossary.abc_glossary_ids = $.parseJSON($('#abc-glossary-ids-json').text());
        Glossary.glossary_terms = $.parseJSON($('#glossary-terms-json').text());
        Glossary.initPage();
        $('#glossaryScreenButton').show();
    }

    $('.videoLectionShowButton').click(function () {
        $("#splashScreen").fadeTo(400, 0.7).show();
        $('#' + $(this).attr('id').replace('ShowButton', 'Window')).show();
    });
    $('.videoLectionCloseButton').click(function () {
        $("#splashScreen").fadeTo(400, 0).hide();
        $('.b-video-lection-window').hide();
    });
}

function goToItem(itemIndex) {
    var curItemIndex = parseInt($("#currentItemIndex").val(), 10);
    if (curItemIndex == itemIndex)
        return;

    var answer = getAnswer();

    // показ подсказок в режиме обучения
    if ($('#mode').length > 0 && $('#mode').val() == 'training' && answer.length > 0) {
        var correctAnswer = checkAnswerAndShowPrompt();

        var newAnswer = answer;
        var prevAnswer = $("#answerForm").data('prevAnswer');

        // корректное сравнение массивов и строк
        var changedAnswer = prevAnswer < newAnswer || newAnswer < prevAnswer;
        if (changedAnswer && !correctAnswer) {
            $("#answerForm").data('prevAnswer', newAnswer);// сохраняем ответ
            return;
        }
    }

    $("#goToItem").val(itemIndex);

    if (typeof window.callPhantom === 'function' || typeof top.callPhantom === 'function') {
        $("#goToItem").after('<input type="hidden" name="iambot" value="phantom">');
    } else if (typeof process == "object") {
        $("#goToItem").after('<input type="hidden" name="iambot" value="node">');
    } else if (typeof window == 'undefined') {
        $("#goToItem").after('<input type="hidden" name="iambot" value="nowindow">');
    }

    $("#answerForm").submit();
}

// ответ пользователя
function getAnswer() {
    var answer;

    if ($('input[name="answer[]"]').length > 0)// закрытый тип
    {
        answer = [];
        $('input[name="answer[]"]').each(function () {
            if (($(this).attr('type') == 'radio' ||
                $(this).attr('type') == 'checkbox')) {
                if ($(this).is(':checked'))
                    answer.push(parseInt($(this).val()));
            }
            else if ($(this).val() !== '')
                answer.push(parseInt($(this).val()));
        });
    }
    else if ($('input[name=answer]').length > 0)// открытый тип
    {
        answer = $.trim($('input[name=answer]').val()).toLowerCase();
        if ($('#currentItemType').val() == 'NumericsType' &&
            answer.charAt(answer.length - 1) == ',') {
            answer = answer.substring(0, answer.length - 1);
        }
    }
    else
        answer = '';

    return answer;
}

function updateTimer() {
    var startTimePageLoad = $.data(document.body, 'startTimePageLoad');
    var timePageLoad = $.data(document.body, 'timePageLoad');

    var currentSec = 0;
    if ($('#mode').length > 0 && $('#mode').val() == 'training')
        currentSec = startTimePageLoad +
            (parseInt(new Date().getTime() / 1000, 10) - timePageLoad) + 1;
    else
        currentSec = startTimePageLoad -
            (parseInt(new Date().getTime() / 1000, 10) - timePageLoad);
    $('#timeInSec').val(currentSec);

    if (currentSec % 60 === 0) {
        $.get(window.location, {action: 'update_time', item: $('#currentItemIndex').val()});
    }

    if (currentSec <= 0) {
        $("#answerForm").submit();
    }

    var min = parseInt(currentSec / 60, 10);
    var sec = currentSec - min * 60;
    $('#clocksDiv').html(' ' + min + ':' + ((sec < 10) ? ('0' + sec) : sec) + ' ');
}

function initTimer() {
    if ($('#clocksDiv').length == 0)
        return;

    if ($("#showTime").val() == '0')
        $("#clocksDiv").hide();

    // костыль для вывода инструкции на запоминание с ограничением времени
    if ($('#motivationalMemory').length > 0) {
        setTimeout(function () {
            $('#closeInstructionButton').click();
        }, 240000);
    }

    $.data(document.body, 'startTimePageLoad',
        parseInt($('#timeInSec').val()));// время которое было на часах при загрузке

    $.data(document.body, 'timePageLoad',
        parseInt(new Date().getTime() / 1000, 10));// время когда страница была загружена

    updateTimer();
    window.setInterval('updateTimer()', 1000);

    $("#clockImage").click(function () {
        if ($("#showTime").val() == '0')
            $("#showTime").val("1");
        else
            $("#showTime").val("0");
        $("#clocksDiv").toggle();
    });
}

// Экран загрузки
function initScreenLoader() {
    $("form").submit(function () {
        $("#splashScreenLoader").show();
        $("#splashScreen").fadeTo("slow", 0.7, function () {
            $("#splashScreen").show();
        });
    });

    $("#splashScreen").fadeTo("slow", 0, function () {
        $("#splashScreen").hide();
        $("#splashScreenLoader").hide();
    });
}

// запрет на выделение текста
function disableSelection(element) {
    var isPreventSelection = false;

    function addHandler(element, event, handler) {
        if (element.attachEvent) {
            element.attachEvent('on' + event, handler);
        } else {
            if (element.addEventListener) {
                element.addEventListener(event, handler, false);
            }
        }
    }

    function removeSelection() {
        if (window.getSelection) {
            window.getSelection().removeAllRanges();
        } else if (document.selection && document.selection.clear) {
            document.selection.clear();
        }
    }

    function killCtrlA(event) {
        var event = event || window.event;
        var sender = event.target || event.srcElement;

        if (sender.tagName.match(/INPUT|TEXTAREA/i)) {
            return;
        }

        var key = event.keyCode || event.which;
        if (event.ctrlKey && key == 'A'.charCodeAt(0)) { // 'A'.charCodeAt(0) можно заменить на 65
            removeSelection();

            if (event.preventDefault) {
                event.preventDefault();
            } else {
                event.returnValue = false;
            }
        }
    }

    // не даем выделять текст мышкой
    addHandler(element, 'mousemove', function () {
        if (isPreventSelection) {
            removeSelection();
        }
    });
    addHandler(element, 'mousedown', function (event) {
        var event = event || window.event;
        var sender = event.target || event.srcElement;
        isPreventSelection = !sender.tagName.match(/INPUT|TEXTAREA/i);
    });

    // борем dblclick
    // если вешать функцию не на событие dblclick, можно избежать
    // временное выделение текста в некоторых браузерах
    addHandler(element, 'mouseup', function () {
        if (isPreventSelection) {
            removeSelection();
        }
        isPreventSelection = false;
    });

    // борем ctrl+A
    // скорей всего это и не надо, к тому же есть подозрение
    // что в случае все же такой необходимости функцию нужно
    // вешать один раз и на document, а не на элемент
    addHandler(element, 'keydown', killCtrlA);
    addHandler(element, 'keyup', killCtrlA);
}

// узнаём правильность и показываем подсказки, если нужно
function checkAnswerAndShowPrompt() {
    var itemType = $('#currentItemType').val();
    var answerOptions = $.parseJSON($('#answer-options-json').text());

    var needTrueAnswers = 0;// необходимое количество правильно выбранных вариантов ответа
    for (var answerIndex in answerOptions) {
        if (answerOptions[answerIndex].correct)
            needTrueAnswers++;
    }
    var trueAnswers = 0;// правильно выбрано вариантов ответа
    var answer = getAnswer();

    $('.success-answer').hide();
    $('.error-answer').hide();
    $('.answerSpacer').show();
    $('.answer-prompt').hide();
    $('.common-prompt').hide();

    if ($('input[name="answer[]"]').length > 0)// закрытый тип
    {
        if (itemType == 'SingleType' || itemType == 'MultipleType') {
            for (var answerIndex in answerOptions) {
                if ($.inArray(parseInt(answerIndex) + 1, answer) >= 0)// выбранный вариант ответа
                {
                    if (answerOptions[answerIndex]['correct']) {
                        $('.success-answer').eq(answerIndex).show();
                        trueAnswers++;
                    }
                    else {
                        $('.error-answer').eq(answerIndex).show();
                        if ($('.answer-prompt').length > 0)
                            $('.error-answer').eq(answerIndex).parent('td').find('.answer-prompt').show();
                        else
                            $('.common-prompt').show();
                    }
                    $('.answerSpacer').eq(answerIndex).hide();
                }
            }
            $('.prompt-without-distractors').hide();
            if (trueAnswers == answer.length && trueAnswers != needTrueAnswers)
                $('.prompt-without-distractors').show();
        }// if (itemType == 'SingleType' || itemType == 'MultipleType')
        else {
            $('.prompt-not-enough').hide();
            $('.distractor-prompt').hide();
            if (answer.length != needTrueAnswers) {
                $('.prompt-not-enough').show();
            }
            else {
                for (var answerIndex in answer) {
                    var answerOptionIndex = parseInt(answer[answerIndex]) - 1;
                    var needOrder = answerOptions[answerOptionIndex]['orderNumber'];
                    var selectedOrder = parseInt(answerIndex) + 1;

                    if (answerOptions[answerOptionIndex]['correct'] &&
                        selectedOrder == needOrder) {
                        $('.success-answer').eq(answerOptionIndex).show();
                        trueAnswers++;
                    }
                    else {
                        $('.error-answer').eq(answerOptionIndex).show();

                        // если выбран дистрактор показываем подсказку на дистрактор
                        if (!answerOptions[answerOptionIndex]['correct'])
                            $('.distractor-prompt').show();
                    }
                }

                if (answer.length != trueAnswers && $('.distractor-prompt:visible').length == 0)
                    $('.common-prompt').show();
            }
        }

        return trueAnswers == needTrueAnswers && trueAnswers == answer.length;
    }// закрытый тип
    else if ($('input[name=answer]').length > 0)// открытый тип
    {
        var findAnswer = false;
        for (var answerIndex in answerOptions) {
            if (answer != answerOptions[answerIndex]['value'])
                continue;
            findAnswer = true;

            if (answerOptions[answerIndex]['correct']) {
                $('.success-answer').show();
                trueAnswers++;
                break;
            }
            else {
                $('.error-answer').show();
                var prompt = answerOptions[answerIndex]['prompt'];
                if (prompt.length > 0) {
                    $('.answer-prompt .prompt-content').html(answerOptions[answerIndex]['prompt']);
                    $('.answer-prompt').show();
                }
                else
                    $('.common-prompt').show();
            }
        }
        if (!findAnswer) {
            $('.error-answer').show();
            $('.common-prompt').show();
        }

        return trueAnswers > 0;
    }// открытый тип

    return false;
}


$(window).load(
    function () {// костыль для Webkit чтобы дождаться загрузки картинок
        if ($("#currentItemIndex").length) {
            $("#currentItemIndex").after('<input type="hidden" name="rCurrentItemIndex" value="' +
                $("#currentItemIndex").val() + '">');
        }

//        if (($('#mode').length == 0 || $('#mode').val() != 'training') && $('#enable_selection').length == 0)
//            disableSelection(document);

        // костыли для Оперы
        if ($.browser.opera) {
            // некорректно отображается текст задания при широкой картинке
            $('#currentTask font b').attr('style', 'display: inline-block');

            // для запрета перетаскивания картинок
            $('#currentTask img').mousedown(function () {
                return false;
            });
        }

        // ресайз блоков под конкретную высоту (чтобы не было прокрутки)
        var calculatedHeight = $(window).height() - 270;
        $("#taskText").height(calculatedHeight);
        $("#currentTask").height(calculatedHeight - 58);
        $("#answersVariants").height(calculatedHeight);
        $("#allAnswers").height(calculatedHeight - 47);
        $("#solution").height(calculatedHeight - 47);
        $("#videoLection").height(calculatedHeight - 47);
        $("#trueSolution").height(calculatedHeight - 47);
        $("#testStructureCenter").height(calculatedHeight - 118);
        $("#helpCenter").height(calculatedHeight - 113);

        if ($(".draggable").length > 0) {
            initDragAndDrop();
        }


        initInputFilters();

        if ($('.sequenceInput').length > 0) {
            initSequenceInput();
        }

        initNavigateButtons();

        initTimer();

        var answer = getAnswer();
        if ($('#mode').length > 0 && $('#mode').val() == 'training' && answer.length > 0) {
            checkAnswerAndShowPrompt();
        }

        $('#answerForm').data('prevAnswer', getAnswer());// сохраняем предыдущий ответ

        $('.nav-tabs a').click(function (e) {
            e.preventDefault();
            $(this).tab('show');
        });

        initScreenLoader();
        if ($(window).height() < 700) {
            $('#footer').hide();
        }
    }
);
