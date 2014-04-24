var db;

var typeCaracteristica = 'Caracteristica';
var typeArtigo = 'Artigo';
var typeTrx = 'Trx';

var currentTRX = undefined;
var currentTotal = 0;
var currentSubTotal = 0;
var currentDesconto = 0;
var isEngomar = false;
var wasOwe = false;
var isRepetir = false;

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
    onGoing: function map(doc) {
        if (doc.type == typeTrx && doc.status == 'ongoing') {
            emit(doc, null);
        }
    },
    cartaDeve: function map(doc) {
        if (doc.type == typeTrx && doc.status == 'ongoing')
            emit(doc.order, doc);
    },
    nonDeleted: function(doc) {
        return !doc._deleted;
    },
    designCartasDeve: {
        _id: '_design/cartas',
        views: {
            deve: {
                map: 'function (doc) { if (doc.type == "Trx" && doc.status == "owe") ' +
                    '{ emit(doc.order, doc); } }'
            },
            ongoing: {
                map: 'function (doc) { if (doc.type == "Trx" && doc.status == "ongoing") ' +
                    '{ emit(doc, null); } }'
            },

        }
    },
    designArtigos: {
        _id: '_design/artigos',
        views: {
            all: {
                map: 'function (doc) { if (doc.type == "Artigo") ' +
                    '{ emit(doc, null); } }'
            }
        }
    },
    designCaracteristicas: {
        _id: '_design/caracteristicas',
        views: {
            all: {
                map: 'function (doc) { if (doc.type == "Caracteristica") ' +
                    '{ emit(doc, null); } }'
            }
        }
    }
};


$(function() {
    NProgress.start();
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


    db = new PouchDB('http://lavandaria:jorge19@' + window.location.hostname + ':5984/lavandaria');
    db.info(function(err, info) {
        console.log(err, info);
    });

    db.post(views.designCartasDeve, function(err, info) {
        console.log("designCartasDeve", err, info);
    });
    db.post(views.designArtigos, function(err, info) {
        console.log("designArtigos", err, info);
    });
    db.post(views.designCaracteristicas, function(err, info) {
        console.log("designCaracteristicas", err, info);
    });


    db.replicate.to('http://lavandaria:jorge19@' + window.location.hostname + ':5984/lavandaria', {
        live: true,
        onChange: function(val) {
            $('footer .status').html("TO SERVER OK " + getISODateTime(new Date()));
        }
    });
    /*    db.replicate.from('http://lavandaria:jorge19@' + window.location.hostname + ':5984/lavandaria', {
        live: true,
        onChange: function(val) {
            $('footer .status').html("TO SERVER OK " + getISODateTime(new Date()));
        },
        filter: views.nonDeleted
    });*/
    //DELETE ongoing
    db.query('cartas/ongoing', {
        include_docs: false
    }, function(err, results) {
        if (results && results.rows && results.rows.length > 0) {
            for (var i = 0, tot = results.rows.length; i < tot; i++) {
                var doc = results.rows[i];
                db.remove(doc.key, function(err2, response) {
                    console.log("Remove Locally TRX Ongoing", doc.key, err2, response);

                });
            }
        }
    });
    main();

});


