/**
 *
 * Generic functions for income distribution visualisations
 *
 * @author julien Gaffuri
 *
 */
(function($, EstLib) {

    //some quantile data
    EstLib.quantileDict = {P:{percentage:1,text:"percent"},T:{percentage:5,text:"twentieth"},F:{percentage:4,text:"twentyfifth"},D:{percentage:10,text:"tenth"}};

    //translation dictionnary
    //TODO add german translation
    EstLib.dictIncomeDistr = {
        en:{
            title:"Income disparities in Europe",
            title1:"Income disparities",
            title2:"in",
            countryText:"Country",
            yearText:"Year",
            avincome:"Average income",
            lowincome:"Lowest incomes",
            higincome:"Highest incomes",
            incomelev:"Income level",
            incomeof:"The income of the",
            ofpopwith:"of the population with the",
            lowest:"lowest",
            highest:"highest",
            incomeis:"income is",
            oftotal:"of the total country income",
            ifincomewas:"If the country income was equally distributed, it would be",
            thisincis:"This income is",
            times:"times",
            higher:"higher",
            lower:"lower",
            thanav:"than the average income",
            percent:"percent",
            twentieth:"twentieth",
            twentyfifth:"twentyfifth",
            tenth:"tenth",
            sourceTxt:"Sources: <a href='http://ec.europa.eu/eurostat/'>Eurostat</a> databases on income distribution (<a href='http://ec.europa.eu/eurostat/web/income-and-living-conditions/overview'>EU-SILC</a>). More information <a href='http://ec.europa.eu/eurostat/statistics-explained/index.php/Income_distribution_statistics'>here</a>.",
            focusCntr:"Focus on country comparison.",
            nodata:"No data",
            thisincomeis:"This income is",
            negativ:"negative"
        },
        fr:{
            title:"Disparités de revenus en Europe",
            title1:"Disparités de revenus",
            title2:"en",
            countryText:"Pays",
            yearText:"Année",
            avincome:"Revenu moyen",
            lowincome:"Bas revenus",
            higincome:"Hauts revenus",
            incomelev:"Niveau de revenu",
            incomeof:"Les revenus du",
            ofpopwith:"de la population avec les",
            lowest:"plus bas",
            highest:"plus hauts",
            incomeis:"revenus est",
            oftotal:"du total des revenus du pays",
            ifincomewas:"Si les revenus étaient équitablement répartis, ce serait",
            thisincis:"Ces revenus sont",
            times:"fois",
            higher:"plus hauts",
            lower:"plus bas",
            thanav:"que le revenu moyen",
            percent:"pourcent",
            twentieth:"vingtième",
            twentyfifth:"vingtcinquième",
            tenth:"dixième",
            sourceTxt:"Sources : Bases de données <a href='http://ec.europa.eu/eurostat/'>Eurostat</a> sur la répartition des revenus (<a href='http://ec.europa.eu/eurostat/web/income-and-living-conditions/overview'>EU-SILC</a>). Plus d'information <a href='http://ec.europa.eu/eurostat/statistics-explained/index.php/Income_distribution_statistics'>ici</a>.",
            focusCntr:"Comparaison par pays.",
            nodata:"Pas de données",
            thisincomeis:"Ces revenus sont",
            negativ:"negatifs"
        },
        de:{
            title:"Einkommensungleichheiten in Europa",
            title1:"Einkommensungleiheiten",
            title2:"de",
            countryText:"Land",
            yearText:"Jahre",
            avincome:"durchschnittliches Einkommen",
            lowincome:"Niedriege Einkommen",
            higincome:"Hoche Einkommen",
            incomelev:"Einkommensniveau",
            incomeof:"Einkommen",
            ofpopwith:"den Leuten mit",
            lowest:"niedrigsten",
            highest:"höchsten",
            incomeis:"Einkommen ist",
            oftotal:"der nationaler Einkommensgesamt",
            ifincomewas:"Wenn die Einkommen gleichheitig verteilt worden, wäre es",
            thisincis:"Diese Einkommen sind",
            times:"mal",
            higher:"höcher",
            lower:"niedriger",
            thanav:"als das durchschnittliches Einkommen",
            percent:"Prozent",
            twentieth:"zwanzigste",
            twentyfifth:"fünf-und-zwanzigste",
            tenth:"zenste",
            sourceTxt:"Quelle: Datenbank <a href='http://ec.europa.eu/eurostat/'>Eurostat</a> über die Einkommensverteilung (<a href='http://ec.europa.eu/eurostat/web/income-and-living-conditions/overview'>EU-SILC</a>). Mehrere Informationen <a href='http://ec.europa.eu/eurostat/statistics-explained/index.php/Income_distribution_statistics'>hier</a>.",
            focusCntr:"Ländervergleich.",
            nodata:"Keine Daten",
            thisincomeis:"Diese Einkommen sind",
            negativ:"negativ"
        }
    };



    //check presence of percentile data (if they are all equal to 0 and none is equal to null)
    var percentileDataPresent = function(dataObj, first){
        var nbs = first? [1,2,3,4,5] : [95,96,97,98,99,100], i;
        for(i=0;i<nbs.length;i++) if(dataObj["P"+nbs[i]] == null) return false;
        for(i=0;i<nbs.length;i++) if(dataObj["P"+nbs[i]] != 0) return true;
        return false;
    };

    //build data array
    EstLib.getDataObj = function(data, geo, time){
        var dataObj = {}, i, obj = {currency:"EUR",indic_il:"SHARE",time:time,geo:geo,quantile:""};
        //deciles
        for(i=1;i<=10;i++) { obj.quantile="D"+i; dataObj[obj.quantile] = data.Data(obj)?data.Data(obj).value : 0; }
        //first percentiles
        for(i=1;i<=5;i++) { obj.quantile="P"+i; dataObj[obj.quantile] = data.Data(obj)?data.Data(obj).value : 0; }
        //last percentiles
        for(i=95;i<=100;i++) { obj.quantile="P"+i; dataObj[obj.quantile] = data.Data(obj)?data.Data(obj).value : 0; }
        //compute second twentile as first decile value minus five first percentiles values
        dataObj.T2 = dataObj.D1; for(i=1;i<=5;i++) dataObj.T2 -= dataObj["P"+i];
        dataObj.T2 = Math.round(dataObj.T2*10)/10;
        //compute 19th twentile value as last decile value, minus five last percentiles values
        dataObj.F19 = dataObj.D10; for(i=95;i<=100;i++) dataObj.F19 -= dataObj["P"+i];
        dataObj.F19 = Math.round(dataObj.F19*10)/10;
        //remove decile data when corresponding percentiles are available
        if(percentileDataPresent(dataObj, true)) {
            dataObj.D1=0;
        } else {
            for(i=1;i<=5;i++) dataObj["P"+i] = 0;
            dataObj.T2=0;
        }
        if(percentileDataPresent(dataObj, false)) {
            dataObj.D10=0;
        } else {
            for(i=95;i<=100;i++) dataObj["P"+i] = 0;
            dataObj.F19=0;
        }
        return dataObj;
    };

    //check presence of data (if at least one is defined and non null)
    EstLib.dataPresence = function(dataObj){
        for(var k in dataObj) {
            var v = dataObj[k];
            if(v != null && v != 0) return true;
        }
        return false;
    };



    //build the text to explain a chart rectangle corresponding to a quantile
    EstLib.getRectText = function(qu, value, dict, lg){
        var html = [], quantileNb = +qu.substring(1,qu.length), q = EstLib.quantileDict[qu.charAt(0)],
            lowestIncome = 100/(quantileNb*q.percentage) >= 2, coeff = value/q.percentage
        html.push(
            dict.incomeof, " <b>",
            EstLib.getNumbered(lowestIncome?quantileNb:100/q.percentage-quantileNb+1, lg),
            " ", dict[q.text], "</b> ",dict.ofpopwith," ", lowestIncome?dict.lowest:dict.highest,
            " ",dict.incomeis," <b>", value, "%</b> ",dict.oftotal,".","<br>"
        );
        if(value<0)
            html.push(
                dict.thisincomeis," ","<b><span style='color: crimson'>",dict.negativ,"</span></b>","."
            );
        else
            html.push(
                dict.ifincomewas," <b>", q.percentage, "%</b>. ",dict.thisincis," ",
                coeff>2||coeff<0.5?"<span style='color: crimson'>":"",
                "<b>", Math.round(10*(coeff>1?coeff:1/coeff))/10, " ",dict.times," ",
                coeff>1?dict.higher:dict.lower, "</b>", coeff>2||coeff<0.5?"</span>":"", " ",dict.thanav,"."
            );
        return html.join("");
    };


}(jQuery, window.EstLib = window.EstLib || {} ));

