package db.couch.pojos;

import org.ektorp.support.CouchDbDocument;

import java.util.Date;

/**
 * Cleverly mastered by: CMM
 * Date: 02/04/14
 * Time: 00:27
 */
public class LinhaTrx extends CouchDbDocument {

    private String tipo;
    private int artigoId;
    private String artigoNome;
    private double precoUnitario;
    private double ivaIncluido;
    private Date entrega;
    private String entregaDia;
    private String engomar;
    private String defeito;
    private String valor;
    private Double percentagem;


    public String getArtigoNome() {
        return artigoNome;
    }

    public void setArtigoNome(String artigoNome) {
        this.artigoNome = artigoNome;
    }

    public double getPrecoUnitario() {
        return precoUnitario;
    }

    public void setPrecoUnitario(double precoUnitario) {
        this.precoUnitario = precoUnitario;
    }

    public double getIvaIncluido() {
        return ivaIncluido;
    }

    public void setIvaIncluido(double ivaIncluido) {
        this.ivaIncluido = ivaIncluido;
    }

    public Date getEntrega() {
        return entrega;
    }

    public void setEntrega(Date entrega) {
        this.entrega = entrega;
    }

    public String getEntregaDia() {
        return entregaDia;
    }

    public void setEntregaDia(String entregaDia) {
        this.entregaDia = entregaDia;
    }

    public String getEngomar() {
        return engomar;
    }

    public void setEngomar(String engomar) {
        this.engomar = engomar;
    }

    public String getDefeito() {
        return defeito;
    }

    public void setDefeito(String defeito) {
        this.defeito = defeito;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public int getArtigoId() {
        return artigoId;
    }

    public void setArtigoId(int artigoId) {
        this.artigoId = artigoId;
    }

    public String getValor() {
        return valor;
    }

    public void setValor(String valor) {
        this.valor = valor;
    }

    public Double getPercentagem() {
        return percentagem;
    }

    public void setPercentagem(Double percentagem) {
        this.percentagem = percentagem;
    }
}