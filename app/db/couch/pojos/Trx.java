package db.couch.pojos;

import org.codehaus.jackson.annotate.JsonIgnoreProperties;
import org.codehaus.jackson.annotate.JsonProperty;
import org.ektorp.support.CouchDbDocument;

import java.util.List;

/**
 * Cleverly mastered by: CMM
 * Date: 01/04/14
 * Time: 22:41
 */
@JsonIgnoreProperties({"type", "revision","createdBy","updatedAt","createdAt","creditToPay"})
public class Trx extends CouchDbDocument {
    public static String ONGOING="ongoing";
    public static String ABORTED="aborted";
    public static String DONE="done";

    private long cid;
    private String order;
    private long clienteNif;
    private String clienteNome;
    private String data;
    private List<LinhaTrx> linhas;
    private double total;
    private double totalIva;
    private double totalSemIVa;
    private String status;


    @JsonProperty("id")
    public long getcId() {
        return cid;
    }

    @JsonProperty("id")
    public void setcId(long id) {
        this.cid = id;
    }

    public String getOrder() {
        return order;
    }

    public void setOrder(String order) {
        this.order = order;
    }

    public long getClienteNif() {
        return clienteNif;
    }

    public void setClienteNif(long clienteNif) {
        this.clienteNif = clienteNif;
    }

    public String getClienteNome() {
        return clienteNome;
    }

    public void setClienteNome(String clienteNome) {
        this.clienteNome = clienteNome;
    }

    public String getData() {
        return data;
    }

    public void setData(String data) {
        this.data = data;
    }

    public List<LinhaTrx> getLinhas() {
        return linhas;
    }

    public void setLinhas(List<LinhaTrx> linhas) {
        this.linhas = linhas;
    }

    public double getTotal() {
        return total;
    }

    public void setTotal(double total) {
        this.total = total;
    }

    public double getTotalIva() {
        return totalIva;
    }

    public void setTotalIva(double totalIva) {
        this.totalIva = totalIva;
    }

    public double getTotalSemIVa() {
        return totalSemIVa;
    }

    public void setTotalSemIVa(double totalSemIVa) {
        this.totalSemIVa = totalSemIVa;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String toString(){
        return getId()+","+getOrder()+","+getClienteNif()+","+getTotal();
    }
}
