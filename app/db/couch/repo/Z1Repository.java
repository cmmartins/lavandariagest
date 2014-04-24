package db.couch.repo;

import db.couch.pojos.Z1;
import org.ektorp.ComplexKey;
import org.ektorp.CouchDbConnector;
import org.ektorp.ViewQuery;
import org.ektorp.ViewResult;
import org.ektorp.support.CouchDbRepositorySupport;
import org.ektorp.support.View;

import java.util.Arrays;
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
@View( name = "allDays", map = "function(doc) {emit([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()], [doc._id, doc.order, doc.clienteNif, doc.data, doc.status, linhas]);}")
public class Z1Repository extends CouchDbRepositorySupport<Z1>{
    public Z1Repository(CouchDbConnector db) {
        super(Z1.class, db);
    }

    private static Z1Repository _instance = null;


    public static Z1Repository getInstance() throws Exception{
        return new Z1Repository(CouchConnect.connect());
    }

    public List<Z1> getAll(int year, int month, int day) {

        return db.queryView(createQuery("allDays").startKey(ComplexKey.of(year, month, day,0,0)).endKey(ComplexKey.of(year, month, day,23,59)).inclusiveEnd(true).includeDocs(true),type);
    }
}
