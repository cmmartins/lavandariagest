package models;

import db.couch.pojos.LinhaTrx;
import play.db.ebean.Model;

import javax.persistence.Entity;
import javax.persistence.*;
import java.util.Date;

/**
 * Cleverly mastered by: CMM
 * Date: 09/04/14
 * Time: 21:47
 */
@Entity
public class TrxLinha extends Model{
    @Id
    public Long id;
    private String tipo;
    private int artigoId;
    private String artigoNome;
    private double precoUnitario;
    private double ivaIncluido;
    private Date entrega;
    private String entregaDia;
    private String engomar;
    private String defeito;
    private Double valor;
    private Double percentagem;

    public TrxLinha(LinhaTrx t){
        this.tipo = t.getTipo();
        this.artigoId = t.getArtigoId();
        this.artigoNome = t.getArtigoNome();
        this.precoUnitario = t.getPrecoUnitario();
        this.ivaIncluido = t.getIvaIncluido();
        this.entrega = t.getEntrega();
        this.entregaDia = t.getEntregaDia();
        this.engomar = t.getEngomar();
        this.defeito = t.getDefeito();
        this.valor = t.getValor();
        this.percentagem = t.getPercentagem();
    }

    public Long getId() {
        return id;
    }

    public String getTipo() {
        return tipo;
    }

    public int getArtigoId() {
        return artigoId;
    }

    public String getArtigoNome() {
        return artigoNome;
    }

    public double getPrecoUnitario() {
        return precoUnitario;
    }

    public double getIvaIncluido() {
        return ivaIncluido;
    }

    public Date getEntrega() {
        return entrega;
    }

    public String getEntregaDia() {
        return entregaDia;
    }

    public String getEngomar() {
        return engomar;
    }

    public String getDefeito() {
        return defeito;
    }

    public Double getValor() {
        return valor;
    }

    public Double getPercentagem() {
        return percentagem;
    }
}
