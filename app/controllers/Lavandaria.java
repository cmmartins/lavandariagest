package controllers;

import db.couch.pojos.StatCounter;
import db.couch.pojos.Z1;
import db.couch.repo.ArtigoRepository;
import db.couch.repo.TrxRepository;
import db.couch.repo.Z1Repository;
import models.NIF;
import models.Trx;
import models.GestZ;
import org.codehaus.jackson.JsonNode;
import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.map.SerializationConfig;
import org.codehaus.jackson.map.annotate.JsonSerialize;
import org.codehaus.jackson.node.ObjectNode;
import org.ektorp.CouchDbConnector;
import org.ektorp.CouchDbInstance;
import org.ektorp.http.HttpClient;
import org.ektorp.http.StdHttpClient;
import org.ektorp.impl.StdCouchDbConnector;
import org.ektorp.impl.StdCouchDbInstance;
import play.Play;
import play.libs.F.Function;
import play.libs.WS;
import play.mvc.*;
import play.libs.Json;
import play.mvc.Controller;
import play.mvc.Result;
import scala.util.parsing.json.JSON;

import java.io.*;
import java.net.*;


import java.net.MalformedURLException;
import java.util.*;

public class Lavandaria extends Controller {

    public static String getResponse(String urlToRead) {
        URL url;
        HttpURLConnection conn;
        BufferedReader rd;
        String line;
        String result = "";
        try {
            url = new URL(urlToRead);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            rd = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            while ((line = rd.readLine()) != null) {
                result += line;
            }
            rd.close();
        } catch (IOException e) {
            e.printStackTrace();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return result;
    }

    public static  Result nif() {
        JsonNode json = request().body().asJson();
        ObjectNode result = Json.newObject();
        String nif = null;
        if(json.findValue("nif")!=null)
            nif = json.findValue("nif").getTextValue();
        String novoNome = null;
        if(json.findValue("novoNome")!=null)
            novoNome = json.findValue("novoNome").getTextValue();

        NIF nifBD = null;


        if(novoNome!=null){
            //let's update'
            nifBD = NIF.find.byId(Long.valueOf(nif));
            if(nifBD==null) {
                nifBD = new NIF();
                nifBD.nif = Long.valueOf(nif);
                nifBD.nome = novoNome;
                nifBD.dataCriacao = new Date();
                nifBD.ultimaActualizacao = new Date();
                nifBD.save();
            } else{
                nifBD.nome = novoNome;
                nifBD.ultimaActualizacao = new Date();
                nifBD.update();
            }
        } else{
            nifBD = NIF.find.byId(Long.valueOf(nif));
        }


        if(nifBD == null){
            String response = getResponse("http://www.nif.pt/?json=1&q=" + nif);
            ObjectMapper mapper = new ObjectMapper();
            try {
                JsonNode actualObj = mapper.readTree(response);
                JsonNode resultObj = actualObj.findValue("result");
                if(resultObj!=null && resultObj.getTextValue().equals("success")){
                    JsonNode recordsObj = actualObj.findValue("records");
                    JsonNode titleObj = recordsObj.findValue("title");
                    if(titleObj!=null){
                        nifBD = new NIF();
                        nifBD.nif = Long.valueOf(nif);
                        nifBD.nome = titleObj.getTextValue();
                        nifBD.dataCriacao = new Date();
                        nifBD.ultimaActualizacao = new Date();
                        nifBD.save();
                        result.put("result","success");
                        result.put("nif",Json.toJson(nifBD));
                    }
                }else{
                    result.put("result","error");
                }
            }catch(Exception e){
                result.put("result","error");
            }
        } else{
            result.put("result","success");
            result.put("nif",Json.toJson(nifBD));
        }
        return ok(result);
    }

    public static  Result closePOS() {
        JsonNode json = request().body().asJson();
        Boolean isPreview = false;
        if(json.findValue("preview")!=null)
            isPreview = json.findValue("preview").getBooleanValue();
        ObjectNode result = Json.newObject();
        //OBTER TODAS AS TRX DO DIA
        Calendar gc = GregorianCalendar.getInstance();
        int year = gc.get(Calendar.YEAR);
        int month = gc.get(Calendar.MONTH);
        int day = gc.get(Calendar.DAY_OF_MONTH);
        List<Z1> trxs = null ;
        try {
            trxs = Z1Repository.getInstance().getAll(year, month, day);
        }catch(Exception e){
            result.put("status", "KO");
            result.put("message", e.getMessage());
              return badRequest(result);
        }

        Map<String,StatCounter> zarts=null;
        double totalEuros = 0.0;
        double totalPago = 0.0;
        double totalDeve = 0.0;
        double totalIvaEuros = 0.0;
        double totalDescontosEuros =0.0;
        int totalpecas=0;
        for(Z1 trx : trxs){
            Trx trxToStore = new Trx(trx);
            if(!isPreview)
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
                    if(e.getKey()!=null) {
                        StatCounter totCounter = zarts.get(e.getKey());
                        if (totCounter == null) {
                            zarts.put(e.getKey(), e.getValue());
                        } else {
                            zarts.put(e.getKey(), totCounter.merge(e.getValue()));
                        }
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
        result.put("artigos", Json.toJson(zarts));


        GestZ z = new GestZ();
        z.day = day;
        z.month = month+1;
        z.year = year;
        z.totalDescontosEuros =  totalDescontosEuros;
        z.totalDeve = totalDeve;
        z.totalEuros = totalEuros;
        z.totalIvaEuros = totalIvaEuros;
        z.totalPago = totalPago;
        z.totalPecas = totalpecas;
        z.key = z.getKey();

        result.put("data", z.key);
        if(GestZ.find.byId(z.getKey())!=null)
            result.put("status", "DONE");
        else
            result.put("status", "OK");
        if(!isPreview){
            //Guardar GestZ, calcular anteriores se necessário
            z.save();
            //TODO:
            //PRINT
        }
        //httpClient.shutdown();
        return ok(result);
    }

    public static Result recoverDay(){
        JsonNode json = request().body().asJson();
        ObjectNode result = Json.newObject();
        Calendar gc = GregorianCalendar.getInstance();
        int year = gc.get(Calendar.YEAR);
        int month = gc.get(Calendar.MONTH);
        int day = gc.get(Calendar.DAY_OF_MONTH);
        List<Z1> trxs = null;
        try{
            trxs = Z1Repository.getInstance().getAll(year, month, day);
        }catch(Exception e){
            result.put("status", "KO");
            result.put("message", e.getMessage());
            return badRequest(result);
        }
        for(Z1 trx : trxs){
            Trx trxToStore = new Trx(trx);
            trxToStore.save();
        }
        result.put("status", "OK");
        return ok(result);
    }

}
