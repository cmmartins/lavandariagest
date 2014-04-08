package db.couch.pojos;

import org.ektorp.support.CouchDbDocument;

import java.util.List;

/**
 * Cleverly mastered by: CMM
 * Date: 02/04/14
 * Time: 02:31
 */
public class Stats extends CouchDbDocument {
    private List<String> key;
    private double value;

    public List<String> getKey() {
        return key;
    }

    public void setKey(List<String> key) {
        this.key = key;
    }

    public double getValue() {
        return value;
    }

    public void setValue(double value) {
        this.value = value;
    }
}
