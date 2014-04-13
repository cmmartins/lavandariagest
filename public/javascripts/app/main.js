var db;

var typeCaracteristica = 'Caracteristica';
var typeArtigo = 'Artigo';
var typeTrx = 'Trx';

var currentTRX = undefined;
var currentTotal = 0;
var currentSubTotal = 0;
var currentDesconto = 0;
var isEngomar = false;
var views = {
    artigos: function map(doc) {
        if (doc.type == typeArtigo) {
            emit(doc, null);
        }
    },
    caracteristicas: function map(doc) {
        if (doc.type == typeCaracteristica) {
            emit(doc, null);
        }
    },
    trx: function map(doc) {
        if (doc.type == typeTrx && doc.status != 'owe') {
            emit(doc, null);
        }
    },
    cartaDeve: function map(doc) {
        if (doc.type == typeTrx && doc.status == "owe") {
            emit(doc.order, doc);
        }
    },
    nonDeleted: function(doc) {
        return !doc._deleted;
    }
};

var setup = {
    caracteristicas: function() {
        var d = $.Deferred();
        var caracteristicas = ['Roto', 'Repetir', 'Botões', 'Alt. Cores', 'Lixivia', 'Borbotos', 'Cliente Avisado', 'Resp. Cliente', 'Sem Vinco', 'Com Vinco',
            'Cinto', 'Nodoas', 'Fecho', 'Rasgado', 'Fios Puxados', 'Queimado', 'Encolhido', 'Descosido', 'Bolôr', 'Outro'
        ];

        db.query({
            map: views.caracteristicas
        }, {
            reduce: false,
            include_docs: true
        }, function(err, results) {
            if (results.rows.length == 0) {
                for (var i = 0, sizeC = caracteristicas.length; i < sizeC; i++) {
                    var caract = caracteristicas[i];
                    var obj = {
                        _id: typeCaracteristica + "/" + i,
                        id: caract,
                        type: typeCaracteristica,
                        nome: caract
                    };
                    db.put(obj).then(function(newObject) {
                        console.log(newObject, 'adicionado')
                    });
                }

            } else {
                console.log('Caracteristicas já carregadas.')
            }
            d.resolve();
        });
        return d.promise();
    },
    artigos: function() {
        var d = $.Deferred();
        db.query({
            map: views.artigos
        }, {
            reduce: false,
            include_docs: true
        }, function(err, results) {
            if (results.rows.length == 0) {
                var csv_as_array = [];
                $.ajax({
                    url: "assets/data/produtos.csv",
                    aync: false,
                    success: function(csvd) {
                        csv_as_array = $.csv.toArrays(csvd);
                    },
                    dataType: "text",
                    complete: function() {
                        //first line are headers
                        for (var i = 1, sizeC = csv_as_array.length; i < sizeC; i++) {
                            var prodArr = csv_as_array[i];
                            var obj = {
                                _id: typeArtigo + "/" + i,
                                id: i,
                                nome: prodArr[2],
                                linha: prodArr[0],
                                coluna: prodArr[1],
                                precoSemIva: prodArr[3],
                                iva: prodArr[4],
                                precoFinal: prodArr[5],
                                precoEngomar: prodArr[6],
                                precoEngomarSemIva: prodArr[7],
                                type: typeArtigo,
                                cor: prodArr[8] == 's'
                            };
                            db.put(obj).then(function(newObject) {
                                console.log(newObject, 'adicionado')
                            });
                        }
                    }
                });
            } else {
                console.log('Produtos ja carregados')
            }
            d.resolve();

        });
        return d.promise();
    }
}

