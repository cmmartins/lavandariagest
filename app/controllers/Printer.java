package controllers;

import db.couch.pojos.Trx;
import db.couch.repo.TrxRepository;
import org.codehaus.jackson.JsonNode;
import org.codehaus.jackson.node.ObjectNode;
import play.libs.Json;
import play.mvc.Controller;
import play.mvc.Result;

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
        //obtain from db
        Trx trx = TrxRepository.getInstance().get(_id);
        if(trx==null){
            //must create trx from json
        }
        System.out.println("TRX: "+trx.toString());
        if(_id == null) {
            result.put("status", "KO");
            result.put("message", "Missing parameter [_id]");
            return badRequest(result);
        } else {
            result.put("status", "OK");
            return ok(result);
        }
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
}
