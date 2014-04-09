package controllers;

import db.couch.repo.ArtigoRepository;
import db.couch.repo.Z1Repository;
import db.couch.repo.TrxRepository;
import models.Trx;
import org.codehaus.jackson.JsonNode;
import org.codehaus.jackson.node.ObjectNode;
import org.ektorp.CouchDbConnector;
import org.ektorp.CouchDbInstance;
import org.ektorp.ViewResult;
import org.ektorp.http.HttpClient;
import org.ektorp.http.StdHttpClient;
import org.ektorp.impl.StdCouchDbConnector;
import org.ektorp.impl.StdCouchDbInstance;
import play.Play;
import play.libs.Json;
import play.mvc.Controller;
import play.mvc.Result;
import views.html.index;

import java.net.MalformedURLException;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.List;

public class Application extends Controller {

    public static Result index() {
        try{
            HttpClient httpClient = new StdHttpClient.Builder()
                    .url("http://"+ Play.application().configuration().getString("internal.couchdb.ip")+":"+Play.application().configuration().getString("internal.couchdb.port"))
                    .username(Play.application().configuration().getString("internal.couchdb.user"))
                    .password(Play.application().configuration().getString("internal.couchdb.password"))
                    .build();
            CouchDbInstance dbInstance = new StdCouchDbInstance(httpClient);
            CouchDbConnector db = new StdCouchDbConnector(Play.application().configuration().getString("internal.couchdb.name"), dbInstance);


            ArtigoRepository.init(db);
            TrxRepository.init(db);
            Z1Repository.init(db);


        } catch (MalformedURLException e) {
            e.printStackTrace();
        }
        return ok(index.render("Your new application is ready."));
    }

}