$(function() {
    Array.prototype.contains = function(k) {
        for (var p in this)
            if (this[p] === k)
                return true;
        return false;
    }
    $.fn.textfill = function(maxFontSize) {
        maxFontSize = parseInt(maxFontSize, 10);
        return this.each(function() {
            var ourText = $("span", this),
                parent = ourText.parent(),
                maxHeight = parent.height(),
                maxWidth = parent.width(),
                fontSize = parseInt(ourText.css("fontSize"), 10),
                multiplier = maxWidth / ourText.width(),
                newSize = (fontSize * (multiplier - 0.05));
            ourText.css(
                "fontSize", (maxFontSize > 0 && newSize > maxFontSize) ?
                maxFontSize :
                newSize
            );
        });
    };

    startHandleBars();


    db = new PouchDB('lavandaria');

    //TODO: Obter ip servidor couchdb
    PouchDB.replicate('lavandaria', 'http://localhost:5984/lavandaria', {
        live: true,
        onChange: function() {
            console.log("replication value changed")
        },
        complete: function() {
            console.log("replication complete")
        },
        filter: views.nonDeleted
    });
    main();
    FastClick.attach(document.body);
});


function main() {

    var $posContainer = $('.globalContent');
    var $globalContainer = $('.container');

    maximizeAvailableArea($globalContainer, $posContainer);

    var globalObject = {};

    setupBaseData().then(collectCaracteristicas(globalObject)).then(collectArtigos(globalObject)).then(function() {
        renderPOSContainer($posContainer, $globalContainer, globalObject);
        attachListeners();

    });
}

function fechoCaixa() {
    //ask backend to close
    //if everything OK, delete local done trx, keep the owe
    db.query({
        map: views.trx
    }, {
        reduce: false,
        include_docs: false
    }, function(err, results) {
        if (results.rows.length > 0) {
            for (var i = 0, tot = results.rows.length; i < tot; i++) {
                var doc = results.rows[i];
                db.remove(doc.key, function(err2, response) {
                    console.log("Remove Locally TRX", doc.key, err2, response);
                });
            }
        }
    });
}

