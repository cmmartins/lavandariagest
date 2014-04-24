package controllers;

import db.couch.pojos.Trx;
import db.couch.repo.TrxRepository;
import org.codehaus.jackson.JsonNode;
import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.node.ObjectNode;
import play.libs.Json;
import play.mvc.Controller;
import play.mvc.Result;
import printer.ImpressoraCITIZEN;

/**
 * Cleverly mastered by: CMM
 * Date: 08/04/14
 * Time: 00:22
 */
public class Printer extends Controller {

    public static Result receipts(){
        JsonNode json = request().body().asJson();
        ObjectNode result = Json.newObject();

        //get trxid
        String _id = json.findPath("_id").getTextValue();
        boolean isCreditToPay = json.findPath("creditToPay")!=null && json.findPath("creditToPay").asText().length()>0;
        //obtain from db
        if (_id == null) {
            result.put("status", "KO");
            result.put("message", "Missing parameter [_id]");
            return badRequest(result);
        }
        Trx trx = null;

        ObjectMapper objectMapper = new ObjectMapper();
        try {
            trx = objectMapper.readValue(json, Trx.class);
        } catch (Exception e) {
            trx = null;
        }

        if (trx == null) {
            try {
                trx = TrxRepository.getInstance().get(_id);
            } catch (Exception e) {
                result.put("status", "KO");
                result.put("message", "Erro a obter transacção aguarde alguns segundos e seleccione Imprimir.");
                return badRequest(result);
            }

        }
        if (trx == null) {
            result.put("status", "KO");
            result.put("message", "Erro a obter transacção aguarde alguns segundos e seleccione Imprimir.");
            return badRequest(result);
        }
        try {
            if (trx.getLinhas() == null || trx.getLinhas().size() == 0) {
                for (int i = 0; i < 10; i++) {
                    Thread.sleep(2000);
                    if (trx.getLinhas() != null)
                        break;
                }

                trx = TrxRepository.getInstance().get(_id);
            }
            models.Trx mtrx =  new models.Trx(trx);
            ImpressoraCITIZEN.print(mtrx,false,isCreditToPay);
            ImpressoraCITIZEN.print(mtrx,true,isCreditToPay);
        } catch (Exception e) {
            result.put("status", "KO");
            result.put("message", "Error printing on CITIZEN: " + e.getMessage());
            e.printStackTrace();
            return badRequest(result);
        }
        result.put("status", "OK");
        return ok(result);
    }

    public static Result tickets(){
        JsonNode json = request().body().asJson();
        ObjectNode result = Json.newObject();

        String name = json.findPath("name").getTextValue();
        if(name == null) {
            result.put("status", "KO");
            result.put("message", "Missing parameter [name]");
            return badRequest(result);
        } else {
            result.put("status", "OK");
            result.put("message", "Hello " + name);
            return ok(result);
        }
    }

    public static Result printZ1(ObjectNode result){
        /*
                 result.put("totalEuros",totalEuros);
        result.put("totalPago",totalPago);
        result.put("totalDeve",totalDeve);
        result.put("totalIvaEuros",totalIvaEuros);
        result.put("totalDescontosEuros",totalDescontosEuros);
        result.put("totalPecas",totalpecas);
        //Guardar GestZ
        result.put("artigos", Json.toJson(zarts));
                 */
        return TODO;
    }
}
