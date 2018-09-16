/**
 *
 * Generic functions for eurostat statistics
 * Dependence: jquery 3.1.0
 *
 * @author julien Gaffuri
 *
 */
(function($, EstLib) {

	//build dropdown list for geographic codes
	EstLib.buildGeoList = function(geoList, geos, geoToNameFun, geoValue, changeFun, width, height){
		geoToNameFun = geoToNameFun || function(a){return a;};

		//sort by name
		geos.sort(EstLib.geoComparison(geoToNameFun));

		//sort aggregates and countries
		var geosA = [], geosC = [];
		for(var i=0; i<geos.length; i++)
			if(EstLib.isGeoAggregate(geos[i]))
				geosA.push(geos[i]);
			else
				geosC.push(geos[i]);

		//build option group for aggregates
		var optgroupA = $("<optgroup>").attr("label", "European aggregates").appendTo(geoList);
		for(i=0; i<geosA.length; i++)
			$("<option>").attr("value",geosA[i]).text( geoToNameFun(geosA[i]) ).appendTo(optgroupA);

		//build option group for countries
		var optgroupC = $("<optgroup>").attr("label", "Countries").appendTo(geoList);
		for(i=0; i<geosC.length; i++)
			$("<option>").attr("value",geosC[i]).text( geoToNameFun(geosC[i]) ).appendTo(optgroupC);

		$('#geoList option[value='+geoValue+']').attr('selected', 'selected');
		geoList
			.selectmenu({change:changeFun,width:width||"auto"})
			.selectmenu("menuWidget").css("height",(height||200)+"px");
	};

	//build a time slider element
	EstLib.buildTimeSlider = function(sli, times, timeValue, labelInterval, changeFun){
		sli.slider({
			min: +times[0],
			max: +times[times.length-1],
			step: 1,
			value: timeValue,
			change: changeFun
			//slide: function() { timeSel= ""+sli.slider("value"); update(); }
		}).each(function() {
			var opt = $(this).data().uiSlider.options;
			var www = opt.max - opt.min;
			for (var i = opt.min; i <= opt.max; i+=labelInterval)
				sli.append( $('<label>' + i + '</label>').css('left', ((i-opt.min)/www*100) + '%') );
		});
	};


	EstLib.loadingImage = function(config){
		config = config || {};
		config.imgsrc = config.imgsrc || "https://cdn.jsdelivr.net/gh/eurostat/eurostat.js@0.1/img/loading.png";
		config.alttxt = config.alttxt || "Loading...";

		var ldiv = $("<div>").css({"width":"100%","height":"100%","top":"0","left":"0","position":"fixed","display":"block","opacity":"0.7","background-color":"#fff","z-index":"99","text-align":"center"}).appendTo("body");
		$("<img>").attr("src", config.imgsrc).attr("alt", config.alttxt).css({"position":"absolute","top":"50%","left":"50%","z-index":"100"}).appendTo(ldiv);

		return ldiv;
	};

	
}(jQuery, window.EstLib = window.EstLib || {} ));
