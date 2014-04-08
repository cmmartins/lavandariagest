package db.couch.pojos;

/**
 * Cleverly mastered by: CMM
 * Date: 01/04/14
 * Time: 22:40
 */
import org.codehaus.jackson.annotate.*;
import org.ektorp.support.CouchDbDocument;

@JsonIgnoreProperties({"cid", "revision","createdBy","updatedAt","createdAt","order","clienteNif"})

public class Artigo extends CouchDbDocument {
    @JsonProperty("_id")
    private String cid;

    private String id;

    private String createdBy;

    private String updatedAt;

    private String createdAt;

    @JsonProperty("_rev")
    private String revision;

    private String nome;

    private int coluna;

    private int linha;

    private double precoSemIva;

    private double iva;

    private double precoFinal;

    private double precoEngomar;

    private double precoEngomarSemIva;

    private String cor;

    private String type;

    public double getPrecoEngomarSemIva() {
        return precoEngomarSemIva;
    }

    public void setPrecoEngomarSemIva(double precoEngomarSemIva) {
        this.precoEngomarSemIva = precoEngomarSemIva;
    }

    public String getCor() {
        return cor;
    }

    public void setCor(String cor) {
        this.cor = cor;
    }

    public double getPrecoEngomar() {
        return precoEngomar;
    }

    public void setPrecoEngomar(double precoEngomar) {
        this.precoEngomar = precoEngomar;
    }

    public double getPrecoFinal() {
        return precoFinal;
    }

    public void setPrecoFinal(double precoFinal) {
        this.precoFinal = precoFinal;
    }

    public double getIva() {
        return iva;
    }

    public void setIva(double iva) {
        this.iva = iva;
    }

    public double getPrecoSemIva() {
        return precoSemIva;
    }

    public void setPrecoSemIva(double precoSemIva) {
        this.precoSemIva = precoSemIva;
    }

    public int getColuna() {
        return coluna;
    }

    public void setColuna(int coluna) {
        this.coluna = coluna;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public int getLinha() {
        return linha;
    }

    public void setLinha(int linha) {
        this.linha = linha;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}
