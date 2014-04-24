package db.couch.repo;

import org.ektorp.CouchDbConnector;
import org.ektorp.CouchDbInstance;
import org.ektorp.http.HttpClient;
import org.ektorp.http.StdHttpClient;
import org.ektorp.impl.StdCouchDbConnector;
import org.ektorp.impl.StdCouchDbInstance;
import play.Play;

import java.net.MalformedURLException;

/**
 * Cleverly mastered by: CMM
 * Date: 21/04/14
 * Time: 22:11
 */
public class CouchConnect {
    public static CouchDbConnector connect() throws MalformedURLException {
        HttpClient httpClient = new StdHttpClient.Builder()
                .url("http://" + Play.application().configuration().getString("internal.couchdb.ip") + ":" + Play.application().configuration().getString("internal.couchdb.port"))
                .username(Play.application().configuration().getString("internal.couchdb.user"))
                .password(Play.application().configuration().getString("internal.couchdb.password"))
                .build();
        CouchDbInstance dbInstance = new StdCouchDbInstance(httpClient);
        CouchDbConnector db = new StdCouchDbConnector(Play.application().configuration().getString("internal.couchdb.name"), dbInstance);

        return db;
    }
}
