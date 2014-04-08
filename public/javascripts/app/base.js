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