function attachListeners() {
    $('.pos-order-number').blur(function(evt) {
        //TODO: validate if TRX IS undefined, if not, show options
        //else
        var $inp = $(evt.target);

        if ($inp.val().length > 0) {
            var order = $inp.val();
            //Verify if exists owe, and load trx

            db.query({
                map: views.cartaDeve
            }, {
                key: order,
                reduce: false,
                include_docs: true
            }, function(err, results) {
                if (results.rows.length > 0) {
                    //load
                    currentTRX = results.rows[0].doc;
                    calcTotal();
                    $('.pos-total .descricao').html("Crédito");
                    //todo
                    //load NIF
                    //load linhas
                    for (var i = 0, tot = currentTRX.linhas.length; i < tot; i++) {
                        var linha = currentTRX.linhas[i];
                        if (linha.tipo == "artigo") {
                            toVisor(false, true, false, false, false, linha.entregaDia);
                            if (linha.defeito && linha.defeito.length > 0)
                                toVisor(false, false, true, false, false, linha.defeito);
                            var copiedLinha = {};
                            $.extend(copiedLinha, linha);
                            copiedLinha.attr = function(name) {
                                if (name == 'data-nome') {
                                    return copiedLinha.artigoNome;
                                } else if (name == 'data-precoFinal' || name == 'data-precoengomar') {
                                    return copiedLinha.precoUnitario;
                                }
                            }
                            toVisor(true, false, false, false, false, copiedLinha);
                        } else if (linha.tipo == "desconto") {
                            toVisor(false, false, false, false, true, linha);
                        } else if (linha.tipo == "subtotal") {
                            toVisor(false, false, false, true, false, linha.valor);
                        }
                    }
                } else {
                    var data = new Date().getTime();
                    currentTRX = {
                        _id: typeTrx + "/" + data,
                        order: $inp.val(),
                        clienteNif: 999999998,
                        clienteNome: 'Cliente Final',
                        data: data,
                        linhas: [],
                        total: 0.00,
                        totalIva: 0.00,
                        totalSemIVa: 0.00,
                        type: typeTrx,
                        status: 'ongoing' /*'aborted','ongoing','owe','done'*/
                    }
                    db.put(currentTRX)
                        .then(function(newObject) {
                            currentTRX._rev = newObject.rev;
                            console.log(newObject, 'TRX iniciada')
                        });
                }
            });

        } else {
            //alert('O número de ordem é obrigatório');
        }
    });
    $('.btn-dia').click(function(evt) {
        var $btn = $(evt.target);
        if (currentTRX && currentTRX.linhas.length > 0 && (currentTRX.linhas[currentTRX.linhas.length - 1].tipo == 'artigo' && !currentTRX.linhas[currentTRX.linhas.length - 1].artigoId)) {
            return;
        }
        currentTRX.linhas.push({
            tipo: 'artigo',
            entrega: nextDay($btn.attr('data-id')),
            entregaDia: $btn.text()
        });
        toVisor(false, true, false, false, false, $btn.text());
    });

    $('.pos-caracteristica').click(function(evt) {
        var caract = $(evt.target);
        addDefeito(caract.text());
    });
    $('.btn-artigo').click(function(evt) {
        if (currentTRX && currentTRX.linhas.length > 0 && currentTRX.linhas[currentTRX.linhas.length - 1].tipo == 'artigo') {

            var art = $(evt.target);
            var ultimaLinha = currentTRX.linhas[currentTRX.linhas.length - 1];
            if (art.text() == "SERVIÇO LAVANDARIA" || art.text().indexOf("(M2)") > 0) {
                //SHOW MODAL WITH INPUT
                $('.modal-desconto .input-desconto-modal').attr("data-unidade", "€");
                $('.modal-desconto').modal({
                    fadeDuration: 250,
                    clickClose: true
                });

                $('.modal-desconto').on('modal-ok', function(evt, obj) {

                    ultimaLinha.artigoId = art.attr('data-id');
                    ultimaLinha.artigoNome = art.attr('data-nome');
                    ultimaLinha.precoUnitario = Number(obj.valor);
                    ultimaLinha.ivaIncluido = Number(obj.valor) * Number(art.attr('data-iva'));
                    art.attr('data-precofinal', toEuros(ultimaLinha.precoUnitario));
                    calcTotal();
                    toVisor(true, false, false, false, false, art);
                    art.attr('data-precofinal', '');
                    $('.modal-desconto').off('modal-ok');
                    isEngomar = false;
                });
            } else {

                ultimaLinha.artigoId = art.attr('data-id');
                ultimaLinha.artigoNome = art.attr('data-nome');
                if (!isEngomar) {
                    ultimaLinha.precoUnitario = Number(art.attr('data-precofinal'));
                    ultimaLinha.ivaIncluido = Number(art.attr('data-precofinal')) - Number(art.attr('data-precosemiva'));
                } else {
                    ultimaLinha.precoUnitario = Number(art.attr('data-precoengomar'));
                    ultimaLinha.ivaIncluido = Number(art.attr('data-precoengomar')) - Number(art.attr('data-precoengomarsemiva'));
                    //art.attr('data-precoFinal', art.attr('data-precoengomar'));
                }

                calcTotal();
                toVisor(true, false, false, false, false, art);
                if (isEngomar) {
                    addDefeito('Engomar');
                    isEngomar = false;
                }
            }


        } else {
            //TODO: alert
        }

    });
    $('.btn-op.cancelar').click(function(evt) {
        if (currentTRX.status == 'ongoing') {
            currentTRX.status = 'aborted';
            db.post(currentTRX, function(error, newObject) {
                console.log(currentTRX, 'TRX abortada');
                window.location.reload();
            });

        }

    });
    $('.btn-op.limpar').click(function(evt) {
        if (currentTRX.status != 'ongoing') {
            window.location.reload();
        }

    });
    $('.btn-op.liquido').click(function(evt) {
        if (currentTRX.status == 'ongoing' || currentTRX.status == 'owe') {
            currentTRX.status = 'done';
            db.put(currentTRX,
                function(error, newObject) {
                    console.log(currentTRX, 'TRX finalizada');
                    //MANDAR IMPRIMIR, callback
                    //--QUE FAZER? RELOAD?
                    blockPOS();
                    $.ajax({
                        type: "POST",
                        dataType: 'json',
                        contentType: 'application/json',
                        data: JSON.stringify(currentTRX),
                        url: "/print/receipt",
                        success: function(data) {
                            console.log(data);
                        }
                    });
                });
        }
    });
    $('.btn-op.fechocaixa').click(function(evt) {
        $.ajax({
            type: "POST",
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify({}),
            url: "/lavandaria/fecho",
            success: function(data) {
                console.log(data);
            }
        });
    });

    $('.btn-op.deve').click(function(evt) {
        if (currentTRX.status == 'ongoing') {
            currentTRX.status = 'owe';
            db.put(currentTRX, function(error, newObject) {
                console.log(currentTRX, 'TRX finalizada como devedor');
                //MANDAR IMPRIMIR, callback
                //--QUE FAZER? RELOAD?
                blockPOS();
            });


        }

    });
    $('.btn-op.imprimir').click(function(evt) {
        //MANDAR IMPRIMIR, callback
        //--QUE FAZER? RELOAD?

    });
    $('.btn-op.gaveta').click(function(evt) {
        //MANDAR ABRIR GAVETA, callback
        //--QUE FAZER? RELOAD?

    });
    $('.btn-op.engomar').click(function(evt) {
        isEngomar = true;
    });
    $('.btn-op.subtotal').click(function(evt) {
        doSubTotal();
    });
    $('.btn-op.desconto').click(function(evt) {
        $('.modal-desconto .input-desconto-modal').attr("data-unidade", "%");
        $('.modal-desconto').modal({
            fadeDuration: 250,
            clickClose: true
        });

        $('.modal-desconto').on('modal-ok', function(evt, obj) {
            doDesconto({
                percentagem: Number(obj.valor) / 100
            });
            $('.modal-desconto').off('modal-ok');
        });
    });

    $('.modal-desconto .btn-desconto').click(function(evt) {
        var $curr = $('.input-desconto-modal');
        var un = $curr.attr("data-unidade");
        if ($curr.attr("data-desc") == "0") {
            $curr.attr("data-desc", $(evt.currentTarget).text());
            $('.input-desconto-modal').text($(evt.currentTarget).text() + " " + un);
        } else {
            var val = $curr.attr("data-desc");
            $curr.attr("data-desc", val + '' + $(evt.currentTarget).text());
            $('.input-desconto-modal').text($curr.attr("data-desc") + " " + un);
        }
    });
    $('.modal-desconto .btn-desconto-x').click(function(evt) {
        var $curr = $('.input-desconto-modal');
        var un = $curr.attr("data-unidade");
        $curr.attr("data-desc", 0);
        $('.input-desconto-modal').text(0 + " " + un);
    });
    $('.modal-desconto .btn-desconto-cancelar').click(function(evt) {
        var $curr = $('.input-desconto-modal');
        var un = $curr.attr("data-unidade");
        $curr.attr("data-desc", 0);
        $('.input-desconto-modal').text(0 + " ");
        $.modal.close();
    });
    $('.modal-desconto .btn-desconto-ok').click(function(evt) {
        var $curr = $('.input-desconto-modal');
        var un = $curr.attr("data-unidade");
        $('.modal-desconto').trigger('modal-ok', {
            valor: $curr.attr("data-desc")
        });
        $curr.attr("data-desc", 0);
        $('.input-desconto-modal').text(0 + " ");
        $.modal.close();
    });
}

