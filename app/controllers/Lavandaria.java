package controllers;

import com.avaje.ebean.Ebean;
import com.avaje.ebean.SqlRow;
import db.couch.pojos.StatCounter;
import db.couch.pojos.Z1;
import db.couch.repo.ArtigoRepository;
import db.couch.repo.TrxRepository;
import db.couch.repo.Z1Repository;
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
import java.util.*;

public class Lavandaria extends Controller {


    public static  Result closePOS() {
        JsonNode json = request().body().asJson();
        ObjectNode result = Json.newObject();
        //OBTER TODAS AS TRX DO DIA
        Calendar gc = GregorianCalendar.getInstance();
        int year = gc.get(Calendar.YEAR);
        int month = gc.get(Calendar.MONTH);
        int day = gc.get(Calendar.DAY_OF_MONTH)-1;
        List<Z1> trxs = Z1Repository.getInstance().getAll(year, month, day);
        //GUARDAR NA BD POSTGRESQL as TRX and store counters
        Map<String,StatCounter> zarts=null;
        double totalEuros = 0.0;
        double totalPago = 0.0;
        double totalDeve = 0.0;
        double totalIvaEuros = 0.0;
        double totalDescontosEuros =0.0;
        int totalpecas=0;
        for(Z1 trx : trxs){
            Trx trxToStore = new Trx(trx);
            trxToStore.save();
            totalpecas+=trxToStore.totalPecas;
            totalDescontosEuros+=trxToStore.totalDescontosEuros;
            totalIvaEuros+=trxToStore.totalIvaEuros;
            totalEuros+=trxToStore.totalEuros;
            if("owe".equals(trx.getStatus()))
                totalDeve += trxToStore.totalEuros;
            else if("done".equals(trx.getStatus()))
                totalPago += trxToStore.totalEuros;
            if(zarts==null){
                zarts = trxToStore.getStats();
            }else{
                for(Map.Entry<String,StatCounter> e: trxToStore.getStats().entrySet()){
                    StatCounter totCounter = zarts.get(e.getKey());
                    if(totCounter==null){
                        zarts.put(e.getKey(),e.getValue());
                    }   else {
                        zarts.put(e.getKey(),totCounter.merge(e.getValue()));
                    }
                }
            }
        }
        result.put("totalEuros",totalEuros);
        result.put("totalPago",totalPago);
        result.put("totalDeve",totalDeve);
        result.put("totalIvaEuros",totalIvaEuros);
        result.put("totalDescontosEuros",totalDescontosEuros);
        result.put("totalPecas",totalpecas);
        //Guardar Z
        result.put("artigos", Json.toJson(zarts));
        result.put("status", "OK");

        //IMPRIMIR
        return ok(result);
    }

    public static Result recoverDay(){
        JsonNode json = request().body().asJson();
        ObjectNode result = Json.newObject();
        Calendar gc = GregorianCalendar.getInstance();
        int year = gc.get(Calendar.YEAR);
        int month = gc.get(Calendar.MONTH);
        int day = gc.get(Calendar.DAY_OF_MONTH);
        List<Z1> trxs = Z1Repository.getInstance().getAll(year, month, day);
        for(Z1 trx : trxs){
            Trx trxToStore = new Trx(trx);
            trxToStore.save();
        }
        result.put("status", "OK");
        return ok(result);
    }

}
