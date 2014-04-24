package printer;

import models.Trx;
import models.TrxLinha;

import java.awt.print.PrinterJob;

import javax.print.*;
import javax.print.event.PrintJobAdapter;
import javax.print.event.PrintJobEvent;


public class ImpressoraAgulhas {

    public static void print(Trx trx) throws PrintException {
        BTPPrinterOptions p = new BTPPrinterOptions();

        p.resetAll();
        p.initialize();
        p.feedBack((byte) 1);
        p.color(0);
        p.alignCenter();
        p.addLineSeperator();

        p.setText("SEGUNDA               S3922");
        p.newLine();
        p.addLineSeperator();
        p.newLine();

        p.alignLeft();
        p.setText("CAMISA \t\t\t 5.00");
        p.newLine();

        p.setText("11:35 \t\t\t " + "11-02-2014");


        p.newLine();
        p.alignCenter();
        p.addLineSeperator();
        p.setText("ORDEM 8 ");
        p.newLine();
        p.addLineSeperator();

        p.feed((byte) 1);
        p.finit();

        feedPrinter(p.finalCommandSet().getBytes());

    }

    private static boolean feedPrinter(byte[] b) throws PrintException {

        String printerName = "BTP-M280(U)1";
        PrintService printService = null;
        PrintService[] printServices = PrinterJob.lookupPrintServices();

        //
        // Iterates the print services and print out its name.
        //
        for (PrintService printService2 : printServices) {
            String sPrinterName = printService2.getName();
            if (sPrinterName.equals(printerName)) {
                printService = printService2;
            }
        }

        DocPrintJob job = printService.createPrintJob();
        DocFlavor flavor = DocFlavor.BYTE_ARRAY.AUTOSENSE;
        Doc doc = new SimpleDoc(b, flavor, null);
        PrintJobWatcher pjDone = new PrintJobWatcher(job);

        job.print(doc, null);
        pjDone.waitForDone();
        System.out.println("Done !");


        return true;
    }


}


class PrintJobWatcher {
    // true iff it is safe to close the print job's input stream
    boolean done = false;

    PrintJobWatcher(DocPrintJob job) {
        // Add a listener to the print job
        job.addPrintJobListener(new PrintJobAdapter() {
            public void printJobCanceled(PrintJobEvent pje) {
                allDone();
            }

            public void printJobCompleted(PrintJobEvent pje) {
                allDone();
            }

            public void printJobFailed(PrintJobEvent pje) {
                allDone();
            }

            public void printJobNoMoreEvents(PrintJobEvent pje) {
                allDone();
            }

            void allDone() {
                synchronized (PrintJobWatcher.this) {
                    done = true;
                    PrintJobWatcher.this.notify();
                }
            }
        });
    }

    public synchronized void waitForDone() {
        try {
            while (!done) {
                wait();
            }
        } catch (InterruptedException e) {
        }
    }
}