function blockPOS() {
    $('.btn-pos').attr('disabled', 'true');
    $('.btn-op.limpar').removeAttr('disabled');
    $('.btn-op.imprimir').removeAttr('disabled');

}

function resetPOS() {
    currentTRX = undefined;
    currentTotal = 0;
    currentDesconto = 0;
    currentSubTotal = 0;
    isEngomar = false;

    //clear order
    $('.pos-order-number').val("");
    //clear NIF
    $('.pos-cliente').val("");
    //clear POS lines
    var $visor = $('.pos-visor-container');
    $visor.empty();
    $('.pos-total .valor').text("€ " + toEuros(currentTotal));
}

function addDefeito(caract) {
    if (currentTRX && currentTRX.linhas.length > 0) {
        var ultimaLinha = currentTRX.linhas[currentTRX.linhas.length - 1];
        if (ultimaLinha.defeito && ultimaLinha.defeito.indexOf(caract) < 0) {
            ultimaLinha.defeito = ultimaLinha.defeito + ', ' + caract;
        } else {
            ultimaLinha.defeito = caract;
        }
        toVisor(false, false, true, false, false, ultimaLinha.defeito);
    }
}

function calcTotal() {
    currentTotal = 0;
    for (var i = 0, tot = currentTRX.linhas.length; i < tot; i++) {
        var linha = currentTRX.linhas[i];
        if (linha.tipo == 'artigo') {
            currentTotal += linha.precoUnitario;
            //ivaIncluido
        } else if (linha.tipo == 'desconto') {
            //assume-se que a linha anterior é um subtotal
            currentTotal -= linha.valor;
        }
    }
    currentTRX.total = currentTotal;
    currentTRX.totalIva = currentTotal * 0.23;
    currentTRX.totalSemIVa = currentTotal - (currentTotal * 0.23);
    $('.pos-total .valor').text("€ " + toEuros(currentTotal));
}


