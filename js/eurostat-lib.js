/**
 *
 * Generic functions for eurostat statistics
 *
 * @author julien Gaffuri
 *
 */
(function(EstLib) {

	//official colors for Eurostat logo and statistical domains
	EstLib.color = {
			logo:{gray:"#787878",blue:"#004494",yellow:"#FFF100"},
			theme:{genreg:"#466eb4",ecofin:"#af4b91",popsoc:"#e6a532",indtradserv:"#00a0e1",agrifish:"#7daf4b",trade:"#b93c46",transp:"#961e2d",envener:"#41afaa",scitech:"#d7642d"}
	}


	//load generic url parameters
	EstLib.loadURLParameters = function() {
		var opts = {};
		var p = ["w","s","lvl","time","proj","y","clnb","lg","type"];
		for(var i=0; i<p.length; i++)
			opts[p[i]] = EstLib.getParameterByName(p[i]);
		return opts;
	};

	
	
	EstLib.getEstatRestDataURLBase = "https://ec.europa.eu/eurostat/wdds/rest/data/";

	
    /**
     * Build URL to fetch data from eurobase REST API.
     * @param {string} table The Eurobase table code
     * @param {object=} params The query parameters as fro example: {key:value,key:[value1,value2,value3]}
     * @param {number=} language
     * @param {number=} format
     * @param {number=} version
     */
	EstLib.getEstatDataURL = function(table, params, language, format, version){
		language = language || "en";
		format = format || "json";
		version = version || "2.1";
		var url = [];
		url.push(EstLib.getEstatRestDataURLBase,"v",version,"/",format,"/",language,"/",table,"?");
		if(params)
			for (var param in params) {
				var o = params[param];
				if(Array.isArray(o))
					for(var i=0;i<o.length;i++)
						url.push("&",param,"=",o[i]);
				else url.push("&",param,"=",o);
			}
		url = url.join("");
		//console.log(url);
		return url;
	};

	EstLib.getMonthTXT = function(monthInt){
		return monthInt<=9?"0"+monthInt:""+monthInt;
	};

	//override country names, to shorter ones
	EstLib.overrideCountryNames = function(dict, lg){
		lg = lg || "en";
		var data;
		if(dict.EA) dict.EA = {en:"Euro area",fr:"Zone euro",de:"Euroraum"}[lg];
		if(dict.EU) dict.EU = {en:"European Union", fr:"Union européenne", de:"Europäische Union"}[lg];
		if(dict.EEA) dict.EEA = {en:"European Economic Area", fr:"Espace économique européen", de:"Europäischer Wirtschaftsraum"}[lg];
		if(dict.DE) dict.DE = {en:"Germany", fr:"Allemagne", de:"Deutschland"}[lg];
		if(dict.MK) dict.MK = {en:"Macedonia (FYRM)", fr:"Macédoine", de:"Mazedonien"}[lg];//"Macedonia (FYRM)";
	};

	//check if a country code is a geographic aggregate
	EstLib.isGeoAggregate = function(geo){
		return geo.indexOf("EA") > -1 || geo.indexOf("EU") > -1 || geo.indexOf("NMS") > -1;
	};

	//comparison function to be used to sort country lists based on names.
	EstLib.geoComparison = function(geoToNameFun){
		geoToNameFun = geoToNameFun || function(a){return a;};
		return function(g1, g2) {
			if(EstLib.isGeoAggregate(g1) && !EstLib.isGeoAggregate(g2)) return 1;
			if(!EstLib.isGeoAggregate(g1) && EstLib.isGeoAggregate(g2)) return -1;
			var g1_ = geoToNameFun(g1);
			var g2_ = geoToNameFun(g2);
			return g1_.localeCompare(g2_);
		}
	};

	//Official country order to be used in Eurostat dissemination
	EstLib.geoOrderedList = ["EU","EU28","EU27","EU15","EA","EA19","EA18","NMS12","EA17","EA12","BE","BG","CZ","DK","DE","EE","IE","EL","ES","FR","HR","IT","CY","LV","LT","LU","HU","MT","NL","AT","PL","PT","RO","SI","SK","FI","SE","UK","IS","LI","NO","CH","ME","MK","AL","RS","TR","US","JP","MX"];
	//comparison function to use to sort countries based on official order
	EstLib.geoComparisonEstatPublications = function(g1, g2) { return EstLib.geoOrderedList.indexOf(g1) - EstLib.geoOrderedList.indexOf(g2); };


	//conversion from country codes 3 to 2
	EstLib.countryCodes3To2 = {AUT:"AT",BEL:"BE",CHE:"CH",CYP:"CY",CZE:"CZ",DEU:"DE",EST:"EE",GRC:"EL",HRV:"HR",FRA:"FR",HUN:"HU",IRL:"IE",ISL:"IS",LTU:"LT",LUX:"LU",LVA:"LV",MKD:"MK",MLT:"MT",NLD:"NL",NOR:"NO",SVN:"SI",BGR:"BG",DNK:"DK",ESP:"ES",POL:"PL",ITA:"IT",PRT:"PT",ROU:"RO",ROM:"RO",SVK:"SK",FIN:"FI",SWE:"SE",GBR:"UK",TUR:"TR",MNE:"ME",SRB:"RS",USA:"US"};

	


	/**
	 * @template T
	 * @param {Array.<T>} arr
	 * @param {string} indexAtt
	 * @returns {Object.<string, T>}
	 */
	EstLib.index = function(arr, indexAtt){
		var out={};
		for(var i=0, nb=arr.length; i<nb; i++){
			var obj = arr[i];
			out[obj[indexAtt]]=obj;
		}
		return out;
	};

	/**
	 * @template T
	 * @param {Array.<T>} js
	 * @param {string} indexColumn
	 * @returns {Object.<string, Array.<T>>}
	 */
	EstLib.indexMultiple = function(js, indexColumn){
		var out={};
		for(var i=0, nb=js.length; i<nb; i++){
			var obj = js[i];
			var list = out[obj[indexColumn]];
			if(!list)
				out[obj[indexColumn]]=[obj];
			else
				list.push(obj);
		}
		return out;
	};

	/**
	 * [{id:"fsdf",val:"tralala"},{id:"154",val:"foo"}] to {fsdf:"tralala",154:"foo"}
	 * @param {Array} array
	 * @param {string} id
	 * @param {string} val
	 * @returns {Object}
	 */
	EstLib.index1 = function(array, id, val){
		var out={};
		for(var i=0, nb=array.length; i<nb; i++){
			var o = array[i];
			out[o[id]] = o[val];
		}
		return out;
	};

	/**
	 * {"1":"FULL","2":"EMPTY","3":"AVAILABLE","4":"NA"}
	 * to
	 * [{id:"1",label="FULL"},{id:"2",label="EMPTY"},{id:"3",label="AVAILABLE"},{id:"4",label="NA"}]
	 * @param {Object.<string, string>} index
	 * @returns {Array.<{id:string,label:string}>}
	 */
	EstLib.index1ToIdLabel = function(index){
		var out = [];
		var keys = Object.keys(index);
		for(var i=0, nb=keys.length; i<nb; i++){
			var id = keys[i];
			out.push({id:id,label:index[id]});
		}
		return out;
	};


}(window.EstLib = window.EstLib || {} ));
