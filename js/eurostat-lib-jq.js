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



	//get all file names in a folder and execute a function once found
	EstLib.getFileNames = function(folder, callBack){
		$.when( $.ajax({ url: folder })
		).then(function(data) { callBack(EstLib.getFileNamesFromData(data)); });
	};
	EstLib.getFileNamesFromData = function(data){
		var fileNames = [];
		var chunks = data.split("<script>addRow(\"");
		for(var j=2; j<chunks.length; j++)
			fileNames.push( chunks[j].split("\",\"")[0] );
		return fileNames;
	};


	/**
	 * Try to fill page elements with dictionnary terms
	 * @param{object} dict
	 */
	EstLib.writeText = function(dict){
		for (var p in dict) {
			var elt = $("#"+p);
			if(elt) elt.html(dict[p]);
		}
	};
	


	EstLib.loadAutoComplete = function(id, data, minLength){
		$( "#"+id )
		// don't navigate away from the field on tab when selecting an item
		.bind( "keydown", function( event ) {
			if ( event.keyCode === $.ui.keyCode.TAB &&
					$( this ).autocomplete( "instance" ).menu.active ) {
				event.preventDefault();
			}
		})
		.autocomplete({
			minLength: minLength,
			source: function( request, response ) {
				// delegate back to autocomplete, but extract the last term
				response( $.ui.autocomplete.filter(
						data, EstLib.extractLast( request.term ) ) );
			},
			focus: function() { return false; },
			select: function( event, ui ) {
				var terms = EstLib.split( this.value );
				// remove the current input
				terms.pop();
				// add the selected item
				terms.push( ui.item.value );
				// add placeholder to get the comma-and-space at the end
				terms.push( "" );
				this.value = terms.join( ", " );

				//ensures new input is checked
				$(this).trigger("input");

				return false;
			}
		})
		.autocomplete( "instance" )._renderItem = function( ul, item ) {
			return $("<li>")
			.append( "<a>" + item.label + "</a>" )
			.appendTo(ul);
		};
	};


	EstLib.loadAutoCompleteRemote = function(id, data, minLength, cacheLoadFunction){
		$( "#"+id )
		// don't navigate away from the field on tab when selecting an item
		.bind( "keydown", function( event ) {
			if ( event.keyCode === $.ui.keyCode.TAB &&
					$( this ).autocomplete( "instance" ).menu.active ) {
				event.preventDefault();
			}
		})
		.autocomplete({
			minLength: minLength,
			source: function(request, response) {
				var term = EstLib.extractLast(request.term);
				if(!term || term.length<minLength) return;
				$.when(
						EstLib.ajax({data:data+term + "%25"} )
				).then(function(data) {
					//for(var i=0; i<data.length; i++) data[i].VALUE = EstLib.replaceAll(data[i].VALUE, ",", " -");
					response( EstLib.arrayKeysToLowerCase(data) );
				}, function(XMLHttpRequest, textStatus) { console.warn(textStatus); }
				);
			},
			focus: function() { return false; },
			select: function( event, ui ) {
				var terms = EstLib.split( this.value );
				// remove the current input
				terms.pop();
				// add the selected item
				terms.push( ui.item.value );
				// add placeholder to get the comma-and-space at the end
				terms.push( "" );
				this.value = terms.join( ", " );

				//load into cache
				if(cacheLoadFunction) cacheLoadFunction(ui.item.id, true);

				//ensures new input is checked
				$(this).trigger("input");

				return false;
			}
		});
	};



	/**
	 * @param{string} fillColor
	 * @param{string} text
	 * @param{string} ttp
	 * @return{string}
	 */
	EstLib.getLegendItem = function(fillColor, text, ttp){
		var d = $("<div>");

		/*var svg = $("<svg>").attr("width",130).attr("height",15).attr("title",ttp);
		 $("<rect>").attr("width",20).attr("height",15).attr("style","fill:"+fillColor+";stroke-width:1px;stroke:#aaa").appendTo(svg);
		 $("<text>").attr("x",25).attr("y",13).attr("fill","black").html(text).appendTo(svg);
		 d.append(svg);*/
		d.append(
				"<svg width=130 height=15 title='"+ttp+"'>" +
				"<rect width=20 height=15 style='fill:"+fillColor+";stroke-width:1px;stroke:#aaa' />" +
				"<text x=25 y=13 fill=black>"+text+"</text>" +
				"</svg>"
		);
		return d;
	};

}(jQuery, window.EstLib = window.EstLib || {} ));