function doSubTotal() {
    currentTRX.linhas.push({
        tipo: 'subtotal',
        valor: currentTotal
    });
    toVisor(false, false, false, true, false, currentTotal);
}

function removeLinha(pos) {
    if (currentTRX && currentTRX.linhas.length > 0) {

        var $visor = $('.pos-visor-container');

        //verificar se há descontos aplicados e subtotais a remover, colleccionar
        var toRemove = [pos - 1];
        for (var i = pos - 1, tot = currentTRX.linhas.length; i++; i < tot) {
            var elem = currentTRX.linhas[i];
            if (elem && (elem.tipo == 'subtotal' || elem.tipo == 'desconto'))
                toRemove.push(i);
        }
        for (var i = toRemove.length - 1; i >= 0; i--) {
            currentTRX.linhas.splice(toRemove[i], 1);
            var $linha = $visor.find('.linha-artigo[data-pos="' + i + '"]').last();
            $linha.remove();
        }
        isEngomar = false;
        calcTotal();
    }
}

function doDesconto(obj) {
    if (currentTRX.linhas && currentTRX.linhas.length > 0) {
        if (currentTRX.linhas[currentTRX.linhas.length - 1].tipo != 'subtotal')
            doSubTotal();
        var lastLinha = currentTRX.linhas[currentTRX.linhas.length - 1];
        obj.valor = lastLinha.valor * obj.percentagem;
        currentTRX.linhas.push({
            tipo: 'desconto',
            valor: obj.valor,
            percentagem: obj.percentagem
        });

        toVisor(false, false, false, false, true, obj);
    }
}

