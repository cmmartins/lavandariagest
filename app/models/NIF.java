package models;

import play.db.ebean.Model;

import javax.persistence.*;
import java.util.*;

import javax.persistence.Entity;

/**
 * Cleverly mastered by: CMM
 * Date: 24/04/14
 * Time: 17:36
 */
@Entity
public class NIF extends Model {
  @Id
    public long nif;
    public String nome;
    public Date dataCriacao;
    public Date ultimaActualizacao;

    public static Finder<Long, NIF> find = new Finder(
            Long.class, NIF.class
    );
}
