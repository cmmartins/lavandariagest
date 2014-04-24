package printer;

import jpos.*;
import jpos.util.JposPropertiesConst;
import models.Trx;
import models.TrxLinha;
import play.api.Play;

import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.Date;

public class ImpressoraCITIZEN {
    private static DecimalFormatSymbols decimalFormatSymbols;
    static {
        decimalFormatSymbols = new DecimalFormatSymbols();
        decimalFormatSymbols.setDecimalSeparator(',');
        decimalFormatSymbols.setGroupingSeparator('.');

    }
    private static DecimalFormat decimalFormat = new DecimalFormat("#,##0.00", decimalFormatSymbols);
    private static NumberFormat percentFormat = NumberFormat.getPercentInstance();
    static {
        percentFormat.setMaximumFractionDigits(0);
    }
    private static SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm");

    private static String normalizePT(String x){
        return x.replace("ã","a").replace("õ","o").replace("é","").replace("º","").replace("ç","c").replace("á","a").replace("ô","o").replace("¾","3/4").replace("Ç","C").replace('Á','A');
    }

    public static void print(Trx trx) throws JposException{
                print(trx,false,false);
    }

    public static void print(Trx trx,boolean dup,boolean onlyTotal) throws JposException{

        //System.load(play.Play.application().configuration().getString("jpos.dll.location"));
        //System.setProperty(	JposPropertiesConst.JPOS_POPULATOR_FILE_PROP_NAME, play.Play.application().configuration().getString("jpos.logo.location"));
        String PrinterDevice="CITIZEN S310II USB Windows";
        //String DrawerDevice="ImpressoraCITIZEN S801 Cash Drawer 1 USB Windows";

        POSPrinter printer = new POSPrinter();
        //CashDrawer drawer = new CashDrawer();

        try {

            //   ESC + "|cA"          -> center alignment
            //   ESC + "|4C"          -> double high double wide character printing
            //   ESC + "|bC"          -> bold character printing
            //   ESC + "|uC"          -> underline character printing
            //   ESC + "|rA"          -> right alignment

            printer.open(PrinterDevice);

            printer.claim(1000);

            printer.setDeviceEnabled(true);

            //Register BMP image
            printer.setBitmap(1, 2, play.Play.application().configuration().getString("jpos.logo.location"), POSPrinterConst.PTR_BM_ASIS, POSPrinterConst.PTR_BM_CENTER);

            //Start Transaction Print
            printer.transactionPrint(2, POSPrinterConst.PTR_TP_TRANSACTION);

            //Print the registered image
            printer.printNormal(2, "\033|cA\033|1B");

            printer.printNormal(2, "\n");

            printer.printNormal(2, "\033|cA\033|bC\033|4CLavandaria Bracarense\n\n");
            printer.printNormal(2, "\033|cAAFER Service UNIP. LDA\n");
            printer.printNormal(2, "\033|cAContribuinte Nr 508 403 499\n");
            printer.printNormal(2, "\033|cARua de S. Marcos 117-119 4700-328 Braga\n");
            printer.printNormal(2, "\033|cATelefone: 253 113 554\n");

            printer.printNormal(2, "\n");
            if(trx.totalEuros<=100)
                printer.printNormal(2, "\033|cA\033|bCFactura Simplificada\n\n");
            else
                printer.printNormal(2, "\033|cA\033|bCFactura\n\n");
            //Se contribuintecolocar nesta linha o nif
            if(dup)
                printer.printNormal(2, "\033|cA\033|bCDuplicado\n\n");


            if("999999998".equals(trx.clienteNif)) {
                printer.printNormal(2, "Cliente:_____________________________\n");
                printer.printNormal(2, "Contribuinte: Consumidor Final\n");
            }else {
                if(trx.clienteNome!=null && trx.clienteNome.length()>0 && !trx.clienteNome.toLowerCase().equals("cliente final"))
                    printer.printNormal(2, "Cliente:"+normalizePT(trx.clienteNome)+"\n");
                else
                    printer.printNormal(2, "Cliente:_____________________________\n");
                printer.printNormal(2, "Contribuinte: " + trx.clienteNif + "\n");
            }
            printer.printNormal(2, "\n");
            printer.printNormal(2, "\033|cA\033|bCOrdem: "+trx.orderNumber+"\n\n");
            if(!onlyTotal) {
                for (int i = 0; i < trx.linhas.size(); i++) {
                    TrxLinha linha = trx.linhas.get(i);
                    switch (linha.getTipo()) {
                        case "artigo":

                            if (linha.getDefeito() != null && linha.getDefeito().length() > 0) {
                                printer.printNormal(2, "\033|2fT\t\t" + normalizePT(linha.getDefeito()) + "\n");
                                printer.printNormal(2, "\033|0fT");
                            }
                            printer.printNormal(2, "\033|bC" + normalizePT(linha.getEntregaDia().toUpperCase()) + "\t\t");
                            printer.printNormal(2, normalizePT(linha.getArtigoNome()) + "\t\t\t" + decimalFormat.format(linha.getPrecoUnitario()) + "\n");
                            break;
                        case "desconto":
                            printer.printNormal(2, "\tDESCONTO (" + percentFormat.format(linha.getPercentagem()) + ")\t\t- " + decimalFormat.format(linha.getValor()) + "\n");
                            break;
                        case "subtotal":
                            printer.printNormal(2, "\n\tSUBTOTAL\t\t " + linha.getValor() + "\n");
                            break;
                        default:
                            break;
                    }

                /*printer.printNormal(2, "Casaco\t\t\t3.80\n");
                printer.printNormal(2, "\033|2fT\t\tBorboto, Cliente Avisado\n");
                printer.printNormal(2, "\033|0fT");
                printer.printNormal(2, "\033|bCSEGUNDA\t\t");
                printer.printNormal(2, "Camisa\t\t\t2.50\n");
                printer.printNormal(2, "\033|bCSEGUNDA\t\t");
                printer.printNormal(2, "Blus�o\t\t\t3.80\n");
                printer.printNormal(2, "\033|bCSEGUNDA\t\t");
                printer.printNormal(2, "Blusa Simples\t\t\t2.50\n");
                printer.printNormal(2, "\n\tSUBTOTAL\t\t 13.60\n");
                printer.printNormal(2, "\tDESCONTO (20%)\t\t- 2.70\n");
                printer.printNormal(2, "\033|bCSEGUNDA\t\t");
                printer.printNormal(2, "Servico Lavandaria\t\t\t5.00\n");*/
                    printer.printNormal(2, "\n");

                }
            }
            printer.printNormal(2, "  Artigos      "+Double.valueOf(trx.totalPecas).intValue()+"\n");
            printer.printNormal(2, "  \033|2CTotal            "+decimalFormat.format(trx.totalEuros)+"\n");
            //Se Credito -> Aparece Credito, Se debito aparece EURO
            if("owe".equals(trx.statusTrx))
                printer.printNormal(2, "  \033|2CCREDITO          "+decimalFormat.format(trx.totalEuros)+"\n");
            else
                printer.printNormal(2, "  \033|2CEUROS            "+decimalFormat.format(trx.totalEuros)+"\n");
            printer.printNormal(2, "\n");

            printer.printNormal(2, "\033|cAIva incluido a taxa em vigor (23%)\n\n");
            printer.printNormal(2, "\033|cADeve levantar os artigos em 30 dias. Obrigado!\n");
            printer.printNormal(2, "\n");
            printer.printNormal(2, "\n");

            String m = String.format("%02d", trx.month+1);
            String d = String.format("%02d", trx.day);
            Date date = new Date();
            date.setTime(trx.dateTrx);

            printer.printNormal(2, "\033|cA"+dateFormat.format(date)+"\n");
            printer.printNormal(2, "\033|cA"+trx.dateTrx+"\n");

            printer.printNormal(2, "\n\n\n");

            printer.cutPaper(100);

            //Way to send ESC/POS sequence
//			printer.printNormal(2,"\033|2E\033\036");

            printer.transactionPrint(2, POSPrinterConst.PTR_TP_NORMAL);


        } catch(Exception e) {
            throw e;
        } finally {
            try {

                printer.setDeviceEnabled(false);

                printer.release();

                printer.close();

            }
            catch (Exception e) {
                throw e;
            }
        }
    }
}
