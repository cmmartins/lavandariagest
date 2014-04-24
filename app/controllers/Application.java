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
import java.util.*;

public class Application extends Controller {

    public static Result index() {

        /*String property = System.getProperty("java.library.path");
        StringTokenizer parser = new StringTokenizer(property, ";");
        while (parser.hasMoreTokens()) {
            System.err.println(parser.nextToken());
        } */

        return ok(index.render("Your new application is ready."));
    }

    public static Result now(){
        ObjectNode result = Json.newObject();
        result.put("time",System.currentTimeMillis());
        return ok(result);
    }

}
