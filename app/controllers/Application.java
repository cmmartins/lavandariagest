package controllers;

import db.couch.pojos.Artigo;
import db.couch.pojos.LinhaTrx;
import db.couch.pojos.Stats;
import db.couch.pojos.Trx;
import db.couch.repo.ArtigoRepository;
import db.couch.repo.StatsRepository;
import db.couch.repo.TrxRepository;
import org.ektorp.CouchDbConnector;
import org.ektorp.CouchDbInstance;
import org.ektorp.ViewResult;
import org.ektorp.http.HttpClient;
import org.ektorp.http.StdHttpClient;
import org.ektorp.impl.StdCouchDbConnector;
import org.ektorp.impl.StdCouchDbInstance;
import play.Play;
import play.mvc.Controller;
import play.mvc.Result;
import views.html.index;

import java.net.MalformedURLException;
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
            StatsRepository.init(db);

        /*
        List<Artigo> artigos = ArtigoRepository.getInstance().getAll();
            System.out.println(artigos.size());
            List<Trx> trxs = TrxRepository.getInstance().getAll();
            System.out.println(trxs.size());

            for(Trx trx: trxs){
                System.out.println(trx.getOrder()+","+trx.getTotal());
                   List<LinhaTrx> linhas = trx.getLinhas();
                    for(LinhaTrx linha: linhas){
                        System.out.println("\t\t"+linha.getTipo()+","+linha.getArtigoNome()+","+linha.getPrecoUnitario());
                    }
            }

            ViewResult sums =  StatsRepository.getInstance().getSumResult();
            List<ViewResult.Row> rows = sums.getRows();
            for(ViewResult.Row row: rows){
                System.out.println("-->"+row.getKey()+","+row.getValue());
            }

             */
        } catch (MalformedURLException e) {
            e.printStackTrace();
        }
        return ok(index.render("Your new application is ready."));
    }

}
