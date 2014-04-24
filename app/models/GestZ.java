package models;

import play.db.ebean.Model;

import javax.persistence.Entity;
import javax.persistence.Id;
import java.util.Calendar;



import play.db.ebean.*;
import play.data.format.*;
import play.data.validation.*;

/**
 * Cleverly mastered by: CMM
 * Date: 19/04/14
 * Time: 23:24
 */
@Entity
public class GestZ extends Model{
    @Id
    public Long key;
    public int year;
    public int month;
    public int day;
    public double totalEuros = 0;
    public double totalIvaEuros = 0;
    public double totalDescontosEuros = 0;
    public double totalPecas = 0;
    public double totalPago =0;
    public double totalDeve =0;

    public long getKey(){
        String m = String.format("%02d", month);
        String d = String.format("%02d", day);
        return Long.valueOf(year+m+d);
    }

    public static Finder<Long,GestZ> find = new Finder<Long,GestZ>(
            Long.class, GestZ.class
    );
}
