function startHandleBars() {
    Handlebars.registerHelper('times', function(n, block) {
        var accum = '';
        for (var i = 0; i < n; ++i)
            accum += block.fn(i);
        return accum;
    });
    Handlebars.registerHelper('iter', function(context, options) {
        var fn = options.fn,
            inverse = options.inverse;
        var ret = "";

        if (context && context.length > 0) {
            for (var i = 0, j = context.length; i < j; i++) {
                ret = ret + fn(_.extend({}, context[i], {
                    i: i,
                    iPlus1: i + 1
                }));
            }
        } else {
            ret = inverse(this);
        }
        return ret;
    });
    Handlebars.registerHelper('ifCond', function(v1, v2, options) {
        if (String(v1) === String(v2)) {
            return options.fn(this);
        }
        return options.inverse(this);
    });
    Handlebars.registerHelper("debug", function(optionalValue) {
        console.log("Current Context");
        console.log("====================");
        console.log(this);

        if (optionalValue) {
            console.log("Value");
            console.log("====================");
            console.log(optionalValue);
        }
    });
}

function getISODateTime(d) {
    // padding function
    var s = function(a, b) {
        return (1e15 + a + "").slice(-b)
    };

    // default date parameter
    if (typeof d === 'undefined') {
        d = new Date();
    };

    // return ISO datetime
    return d.getFullYear() + '-' +
        s(d.getMonth() + 1, 2) + '-' +
        s(d.getDate(), 2) + ' ' +
        s(d.getHours(), 2) + ':' +
        s(d.getMinutes(), 2) + ':' +
        s(d.getSeconds(), 2);
}

function render(tmplName, tmplData) {
    if (!render.tmpl_cache) {
        render.tmpl_cache = {};
    }

    if (!render.tmpl_cache[tmplName]) {
        var tmplDir = "/assets/templates";
        var tmplUrl = tmplDir + '/' + tmplName + '.html';

        var tmplString;
        $.ajax({
            url: tmplUrl,
            method: 'GET',
            async: false,
            success: function(data) {
                tmplString = data;
            }
        });

        render.tmpl_cache[tmplName] = _.template(tmplString);
    }

    return Handlebars.compile(render.tmpl_cache[tmplName]())(tmplData);
    //return render.tmpl_cache[tmplName](tmplData);
}

function checkNIF(nif) {
    var c;
    var checkDigit = 0;
    if (nif && nif != null && nif.length == 9) {
        c = nif.charAt(0);
        if (c == '1' || c == '2' || c == '5' || c == '6' || c == '8' || c == '9') {
            checkDigit = c * 9;
            for (i = 2; i <= 8; i++) {
                checkDigit += nif.charAt(i - 1) * (10 - i);
            }
            checkDigit = 11 - (checkDigit % 11);
            if (checkDigit >= 10) {
                checkDigit = 0;
            }
            if (checkDigit == nif.charAt(8)) {
                return true;
            }
        }
    }
    return false;
}

function nextDay(day) {
    var d = new Date;
    (day = (Math.abs(+day || 0) % 7) - d.getDay()) < 0 && (day += 7);
    return day && d.setDate(d.getDate() + day), d;
};

function toEuros(val) {
    return parseFloat(Math.round(val * 100) / 100).toFixed(2);
}

function sortByCreatedAt(a, b) {
    return a.createdAt > b.createdAt;
}

function sortByRowColumn(a, b) {
    if (Number(a.linha) == Number(b.linha)) {
        return Number(a.coluna) - Number(b.coluna);
    }
    return Number(a.linha) - Number(b.linha);
}

function getServerDate() {
    var result = $.now();
    $.ajax({
        async: false,
        dataType: 'json',
        timeout: 20000,
        contentType: 'application/json',
        data: JSON.stringify({}),
        url: "/now",
        success: function(data) {
            result = data.time;
        },
        error: function(jqXHR, exception) {
            globalAjaxError(jqXHR, exception);
        }
    });

    return result;

}