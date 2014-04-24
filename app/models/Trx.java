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
    public static final String ARTIGO = "artigo";
    public static final String DESCONTO = "desconto";
    public static Finder<Long, Trx> find = new Finder(
            Long.class, Trx.class
    );
    @Id
    public Long id;
    public double total;
    public String orderNumber;
    public String clienteNif;
    public String clienteNome;
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



    public Trx(db.couch.pojos.Trx remoteTrx) {
        this.id = remoteTrx.getcId() ;
        this.orderNumber = remoteTrx.getOrder();
        this.clienteNif = String.valueOf(remoteTrx.getClienteNif());
        this.clienteNome = remoteTrx.getClienteNome();
        this.statusTrx = remoteTrx.getStatus();
        Long dateLong = Long.parseLong(remoteTrx.getData());
        this.dateTrx = dateLong;
        Calendar c = GregorianCalendar.getInstance();
        c.setTimeInMillis(dateLong);
        this.year =c.get(Calendar.YEAR);
        this.month = c.get(Calendar.MONTH)+1;
        this.day = c.get(Calendar.DAY_OF_MONTH);
        this.minutes = c.get(Calendar.MINUTE);
        this.seconds = c.get(Calendar.SECOND);
        this.linhas = new ArrayList<>();

        List<LinhaTrx> linhasz = remoteTrx.getLinhas();
        for (int i = 0; i < linhasz.size(); i++) {
            LinhaTrx lt = linhasz.get(i);
            this.linhas.add(new TrxLinha(lt));
            switch (lt.getTipo()) {
                case ARTIGO:
                    totalEuros += lt.getPrecoUnitario();
                    totalIvaEuros += lt.getIvaIncluido();
                    totalPecas++;
                    break;
                case DESCONTO:
                    totalDescontosEuros=totalEuros*lt.getPercentagem();

                    totalEuros=  totalEuros - totalEuros*lt.getPercentagem();
                    totalIvaEuros=  totalIvaEuros -  totalIvaEuros*lt.getPercentagem();
                    break;
                default:
                    break;
            }
        }
    }


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
                case ARTIGO:
                    totalEuros += lt.getPrecoUnitario();
                    totalIvaEuros += lt.getIvaIncluido();
                    totalPecas++;
                    break;
                case DESCONTO:
                    totalDescontosEuros=totalEuros*lt.getPercentagem();

                    totalEuros=  totalEuros - totalEuros*lt.getPercentagem();
                    totalIvaEuros=  totalIvaEuros -  totalIvaEuros*lt.getPercentagem();
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
            if(ARTIGO.equals(l.getTipo())){
                StatCounter sc = res.get(l.getArtigoNome());
                if(sc==null){
                   sc = new StatCounter(l.getPrecoUnitario());
                }  else{
                    sc.count();
                    sc.sum(l.getPrecoUnitario());
                }
                res.put(l.getArtigoNome(),sc);
            } else if (DESCONTO.equals(l.getTipo())){
                //descontar em todos os que estão para trás
                for(Map.Entry<String,StatCounter> e: res.entrySet()){
                    res.put(e.getKey(),e.getValue().discount(l.getPercentagem()));
                }
            }
        }

        return res;
    }

}
