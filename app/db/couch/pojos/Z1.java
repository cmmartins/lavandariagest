package db.couch.pojos;

import org.ektorp.support.CouchDbDocument;

import java.util.Calendar;
import java.util.GregorianCalendar;
import java.util.List;

/**
 * Cleverly mastered by: CMM
 * Date: 02/04/14
 * Time: 02:31
 */
public class Z1 extends CouchDbDocument {
    private List<Integer> key;
    private long cid;
    private String order;
    private String type;
    private long clienteNif;
    private String clienteNome;
    private Long data;
    private List<LinhaTrx> linhas;
    private double total;
    private double totalIva;
    private double totalSemIVa;
    private String status;
    //emit([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()], [doc._id, doc.order, doc.clienteNif, doc.data, doc.status, linhas]);

    public List<Integer> getKey() {
        return key;
    }

    public void setKey(List<Integer> key) {
        this.key = key;
    }

    public Integer getYear(){
        Calendar c = GregorianCalendar.getInstance();
        c.setTimeInMillis(getData());
        return c.get(Calendar.YEAR);
    }

    public Integer getMonth(){
        Calendar c = GregorianCalendar.getInstance();
        c.setTimeInMillis(getData());
        return c.get(Calendar.MONTH);
    }

    public Integer getDay(){
        Calendar c = GregorianCalendar.getInstance();
        c.setTimeInMillis(getData());
        return c.get(Calendar.DAY_OF_MONTH);
    }

    public Integer getMinutes(){
        Calendar c = GregorianCalendar.getInstance();
        c.setTimeInMillis(getData());
        return c.get(Calendar.MINUTE);
    }

    public Integer getSeconds(){
        Calendar c = GregorianCalendar.getInstance();
        c.setTimeInMillis(getData());
        return c.get(Calendar.MILLISECOND);
    }

    public long getCid() {
        return cid;
    }

    public void setCid(long cid) {
        this.cid = cid;
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

    public Long getData() {
        return data;
    }

    public void setData(Long data) {
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

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}