function main() {

    var $posContainer = $('.globalContent');
    var $globalContainer = $('.container');

    maximizeAvailableArea($globalContainer, $posContainer);


    //setupBaseData().then(collectCaracteristicas(globalObject)).then(collectCaracteristicas(globalObject)).then(function() {
    $.when(collectCaracteristicas(), collectArtigos()).then(function(a, b) {
        var globalObject = $.extend({}, a, b);
        renderPOSContainer($posContainer, $globalContainer, globalObject);
        attachListeners();
        //FastClick.attach(document.body);
        blockPOS();
        NProgress.done();
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

function setNif() {
    var nif = 999999998;
    var nifNome = 'Cliente Final';
    var nifTemp = $('.pos-cliente').html();
    if (nifTemp.length > 0 && nifTemp != 'Contribuinte') {
        var nifSplit = nifTemp.split(" # ");
        if (nifSplit.length > 1) {
            nif = nifSplit[0];
            nifNome = nifSplit[1];
        } else {
            nif = nifTemp;
        }
    }
    if (currentTRX) {
        currentTRX.clienteNif = nif;
        currentTRX.clienteNome = nifNome;

    }
}

function attachListeners() {
    $('.pos-cliente').on('click', $.debounce(1000, true, function(evt) {
        var $inp = $(evt.target);
        //SHOW MODAL WITH INPUT
        $('.modal-desconto').off('modal-ok');
        $('.modal-desconto .input-desconto-modal').attr("data-unidade", "");
        $('.modal-desconto').modal({
            fadeDuration: 50,
            clickClose: false,
            showClose: false
        });
        $('.modal-desconto').on('modal-ok', function(evt, obj) {
            var nif = obj.valor;
            $inp.html(nif);

            if (nif.length > 0) {
                if (checkNIF(nif)) {
                    $inp.removeClass('error');
                    $inp.addClass('ok');
                    $.ajax({
                        dataType: 'json',
                        timeout: 20000,
                        method: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify({
                            nif: nif
                        }),
                        url: "/lavandaria/nif",
                        success: function(data) {
                            var obj = data;
                            if (obj.result && obj.result == "success") {
                                $inp.html(obj.nif.nif + " # " + obj.nif.nome);
                                setNif();

                            }
                            nameEditionOn();
                        },
                        error: function(jqXHR, exception) {
                            globalAjaxError(jqXHR, exception);
                        }
                    });
                } else {
                    $inp.removeClass('ok');
                    $inp.addClass('error');
                }
                if (currentTRX) {

                }
            }

        });
    }));
    $('.pos-order-number').on('click', $.debounce(1000, true, function(evt) {
        var $inp = $(evt.target);
        blockPOS();
        //SHOW MODAL WITH INPUT
        $('.modal-desconto .input-desconto-modal').attr("data-unidade", "");
        $('.modal-desconto').modal({
            fadeDuration: 50,
            clickClose: false,
            showClose: false
        });
        $('.modal-desconto').on('modal-ok', function(evt, obj) {
            var ordem = obj.valor;
            resetPOS();
            $inp.html(ordem);

            if (ordem.length == 0) {
                resetPOS();
            } else {
                NProgress.start();
                db.query('cartas/deve', {
                    key: ordem,
                    limit: 1
                }, function(err, results) {
                    NProgress.done();
                    unblockPOS();
                    if (results.rows.length > 0) {
                        //load

                        currentTRX = results.rows[0].value;
                        if (currentTRX.clienteNif != 999999998)
                            $('.pos-cliente').html(currentTRX.clienteNif + " # " + currentTRX.clienteNome);
                        calcTotal();
                        $('.pos-total .descricao').html("Crédito");
                        wasOwe = true;
                        //todo
                        //load NIF
                        //load linhas
                        for (var i = 0, tot = currentTRX.linhas.length; i < tot; i++) {
                            var linha = currentTRX.linhas[i];
                            if (linha.tipo == "artigo") {
                                toVisor(false, true, false, false, false, linha);
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
                        var data = getServerDate();

                        currentTRX = {
                            _id: typeTrx + "/" + data,
                            order: ordem,
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
                        setNif();
                        db.put(currentTRX)
                            .then(function(newObject) {
                                currentTRX._rev = newObject.rev;
                                console.log(newObject, 'TRX iniciada')
                            });
                    }
                });
            }
            $('.modal-desconto').off('modal-ok');
        });
    }));
    $('.btn-dia').click(function(evt) {
        var $btn = $(evt.target);
        if (currentTRX && currentTRX.linhas.length > 0 && (currentTRX.linhas[currentTRX.linhas.length - 1].tipo == 'artigo' && !currentTRX.linhas[currentTRX.linhas.length - 1].artigoId)) {
            return;
        }
        var obj = {
            tipo: 'artigo',
            entrega: nextDay($btn.attr('data-id')),
            idlinha: $.now(),
            entregaDia: $btn.text()
        };
        currentTRX.linhas.push(obj);
        toVisor(false, true, false, false, false, obj);
    });

    $('.pos-caracteristica').click(function(evt) {
        var caract = $(evt.target);
        if (caract.text() == 'Outro') {
            caract = prompt("Introduza por favor a Característica", "");

            addDefeito(caract);
        } else {
            addDefeito(caract.text());
        }

    });
    $('.btn-artigo').click(function(evt) {
        if (currentTRX && currentTRX.linhas.length > 0 && currentTRX.linhas[currentTRX.linhas.length - 1].tipo == 'artigo') {

            var art = $(evt.target);
            var ultimaLinha = currentTRX.linhas[currentTRX.linhas.length - 1];
            if (Number(art.attr('data-precofinal')) < 1 || art.text() == "SERVIÇO LAVANDARIA" || art.text().indexOf("(M2)") > 0) {
                //SHOW MODAL WITH INPUT
                $('.modal-desconto .input-desconto-modal').attr("data-unidade", "€");
                $('.modal-desconto').modal({
                    fadeDuration: 50,
                    clickClose: false,
                    showClose: false
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

                if (ultimaLinha.artigoNome && ultimaLinha.artigoNome == art.attr('data-nome')) {
                    //repetir linha
                    currentTRX.linhas.push({
                        tipo: 'artigo',
                        entrega: ultimaLinha.entrega,
                        idlinha: $.now(),
                        entregaDia: ultimaLinha.entregaDia
                    });
                    ultimaLinha = currentTRX.linhas[currentTRX.linhas.length - 1];
                    toVisor(false, true, false, false, false, ultimaLinha);
                }
                ultimaLinha.artigoId = art.attr('data-id');
                ultimaLinha.artigoNome = art.attr('data-nome');
                if (isRepetir) {
                    ultimaLinha.precoUnitario = 0;
                    ultimaLinha.ivaIncluido = 0;
                    art.attr('data-precofinal', 0);
                    art.attr('data-precosemiva', 0);
                    isRepetir = false;
                } else if (!isEngomar) {
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

        } else {
            window.location.reload();
        }

    });
    $('.btn-op.limpar').click(function(evt) {
        resetPOS();

    });
    $('.btn-op.liquido').click(function(evt) {
        if (currentTRX.status == 'ongoing' || currentTRX.status == 'owe') {
            var wasOwe = (currentTRX.status == 'owe');
            currentTRX.status = 'done';
            db.put(currentTRX,
                function(error, newObject) {
                    console.log(currentTRX, 'TRX finalizada');
                    //MANDAR IMPRIMIR, callback
                    //--QUE FAZER? RELOAD?
                    blockPOS();
                    print(true, true, wasOwe);
                });
        }
    });
    $('.btn-op.fechocaixa').click(function(evt) {
        var fecharConfirm = prompt("Por favor introduza a senha de fecho de caixa", "");

        if (fecharConfirm != null && fecharConfirm == 'antonio19') {

            $.ajax({
                type: "POST",
                timeout: 20000,
                dataType: 'json',
                contentType: 'application/json',
                data: JSON.stringify({
                    preview: true
                }),
                url: "/lavandaria/fecho",
                success: function(data) {
                    //show detail


                    var $modalBody = $('.modal-fecho .body');
                    $modalBody.empty();

                    var $zcontent = '<h3>Z1</h3><table><tr><th>Artigo</th><th style="text-align:right;">N. Peças</th><th style="text-align:right;min-width:120px;">Valor (&euro;)</th></tr>';
                    var artigos = data.artigos;
                    for (var key in artigos) {
                        if (artigos.hasOwnProperty(key)) {
                            var artigo = artigos[key];
                            $zcontent += '<tr><td>' + key + '</td><td style="text-align:right;">' + artigo.count + '</td><td style="text-align:right;">' + toEuros(artigo.total) + '</td></tr>';
                        }
                    }
                    $zcontent += '<tr><td style="font-weight:bold;">Total</td><td style="text-align:right;">' + data.totalPecas + '</td><td style="text-align:right;"><span style="font-weight:bold;">' + toEuros(data.totalEuros) + '</span></td></tr>';
                    $zcontent += '<tr><td>Descontos</td><td style="text-align:right;"></td><td style="text-align:right;"><span style="font-weight:bold;">' + toEuros(data.totalDescontosEuros) + '</span></td></tr>';
                    $zcontent += '<tr><td>IVA Apurado</td><td style="text-align:right;"></td><td style="text-align:right;"><span style="font-weight:bold;">' + toEuros(data.totalIvaEuros) + '</span></td></tr>';
                    $zcontent += '<tr><td>Crédito</td><td style="text-align:right;"></td><td style="text-align:right;"><span style="font-weight:bold;">' + toEuros(data.totalDeve) + '</span></td></tr>';
                    $zcontent += '<tr><td>Pago</td><td style="text-align:right;"></td><td style="text-align:right;"><span style="font-weight:bold;">' + toEuros(data.totalPago) + '</span></td></tr>';

                    $zcontent += '</table>'
                    if (data.status == 'DONE') {
                        $zcontent += "<p class='muted'>Z1 para o dia " + data.data + " já fechado.</p>";
                        $('.modal-fecho .btn-fecho-ok').attr("disabled", "disabled");
                    } else {
                        $('.modal-fecho .btn-fecho-ok').removeAttr("disabled");
                    }
                    $modalBody.append($($zcontent));

                    $('.modal-fecho').modal({
                        fadeDuration: 50,
                        clickClose: false,
                        showClose: false
                    });
                    $('.modal-fecho .btn-fecho-ok').click(function(evt) {
                        $.ajax({
                            type: "POST",
                            dataType: 'json',
                            timeout: 20000,
                            contentType: 'application/json',
                            data: JSON.stringify({}),
                            url: "/lavandaria/fecho",
                            success: function(data) {
                                $('.modal-fecho').off('.modal-fecho .btn-fecho-ok');
                                $('.modal-fecho').off('.modal-fecho .btn-fecho-cancelar');
                                $.modal.close();
                            },
                            error: function(jqXHR, exception) {
                                globalAjaxError(jqXHR, exception);
                            }
                        });

                    });
                    $('.modal-fecho .btn-fecho-cancelar').click(function(evt) {
                        $('.modal-fecho').off('.modal-fecho .btn-fecho-ok');
                        $('.modal-fecho').off('.modal-fecho .btn-fecho-cancelar');
                        $.modal.close();

                    });
                },
                error: function(jqXHR, exception) {
                    globalAjaxError(jqXHR, exception);
                }
            });
        }
    });

    $('.btn-op.deve').click(function(evt) {
        if (currentTRX.status == 'ongoing') {
            currentTRX.status = 'owe';
            db.put(currentTRX, function(error, newObject) {
                console.log(currentTRX, 'TRX finalizada como devedor');
                blockPOS();
                print(true, true, false);
            });


        }

    });
    $('.btn-op.imprimir').click(function(evt) {
        print(true, true, false);

    });
    $('.btn-op.gaveta').click(function(evt) {
        //MANDAR ABRIR GAVETA, callback
        //--QUE FAZER? RELOAD?

    });
    $('.btn-op-engomar').click(function(evt) {
        isEngomar = true;
    });
    $('.btn-op.subtotal').click(function(evt) {
        doSubTotal();
    });
    $('.btn-op.desconto').click(function(evt) {
        $('.modal-desconto .input-desconto-modal').attr("data-unidade", "%");
        $('.modal-desconto').modal({
            fadeDuration: 50,
            clickClose: false,
            showClose: false
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
    $('.modal-desconto .btn-desconto-back').click(function(evt) {
        var $curr = $('.input-desconto-modal');
        var un = $curr.attr("data-unidade");
        var actual = $curr.attr("data-desc");
        var valor = actual.substr(0, actual.length - 2);
        $curr.attr("data-desc", valor);
        $('.input-desconto-modal').text(valor + " " + un);
    });
    $('.modal-desconto .btn-desconto-cancelar').click(function(evt) {
        var $curr = $('.input-desconto-modal');
        var un = $curr.attr("data-unidade");
        $curr.attr("data-desc", 0);
        $('.input-desconto-modal').text(0 + " " + un);
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

function nameEditionOn() {
    if ($('.pos-cliente-container .cliente-editor').length > 0) {
        $('.cliente-editor', '.pos-cliente-container').off('click');
        $('.pos-cliente-container .cliente-editor').remove();
    }
    $('.pos-cliente-container').append('<div class="btn cliente-editor"><i class="icon icon-pencil" style="margin-top: 5px;"></i></div>');

    $('.cliente-editor', '.pos-cliente-container').on('click', function(evt) {
        var nif = 999999998;
        var nifNome = 'Cliente Final';
        var nifTemp = $('.pos-cliente').html();
        if (nifTemp.length > 0 && nifTemp != 'Contribuinte') {
            var nifSplit = nifTemp.split(" # ");
            if (nifSplit.length > 1) {
                nif = nifSplit[0];
                nifNome = nifSplit[1];
            } else {
                nif = nifTemp;
            }
        }

        var novoNome = prompt("Introduza o nome para a entidade " + nif, nifNome);
        $.ajax({
            dataType: 'json',
            timeout: 20000,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                nif: nif,
                novoNome: novoNome
            }),
            url: "/lavandaria/nif",
            success: function(data) {
                var obj = data;
                if (obj.result && obj.result == "success") {
                    $('.pos-cliente').html(obj.nif.nif + " # " + obj.nif.nome);
                    setNif();
                    nameEditionOn();
                }
            },
            error: function(jqXHR, exception) {
                globalAjaxError(jqXHR, exception);
            }
        });

    });
}

function blockPOS() {
    $('.btn-pos').attr('disabled', 'true');
    $('.btn-op.limpar').removeAttr('disabled');
    $('.btn-op.imprimir').removeAttr('disabled');
    $('.btn-op.fechocaixa').removeAttr('disabled');

}

function unblockPOS() {
    $('.btn-pos').removeAttr('disabled', 'true');
}

function print(receipts, tickets, wasOwe) {
    var tickets = false;
    var toPrint = {};
    if (wasOwe) {
        $.extend(toPrint, currentTRX, {
            creditToPay: wasOwe
        });
    } else {
        toPrint = currentTRX;
    }
    if (receipts) {
        $.ajax({
            type: "POST",
            dataType: 'json',
            timeout: 20000,
            contentType: 'application/json',
            data: JSON.stringify(toPrint),
            url: "/print/receipt",
            success: function(data) {
                if (data.status == "KO") {
                    alert("IMPRESSÃO DE RECIBOS FALHOU:" + data.message);
                }
            },
            error: function(jqXHR, exception) {
                globalAjaxError(jqXHR, exception);
            }
        });
    }
    if (tickets && !wasOwe) {
        $.ajax({
            type: "POST",
            dataType: 'json',
            timeout: 20000,
            contentType: 'application/json',
            data: JSON.stringify(currentTRX),
            url: "/print/tickets",
            success: function(data) {
                if (data.status == "KO") {
                    alert("IMPRESSÃO DE TICKETS FALHOU:" + data.message);
                }
            },
            error: function(jqXHR, exception) {
                globalAjaxError(jqXHR, exception);
            }
        });
    }
}


function globalAjaxError(jqXHR, exception) {
    if (jqXHR.status === 0) {
        alert('Erro: sem ligação de rede.');
    } else if (jqXHR.status == 500) {
        alert('Erro: Internal Server Error [500] - contactar assistencia tecnica.');
    } else if (exception === 'parsererror') {
        alert('Erro: Requested JSON parse failed  - contactar assistencia tecnica.');
    } else if (exception === 'timeout') {
        alert('Erro: Time out.');
    } else if (exception === 'abort') {
        alert('Erro: Pedido abortado.');
    } else {
        alert('Erro: \n' + jqXHR.responseText);
    }
}

function resetPOS() {
    currentTRX = undefined;
    currentTotal = 0;
    currentDesconto = 0;
    currentSubTotal = 0;
    isEngomar = false;
    wasOwe = false;
    isRepetir = false;

    //clear order
    $('.pos-order-number').html("Ordem");
    //clear NIF
    $('.pos-cliente').html("Contribuinte");
    $('.pos-cliente').removeClass('error').removeClass('ok');
    //clear POS lines
    var $visor = $('.pos-visor-container');
    $visor.empty();
    $('.pos-total .valor').text("€ " + toEuros(currentTotal));
    $('.pos-total .descricao').html("Total");
    $('.cliente-editor', '.pos-cliente-container').remove();
}

function addDefeito(caract) {
    if (currentTRX && currentTRX.linhas.length > 0) {
        var ultimaLinha = currentTRX.linhas[currentTRX.linhas.length - 1];
        if (ultimaLinha.defeito && ultimaLinha.defeito.indexOf(caract) < 0) {
            ultimaLinha.defeito = ultimaLinha.defeito + ', ' + caract;
        } else {
            ultimaLinha.defeito = caract;
        }
        if (caract == 'Repetir')
            isRepetir = true;
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

function removeLinha(posVar) {
    if (currentTRX && currentTRX.linhas.length > 0) {

        var $visor = $('.pos-visor-container');
        var pos = -1;
        for (var i = 0, tam = currentTRX.linhas.length; i < tam; i++) {
            if (currentTRX.linhas[i].idlinha == posVar) {
                pos = i;
                break;
            }
        }
        if (pos >= 0) {
            currentTRX.linhas.splice(pos, 1);
            var $linha = $visor.find('.linha-artigo[linha-id="' + posVar + '"]').last();
            $linha.fadeOut(500, function() {
                $linha.css({
                    "visibility": "hidden",
                    display: 'block'
                }).slideUp();
            });
        }
        //$linha.remove();


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

var linhaCounter = 1;

function toVisor($artigo, $dia, $caracteristica, $subtotal, $desconto, obj) {
    var $visor = $('.pos-visor-container');
    var $linha = $visor.find('.linha-artigo').last();
    if ($dia) {
        var $newRow = $('<div class="row-fluid row-linha-pos linha-artigo" linha-id="' + obj.idlinha + '" data-pos="' + linhaCounter + '"><div class="span12 linha"><a class="span1 btn-remover" linha-id="' + obj.idlinha + '" data-pos="' + linhaCounter + '">X</a><div class="span5 descricao"></div><div class="span3 extra">' + obj.entregaDia + '</div><div class="span3 valor"></div></div></div>');
        $visor.append($newRow);
        linhaCounter++;
        $newRow.find('.btn-remover').click(function(evt) {
            if (currentTRX && currentTRX.linhas.length > 0) {
                var pos = $(evt.target).attr('linha-id');
                removeLinha(pos);
            }
        });
        $visor.animate({
            "scrollTop": $visor[0].scrollHeight
        }, "fast");
    } else if ($artigo) {
        if ($linha)
            $linha.find('.descricao').html(obj.attr('data-nome'));
        if (!isEngomar) {
            $linha.find('.valor').html(toEuros(obj.attr('data-precoFinal')));
        } else {
            $linha.find('.valor').html(toEuros(obj.attr('data-precoengomar')));
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



function collectCaracteristicas() {
    var res = {};
    var dfd = new jQuery.Deferred();
    db.query('caracteristicas/all', {
        reduce: false,
        include_docs: true
    }, function(err, results) {
        if (results.rows.length == 0) {
            var caracteristicas = ['Roto', 'Repetir', 'Botões', 'Alt. Cores', 'Lixivia', 'Borbotos', 'Cliente Avisado', 'Resp. Cliente', 'Sem Vinco', 'Com Vinco',
                'Cinto', 'Nodoas', 'Fecho', 'Rasgado', 'Fios Puxados', 'Queimado', 'Encolhido', 'Descosido', 'Bolôr', 'Outro'
            ];

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
                    results.rows.put(obj);
                });
            }

        }

        var row1 = [];
        var row2 = [];
        for (var i = 0, sizeC = results.rows.length; i < sizeC; i++) {
            if (i < 10)
                row1.push(results.rows[i].doc);
            else
                row2.push(results.rows[i].doc);
        }
        res.caracteristicas1 = row1;
        res.caracteristicas2 = row2;
        dfd.resolve(res);

    });

    return dfd.promise();

}

function collectArtigos() {
    var res = {};
    var dfd = new jQuery.Deferred();
    db.query('artigos/all', {
        reduce: false,
        include_docs: true
    }, function(err, results) {

        if (results.rows.length == 0) {
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
                            console.log(newObject, 'adicionado');
                            results.rows.push(obj);
                        });
                    }
                }
            });
        }
        var artigos = [];
        var rows = [];
        results.rows.forEach(function(artigo) {
            if (artigo.doc.id == 22 || artigo.doc.id == 63)
                artigo.doc.cor = true;


            //database bug
            var engomar = artigo.doc.precoEngomar;
            var engomarSemIva = artigo.doc.precoEngomarSemIva;

            artigo.doc.precoEngomar = engomarSemIva;
            artigo.doc.engomarSemIva = engomar;
            artigos.push(artigo.doc);
            if (!rows.contains(Number(artigo.doc.linha)))
                rows.push(Number(artigo.doc.linha));

        });
        artigos.sort(sortByRowColumn);
        rows.sort();
        res.artigos = artigos;
        res.artigosRows = rows;
        dfd.resolve(res);

    });

    return dfd.promise();

}

function maximizeAvailableArea(global, pos) {
    global.css('width', '100%');
    $('.hero-unit').hide();
    pos.css('width', '99%');
    pos.css('height', '100%');
}



function renderPOSContainer(pos, global, globalTemplateObject) {
    var rendered_pos = render('pos', globalTemplateObject);
    pos.append(rendered_pos);

    $('.btn-pos').textfill({
        maxFontPixels: 40
    });

    //add engomar to the last row, last element
    var $engomarContainer = $('.row-artigos .pos-row').last().find('.pos-row-container');
    var $engomarDom = $('<div class="btn btn-pos btn-op-engomar">Engomar</div>');
    $engomarContainer.append($engomarDom);

    $('.numbersOnly').keypress(function(event) {
        // Backspace, tab, enter, end, home, left, right
        // We don't support the del key in Opera because del == . == 46.
        var controlKeys = [8, 9, 13, 35, 36, 37, 39];
        // IE doesn't support indexOf
        var isControlKey = controlKeys.join(",").match(new RegExp(event.which));
        // Some browsers just don't raise events for control keys. Easy.
        // e.g. Safari backspace.
        if (!event.which || // Control keys in most browsers. e.g. Firefox tab is 0
            (48 <= event.which && event.which <= 57) || // Always 1 through 9
            isControlKey) { // Opera assigns values for control keys.
            return;
        } else {
            event.preventDefault();
        }
    });
}