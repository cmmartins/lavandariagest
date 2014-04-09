package db.couch.pojos;

/**
 * Cleverly mastered by: CMM
 * Date: 09/04/14
 * Time: 22:54
 */
public class StatCounter {
    private Integer count = 0;
    private Double total = 0.0;

    public StatCounter(Double total) {
        this.count = 1;
        this.total = total;
    }

    public Integer getCount() {
        return count;
    }

    public Double getTotal() {
        return total;
    }

    public void count(){
        this.count++;
    }

    public void sum(Double val){
        this.total += val;
    }

    public StatCounter discount(Double perc){
        total = total - total*perc;
        return this;
    }

    public StatCounter merge(StatCounter sc){
        this.count += sc.count;
        this.total += sc.total;
        return this;
    }


}
