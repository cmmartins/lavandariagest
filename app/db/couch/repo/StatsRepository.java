package db.couch.repo;

import db.couch.pojos.Stats;
import db.couch.pojos.Trx;
import org.ektorp.CouchDbConnector;
import org.ektorp.ViewResult;
import org.ektorp.support.CouchDbRepositorySupport;
import org.ektorp.support.View;

/**
 * Cleverly mastered by: CMM
 * Date: 01/04/14
 * Time: 22:50
 */


/*
{
  "_id": "_design/articles",
  "language": "javascript",
  "views": {
    "all": {
      "map": "function(doc) { if(doc.type == 'article') { emit(null, doc); }  }"
    }
  }
}
 */
@View( name = "sum", map = "function(doc) {\\n    if (doc.type == 'trx') {\\n        var tam = doc.linhas.length;\\n        for (var i = 0; i < tam; i++) {\\n            var linha = doc.linhas[i];\\n            if (linha.tipo == 'artigo') {\\n                emit([linha.artigoId, linha.artigoNome], linha.precoUnitario);\\n            } else if (linha.tipo = 'desconto') {\\n                emit([0, 'Desconto'], linha.valor);\\n            }\\n        }\\n    }\\n}", reduce = "function(keys, values, rereduce) {\\n    return sum(values);\\n}")
public class StatsRepository extends CouchDbRepositorySupport<Stats>{
    public StatsRepository(CouchDbConnector db) {
        super(Stats.class, db);
    }

    private static StatsRepository _instance = null;

    public static void init(CouchDbConnector db) {
        if(_instance==null)
            _instance = new StatsRepository(db);
    }

    public static StatsRepository getInstance(){
        return _instance;
    }

    public ViewResult getSumResult() {
        return db.queryView(createQuery("sum").groupLevel(2));
    }
}