function toVisor($artigo, $dia, $caracteristica, $subtotal, $desconto, obj) {
    var $visor = $('.pos-visor-container');
    var $linha = $visor.find('.linha-artigo').last();
    if ($dia) {
        var $newRow = $('<div class="row-fluid row-linha-pos linha-artigo" data-pos="' + currentTRX.linhas.length + '"><div class="span12 linha"><a class="span1 btn-remover" data-pos="' + currentTRX.linhas.length + '">X</a><div class="span5 descricao"></div><div class="span3 extra">' + obj + '</div><div class="span3 valor"></div></div></div>');
        $visor.append($newRow);
        $newRow.find('.btn-remover').click(function(evt) {
            if (currentTRX && currentTRX.linhas.length > 0) {
                var pos = $(evt.target).attr('data-pos');
                removeLinha(pos);
            }
        });
    } else if ($artigo) {
        if ($linha)
            $linha.find('.descricao').html(obj.attr('data-nome'));
        if (!isEngomar) {
            $linha.find('.valor').html(obj.attr('data-precoFinal'));
        } else {
            $linha.find('.valor').html(obj.attr('data-precoengomar'));
        }
        calcTotal();
    } else if ($caracteristica) {
        var $caracts = $linha.find('.linhacaracteristica');
        if ($caracts.length > 0)
            $caracts.last().html(obj);
        else {
            var $desc = $linha.find('.linha');
            $desc.before('<div class="span12 linhacaracteristica">' + obj + '</div>');
        }

    } else if ($subtotal) {
        var $newRow = $('<div class="row-fluid row-linha-pos linha-subtotal" data-pos="' + currentTRX.linhas.length + '"><div class="span12 linha"><div class="span5 descricao">Sub-total</div><div class="span3 extra"></div><div class="span3 valor">' + toEuros(obj) + '</div></div></div>');
        $visor.append($newRow);

    } else if ($desconto) {
        var $newRow = $('<div class="row-fluid row-linha-pos linha-desconto" data-pos="' + currentTRX.linhas.length + '"><div class="span12 linha"><div class="span5 descricao">Desconto</div><div class="span3 extra">' + Math.round(obj.percentagem * 100 * 100) / 100 + '%</div><div class="span3 valor">' + toEuros(obj.valor) + '</div></div></div>');
        $visor.append($newRow);
        calcTotal();

    }
}


function setupBaseData() {
    var d = $.Deferred();
    setup.caracteristicas().then(setup.artigos).then(function() {
        d.resolve();
    });
    return d.promise();
};




function collectCaracteristicas(obj) {
    var dfd = new jQuery.Deferred();
    db.query({
        map: views.caracteristicas
    }, {
        reduce: false,
        include_docs: true
    }, function(err, results) {
        if (results.rows.length > 0) {
            var row1 = [];
            var row2 = [];
            for (var i = 0, sizeC = results.rows.length; i < sizeC; i++) {
                if (i < 10)
                    row1.push(results.rows[i].doc);
                else
                    row2.push(results.rows[i].doc);
            }
            obj.caracteristicas1 = row1;
            obj.caracteristicas2 = row2;
            dfd.resolve(obj);
        }
    });

    return dfd.promise();

}

function collectArtigos(obj) {
    var dfd = new jQuery.Deferred();
    db.query({
        map: views.artigos
    }, {
        reduce: false,
        include_docs: true
    }, function(err, results) {

        if (results.rows.length > 0) {
            var artigos = [];
            var rows = [];
            results.rows.forEach(function(artigo) {
                artigos.push(artigo.doc);
                if (!rows.contains(Number(artigo.doc.linha)))
                    rows.push(Number(artigo.doc.linha));
            });
            artigos.sort(sortByRowColumn);
            rows.sort();
            obj.artigos = artigos;
            obj.artigosRows = rows;
            dfd.resolve(obj);
        }
    });

    return dfd.promise();

}

function maximizeAvailableArea(global, pos) {
    global.css('width', '100%');
    $('.hero-unit').hide();
    pos.css('width', '100%');
    pos.css('height', '100%');
}



function renderPOSContainer(pos, global, globalTemplateObject) {
    var rendered_pos = render('pos', globalTemplateObject);
    pos.append(rendered_pos);

    $('.btn-pos').textfill({
        maxFontPixels: 40
    });

    $('.numbersOnly').keypress(function(event) {
        // Backspace, tab, enter, end, home, left, right
        // We don't support the del key in Opera because del == . == 46.
        var controlKeys = [8, 9, 13, 35, 36, 37, 39];
        // IE doesn't support indexOf
        var isControlKey = controlKeys.join(",").match(new RegExp(event.which));
        // Some browsers just don't raise events for control keys. Easy.
        // e.g. Safari backspace.
        if (!event.which || // Control keys in most browsers. e.g. Firefox tab is 0
            (49 <= event.which && event.which <= 57) || // Always 1 through 9
            (48 == event.which && $(this).attr("value")) || // No 0 first digit
            isControlKey) { // Opera assigns values for control keys.
            return;
        } else {
            event.preventDefault();
        }
    });
}