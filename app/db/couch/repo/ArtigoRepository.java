package db.couch.repo;

import db.couch.pojos.Artigo;
import org.ektorp.CouchDbConnector;
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
@View( name = "all", map = "function(doc) { if (doc.type == 'artigo' ) emit( null, doc._id )}")
public class ArtigoRepository extends CouchDbRepositorySupport<Artigo>{
    public ArtigoRepository(CouchDbConnector db) {
        super(Artigo.class, db,"artigo");
    }

    private static   ArtigoRepository _instance = null;

    public static void init(CouchDbConnector db) {
        if(_instance==null)
            _instance = new ArtigoRepository(db);
    }

    public static  ArtigoRepository getInstance(){
        return _instance;
    }
}
