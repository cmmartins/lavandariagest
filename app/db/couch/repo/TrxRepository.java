package db.couch.repo;

import db.couch.pojos.Artigo;
import db.couch.pojos.Trx;
import org.ektorp.CouchDbConnector;
import org.ektorp.support.CouchDbRepositorySupport;
import org.ektorp.support.View;

import java.util.List;

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
@View( name = "all", map = "function(doc) { if (doc.type == 'trx' ) emit( null, doc._id )}")
public class TrxRepository extends CouchDbRepositorySupport<Trx>{
    public TrxRepository(CouchDbConnector db) {
        super(Trx.class, db);
    }

    private static TrxRepository _instance = null;

    public static void init(CouchDbConnector db) {
        if(_instance==null)
            _instance = new TrxRepository(db);
    }

    public static TrxRepository getInstance(){
        return _instance;
    }

    /*public List<Trx> getAll() {
        return db.queryView(createQuery("allTrx")
                        .includeDocs(true),
                type);
    } */
}
