/**
 * 
 * Generic functions for eurostat price statistics
 * 
 * @author julien Gaffuri
 *
 */
(function($, EstLib) {

	//factorise code on indicators, get counrtry list, get COICOPs list, etc.

	//geo aggregates
	EstLib.getGeoAggregates = function(){ return ["EA","EA17","EA18","EA19","EEA","EU","EU27","EU28"]; };

	//coicop aggregates
	EstLib.getCoicopPure = function(coicopsDict){
		coicopsDict = coicopsDict || EstLib.coicopsDict;
		var cs = Object.keys(coicopsDict);
		var out = [];
		for(var i=0;i<cs.length;i++){
			var c = cs[i];
			if(c.substring(0,2)==="CP") out.push(c);
		}
		return out;
	};

	//conversion from/to estat months to/from ms date format
	EstLib.prMonthToRTime = function(prMonth){
		return moment(prMonth.replace("M","-"), "YYYY-MM").diff([1970,00,-15])*0.001;
	};
	EstLib.rTimeToPrMonth = function(rTime){
		return moment(rTime*1000).format("YYYY-MM").replace("-","M");
	};


	//fill a selection list with coicop + aggregates
	EstLib.fillCoicopList = function(coicopList, indentChar, coicopDict){
		indentChar = indentChar || "---";
		coicopDict = coicopDict || EstLib.coicopsDict;
		var optG;
		optG = $("<optgroup>").attr("label", "COICOP codes").appendTo(coicopList);
		EstLib.addCoicopItemRec(optG,"CP00",indentChar,0,false,false,coicopDict);
		optG = $("<optgroup>").attr("label", "Special aggregates").appendTo(coicopList);
		EstLib.addCoicopItemRec(optG, "GD",indentChar,0,true,false,coicopDict);
		EstLib.addCoicopItemRec(optG, "SERV",indentChar,0,true,false,coicopDict);
		EstLib.addCoicopItemRec(optG, "AP",indentChar,0,true,false,coicopDict);
		EstLib.addCoicopItemRec(optG, "NRG_FOOD_S",indentChar,0,true,true,coicopDict);
		EstLib.addCoicopItemRec(optG, "NRG_FOOD_NP",indentChar,0,true,true,coicopDict);
		EstLib.addCoicopItemRec(optG, "FROOPP",indentChar,0,true,true,coicopDict);
		for(coicop in coicopDict)
			if(coicop.substring(0,3)==="TOT")
				EstLib.addCoicopItemRec(optG, coicop,indentChar,0,true,true,coicopDict);
	};
	EstLib.addCoicopItemRec = function(optionList, coicop, indentChar, indentNb, escapeCoicop, escapeChildren, coicopDict){
		indentChar = indentChar || "---";
		indentNb = indentNb || 0;
		coicopDict = coicopDict || EstLib.coicopsDict;
		var indent = new Array(indentNb + 1).join(indentChar);
		$("<option>").attr("value",coicop).text( indent +" "+ coicop + " - " + coicopDict[coicop].desc ).appendTo(optionList);
		if(escapeChildren) return;
		var children = coicopDict[coicop].children; children.sort();
		for(var i=0; i<children.length; i++){
			var child = children[i];
			if(escapeCoicop && child.substring(0,2)==="CP") continue;
			EstLib.addCoicopItemRec(optionList, child, indentChar, indentNb+1, escapeCoicop, escapeChildren, coicopDict);
		}
	};


	EstLib.sourcesFPMTDict = {
			ACP:"Agricultural Commodity Price",
			PPI:"Producer Price",
			HICP:"Consumer Price",
			IPI:"Import Price"
	};

	//fill a selection list with sources (for FPMT)
	EstLib.fillSourceOption = function(sourceOption){
		for (c in EstLib.sourcesFPMTDict) {
			//$("<option>").attr("value",c).text(EstLib.sourcesFPMTDict[c]).appendTo(sourceList);
			//<input type="radio" name="interp" id="linear" value="linear" checked>
			//<label for="linear">Linear</label>
			$("<input>").attr("type","radio").attr("name",sourceOption.attr("id")).attr("id",c).attr("value",c).appendTo(sourceOption);
			$("<label>").attr("for",c).text(EstLib.sourcesFPMTDict[c]).appendTo(sourceOption);
		}
	};

	//re reference an index time series
	EstLib.rereference = function(ds, refYearNew, dsKey){
		//compute re-referencing factor
		var f=0; nb=0;
		for(var i=1; i<=12; i++){
			var d = ds.Data({time:refYearNew+"M"+EstLib.getMonthTXT(i)});
			if(!d || d.length || (d.value!=0 && !d.value)) continue;
			f += d.value; nb++;
		}
		if(nb==0) {
			console.log("Cannot re-reference " + (dsKey+" "||"") + " to " + refYearNew);
			return;
		}
		f *= 0.01/nb;
		if(f == 1 ) return;

		//scale the values
		for(i=0; i<ds.value.length; i++) {
			if(ds.value[i]==null) continue;
			ds.value[i] /= f;
		}
	};

	//fill a div with COICOP legend
	EstLib.buildCOICOPLegend = function(lgd, coicopToColor, mouseoverFun, mouseoutFun){
		var coicops = Object.keys(EstLib.coicopsDict);
		for(var i=0; i<coicops.length; i++){
			var coi = coicops[i];
			if(coi==="CP00" || coi.length>4 || coi.substring(0,2)!=="CP") continue;
			var svgLg = $("<svg>").attr("width",500).attr("height",15);
			var rect = $("<rect>").attr("id","lgdEltRect"+coi).attr("width",20).attr("height",15).css("fill",coicopToColor(coi)).css("stroke-width",1).css("stroke","gray");
			rect.appendTo(svgLg);
			$("<text>").attr("transform","translate(25,12)").text( coi + " - " + EstLib.coicopsDict[coi].desc ).appendTo(svgLg);
			$("<div>").attr("id","lgdElt"+coi).append(svgLg).appendTo(lgd); //attach id to that instead
		}
		lgd.html(function(){return this.innerHTML;}); //TODO check that - or move to d3
		for(i=0; i<coicops.length; i++){
			coi = coicops[i];
			if(coi==="CP00" || coi.length>4 || coi.substring(0,2)!=="CP") continue;
			$("#lgdElt"+coi).mouseover(mouseoverFun);
			$("#lgdElt"+coi).mouseout(mouseoutFun);
		}
	};


	//do various modifications to coicop hierarchy
	EstLib.modifyCoicopHierarchy = function(simplifyNames, addRootSA){
		simplifyNames = simplifyNames || true;
		addRootSA = addRootSA || true;

		if(EstLib.coicopsDict["CP082_083"])
			EstLib.coicopsDict["CP08"].children = ["CP081","CP082", "CP083"];
		if(EstLib.coicopsDict["SERV_COM"])
			EstLib.coicopsDict["SERV_COM"].children = ["CP081","CP082", "CP083"];

		if(simplifyNames){
			EstLib.coicopsDict["SERV"].desc = "Services";
			EstLib.coicopsDict["FOOD"].desc = "Food";
		}

		//add special aggregate root
		if(addRootSA) EstLib.coicopsDict["SA"] = {desc:"", parents:[], children:["SERV", "NRG", "FOOD", "IGD_NNRG"]};
	};


	//load necessary data (if needed) and perform callBack action
	//month(YYYYMM) - geo - coicop
	EstLib.loadMonthlyData = function(dataDict, monthKey, folder, callBack){
		//data already loaded
		if(dataDict[monthKey]) {
			callBack();
			return;
		}

		EstLib.getFileNames(folder, function(fileNames){
			//create ajax object for all files
			var ajaxs = [];
			for(var j=0; j<fileNames.length; j++)
				ajaxs.push( $.ajax({ url: folder + fileNames[j] }) );
			//TODO remove double - take into account version number

			$.when.apply($, ajaxs)
			.then(function() {
				dataDict[monthKey] = {};
				for(var i=0; i<arguments.length; i++){
					var cntrData = (arguments[i][0]?arguments[i][0]:arguments[0]).split("\n");
					if(cntrData.length == 0) continue;
					var i_ = 0;
					var cntr3 = cntrData[i_].trim().substring(0,3);
					while(cntr3 === "CPR" || cntr3 === "CPX" || cntr3 === "NAM" || !cntr3.trim()) cntr3 = cntrData[++i_].trim().substring(0,3);
					var cntr3 = cntrData[i_].replace(" ","").replace("\"","").replace("INDEX.","").split(".")[0];
					var cntr2 = EstLib.countryCodes3To2[cntr3];
					if($.inArray(cntr2, ["ME","RS","MK"])>-1) continue;
					if(!cntr2){ console.log("unknown country code: "+cntr3); continue; }
					dataDict[monthKey][cntr2] = {};
					for(var j=0; j<cntrData.length; j++){
						var d = cntrData[j].trim().replace("INDEX."+cntr3+".","");
						d=EstLib.replaceAll(d," ",""); d=EstLib.replaceAll(d,"\"",""); d=EstLib.replaceAll(d,"\t","");
						if(d.length == 0) continue;
						var sp = d.split(";");
						var coicop = sp[0];
						//TODO include "0711A","0711B","04115"
						if(!coicop.trim() || $.inArray(coicop, ["EMBARGO","embargo","NAME","0711A","0711B","04115"])>-1 || $.inArray(coicop.substring(0,3), ["CPR","CPX"])>-1) continue;
						//handle exceptions
						coicop = 
							coicop.replace("1212_3","1212_1213").replace("0531_2","0531_0532").replace("0621_3","0621_0623").replace("0612_3","0612_0613")
							.replace("0953_4","0953_0954").replace("0934_5","0934_0935").replace("0921_2","0921_0922")
							.replace("0712_34","0712-0714").replace("08x","082_083").replace("08X","082_083").replace("0820","082").replace("0830","083")
							;
						coicop = "CP"+coicop;
						var coicop_ = EstLib.coicopsDict[coicop];
						if(!coicop_) {console.log("Unknown coicop code for "+cntr2+": "+coicop);continue;}
						var val = +(sp[2].replace(",","."));
						if(isNaN(val)) {console.log("Non-numerical value for "+cntr2+" and "+coicop+": "+sp[2]);continue;}
						dataDict[monthKey][cntr2][coicop] = val;
						//TODO get flag as-well
					}
				}
				callBack();
			});
		});
	};

	//get coicop groups (due to limitation in eurostat web service)
	EstLib.getSlicedCOICOPList = function(nb){
		nb = nb || 50;
		var coicops = Object.keys(EstLib.coicopsDict);
		var coicops_ = [];
		for(var i=0; i<(coicops.length/nb); i++)
			coicops_[i] = coicops.slice(i*nb, Math.min((i+1)*nb,coicops.length));
		return coicops_;
	};


	EstLib.getProductWeightData = function(geoSel, yearSel, dataIndex, callback) {
		if(geoSel && dataIndex[yearSel] && dataIndex[yearSel][geoSel])
			callback();
		else if(!geoSel && dataIndex[yearSel])
			callback();
		else {
			//no data: get it!
			//build query objects - by year/coicop
			var ajaxs = [];

			//get coicop groups (due to limitation in eurostat web service)
			var coicops_ = EstLib.getSlicedCOICOPList();

			for(var i=0; i<coicops_.length; i++)
				if(geoSel) ajaxs.push( $.ajax({url:EstLib.getEstatDataURL("prc_hicp_inw",{geo:geoSel,time:yearSel,coicop:coicops_[i]})}) );
				else ajaxs.push( $.ajax({url:EstLib.getEstatDataURL("prc_hicp_inw",{time:yearSel,coicop:coicops_[i]})}) );
			//get data
			$.when.apply($, ajaxs)
			.then(function() {
				//extract data
				for(var i=0; i<arguments.length; i++){
					var data = arguments[i][0];
					var ds = JSONstat(data).Dataset(0);
					var geos = ds.Dimension("geo").id;
					var year = ds.Dimension("time").id[0];
					var coicops = ds.Dimension("coicop").id;
					for(var k=0; k<geos.length; k++){
						var geo = geos[k];
						for(var j=0; j<coicops.length; j++){
							var coicop = coicops[j];
							var d = ds.Data({time:year,geo:geo,coicop:coicop});
							var v = 0;
							if(d && d.value) v = d.value;
							if(!dataIndex[year]) dataIndex[year]={};
							if(!dataIndex[year][geo]) dataIndex[year][geo]={};
							dataIndex[year][geo][coicop] = v;
						}
					}
				}

				//
				callback();
			}, function() {
				console.log("Could not load data for " + geoSel + " " + yearSel); //TODO better
			});		
		}
	};

}(jQuery, window.EstLib = window.EstLib || {} ));
