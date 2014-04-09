package models;

import com.avaje.ebean.Ebean;
import com.avaje.ebean.RawSql;
import com.avaje.ebean.RawSqlBuilder;
import com.avaje.ebean.SqlRow;
import com.avaje.ebean.validation.Length;
import db.couch.pojos.LinhaTrx;
import db.couch.pojos.StatCounter;
import db.couch.pojos.Z1;
import org.codehaus.jackson.annotate.JsonIgnore;
import play.db.ebean.Model;

import javax.persistence.*;
import java.util.*;

/**
 * Cleverly mastered by: CMM
 * Date: 09/04/14
 * Time: 21:45
 */
@Entity
public class Trx extends Model {
    public static Finder<Long, Trx> find = new Finder(
            Long.class, Trx.class
    );
    @Id
    public Long id;
    public double total;
    public String orderNumber;
    public String clienteNif;
    public String statusTrx;
    public long dateTrx;
    public int year;
    public int month;
    public int day;
    public int minutes;
    public int seconds;
    public double totalEuros = 0;
    public double totalIvaEuros = 0;
    public double totalDescontosEuros = 0;
    public double totalPecas = 0;
    @JsonIgnore
    @OneToMany(cascade = CascadeType.PERSIST)
    public List<TrxLinha> linhas;

    public Trx(Z1 z1) {
        this.id = z1.getCid();
        this.orderNumber = z1.getOrder();
        this.clienteNif = String.valueOf(z1.getClienteNif());
        this.statusTrx = z1.getStatus();
        this.dateTrx = z1.getData();
        Calendar c = GregorianCalendar.getInstance();
        c.setTimeInMillis(z1.getData());
        this.year = z1.getYear();
        this.month = z1.getMonth()+1;
        this.day = z1.getDay();
        this.minutes = z1.getMinutes();
        this.seconds = z1.getSeconds();
        this.linhas = new ArrayList<>();

        List<LinhaTrx> linhasz = z1.getLinhas();
        for (int i = 0; i < linhasz.size(); i++) {
            LinhaTrx lt = linhasz.get(i);
            this.linhas.add(new TrxLinha(lt));
            switch (lt.getTipo()) {
                case "artigo":
                    totalEuros += lt.getPrecoUnitario();
                    totalIvaEuros += lt.getIvaIncluido();
                    totalPecas++;
                    break;
                case "desconto":
                    totalDescontosEuros+=totalEuros*lt.getPercentagem();
                    break;
                default:
                    break;
            }
        }
    }

    public Map<String,StatCounter> getStats(){
        Map<String,StatCounter> res = new HashMap<>();
        for (int i = 0; i < linhas.size(); i++) {
             TrxLinha l = linhas.get(i);
            if("artigo".equals(l.getTipo())){
                StatCounter sc = res.get(l.getArtigoNome());
                if(sc==null){
                   sc = new StatCounter(l.getPrecoUnitario());
                }  else{
                    sc.count();
                    sc.sum(l.getPrecoUnitario());
                }
                res.put(l.getArtigoNome(),sc);
            } else if ("desconto".equals(l.getTipo())){
                //descontar em todos os que estão para trás
                for(Map.Entry<String,StatCounter> e: res.entrySet()){
                    res.put(e.getKey(),e.getValue().discount(l.getPercentagem()));
                }
            }
        }

        return res;
    }

}
