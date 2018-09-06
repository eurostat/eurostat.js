/**
 *
 * Generic functions
 *
 * @author julien Gaffuri
 *
 */
(function($, EstLib) {

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

	/**
	 * @param cache
	 * @param key
	 * @param{{url:string,type:string,data:string=,wtok:boolean=}} quArgs
	 * @param matrix
	 * @return {*}
	 */
	EstLib.getFromCache = function(cache, key, quArgs, matrix){
		var obj = cache[key];
		if(!obj){
			if(!quArgs){
				console.warn("Could not retrieve object from cache with id "+key);
				//console.warn(cache);
				cache[key]={};
				return cache[key];
			}
			var objs = JSON.parse(EstLib.syncRequest(quArgs));
			if(matrix)
				if(objs.length === 0){
					console.warn("Could not retrieve object from:");
					console.warn(quArgs);
					obj={};
				}
				else obj=objs[0];
			else
				obj=objs;
			cache[key]=obj;
		}
		return obj;
	};

	EstLib.loadIntoCache = function(data, cache, keyField){
		for(var i=0; i<data.length; i++){
			var obj = data[i];
			cache[obj[keyField]]=obj;
		}
	};

	/**
	 * @param {string} name
	 * @returns {string}
	 */
	EstLib.getParameterByName = function(name) {
		name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
		var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
			results = regex.exec(location.search);
		return !results? null : decodeURIComponent(results[1].replace(/\+/g, " "));
	};

	/*
	 indexOfObjectInArray = function(arr, id, idProp) {
	 for(var i=0; i<arr.length; i++)
	 if (arr[i][idProp] === id) return i;
	 return -1;
	 };
	 */

	/*indexOfObjectProperty = function(obj, prop) {
	 var i=0;
	 for(var prop_ in obj) {
	 if(prop_ == prop) return i;
	 i++;
	 }
	 return -1;
	 };*/

	EstLib.serializeXmlNode = function(xmlNode) {
		if (typeof window.XMLSerializer != "undefined") {
			return (new window.XMLSerializer()).serializeToString(xmlNode);
		} else if (typeof xmlNode.xml != "undefined") {
			return xmlNode.xml;
		}
		return "";
	};

	/**
	 * @param{number} cX
	 * @param{number} cY
	 * @param{number} radius
	 * @param{number} aDeg
	 * @return {{x:number, y:number}}
	 */
	EstLib.polarToCartesian = function(cX, cY, radius, aDeg) {
		var aRad = aDeg * Math.PI / 180.0;
		return {
			x: cX + radius * Math.cos(aRad),
			y: cY + radius * Math.sin(aRad)
		};
	};

	/**
	 * @param{number} x
	 * @param{number} y
	 * @param{number} radius
	 * @param{number} startAngle
	 * @param{number} endAngle
	 * @return {string}
	 */
	EstLib.svgArc = function(x, y, radius, startAngle, endAngle){
		x = d3.round(x,3); y = d3.round(y,3);
		var start = EstLib.polarToCartesian(x, y, radius, endAngle);
		start.x = d3.round(start.x,3);
		start.y = d3.round(start.y,3);
		var end = EstLib.polarToCartesian(x, y, radius, startAngle);
		end.x = d3.round(end.x,3);
		end.y = d3.round(end.y,3);
		var arcSweep = endAngle - startAngle <= 180 ? "0" : "1";
		return [
			"M", start.x, start.y,
			"A", radius, radius, 0, arcSweep, 0, end.x, end.y,
			"L", x, y,
			"L", start.x, start.y
		].join(" ");
	};



	/*EstLib.setURLParameter = function(paramName, paramValue){
	 var url = window.location.href;
	 if (url.indexOf(paramName + "=") >= 0){
	 var prefix = url.substring(0, url.indexOf(paramName));
	 var suffix = url.substring(url.indexOf(paramName));
	 suffix = suffix.substring(suffix.indexOf("=") + 1);
	 suffix = (suffix.indexOf("&") >= 0) ? suffix.substring(suffix.indexOf("&")) : "";
	 url = prefix + paramName + "=" + paramValue + suffix;
	 }
	 else{
	 if (url.indexOf("?") < 0)
	 url += "?" + paramName + "=" + paramValue;
	 else
	 url += "&" + paramName + "=" + paramValue;
	 }
	 window.location.href = url;
	 };*/



	/**
	 * build random colors index based on unique values.
	 *
	 * @param{Object.<string, {}>} index
	 * @param{Object.<string,string>=} forceValues
	 * @return{Object.<string,string>}
	 */
	EstLib.getRandomColorsLegend = function(index, forceValues){
		forceValues = forceValues || {};
		var values = Object.keys(index);
		var colI = {};
		for(var i=0; i<values.length; i++){
			var val = values[i];
			var col = forceValues[val];
			if(col)
				colI[val] = col;
			else
				colI[val] = colorbrewer.Set1[9][i%9];
			//colI[val] = colorbrewer.Set3[12][i%12];
		}
		return colI;
	};

	//{key1="value1",key1="value1"} to {value1="key1",value2="key2"}
	EstLib.swap = function(obj) {
		var out = {};
		for(var prop in obj)
			if(obj.hasOwnProperty(prop))
				out[obj[prop]] = prop;
		return out;
	};

	//"a,b,c,d" to ["a","b","c","d"]
	EstLib.split = function(val) {
		return val.split( /,\s*/ );
	};

	//"a,b,c,d" to "d"
	EstLib.extractLast = function(term) {
		return EstLib.split( term ).pop();
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
	 * @param{object} obj
	 * @return {object}
	 */
	EstLib.objectKeysToLowerCase = function(obj){
		var key, keys = Object.keys(obj);
		var n = keys.length;
		var newobj={};
		while (n--) {
			key = keys[n];
			newobj[key.toLowerCase()] = obj[key];
		}
		return newobj;
	};

	/**
	 * @param {Array.<string>} array
	 * @return {Array.<string>}
	 */
	EstLib.arrayKeysToLowerCase = function(array){
		var out = [];
		for(var i=0, nb=array.length; i<nb; i++){
			out.push(EstLib.objectKeysToLowerCase( array[i] ));
		}
		return out;
	};

	/**
	 * @param{string} str
	 * @return{string}
	 */
	/*EstLib.capitaliseStr = function(str){
	 return str.replace(/^[a-z]/, function(m){ return m.toUpperCase(); });
	 };*/

//	the color input has to be EXACTLY 7 characters, like #08a35c
//	percent parameter is between -1.0 and 1.0
	/*EstLib.shadeColor = function(color, percent) {
	 var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
	 return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
	 };*/

//	the color input has to be EXACTLY 7 characters, like #08a35c
//	p parameter is between 0 and 1.0
	/*EstLib.blendColors = function(c0, c1, p) {
	 var f=parseInt(c0.slice(1),16),t=parseInt(c1.slice(1),16),R1=f>>16,G1=f>>8&0x00FF,B1=f&0x0000FF,R2=t>>16,G2=t>>8&0x00FF,B2=t&0x0000FF;
	 return "#"+(0x1000000+(Math.round((R2-R1)*p)+R1)*0x10000+(Math.round((G2-G1)*p)+G1)*0x100+(Math.round((B2-B1)*p)+B1)).toString(16).slice(1);
	 };*/

	/*function numberWithSpaces(x) {
	 return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
	 };*/

	/**
	 * @param{string} string
	 * @return{string}
	 */
	EstLib.escapeRegExp = function(string) {
		return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
	};

	/**
	 * @param {string} string
	 * @param {string} find
	 * @param {string} replace
	 * @return {string}
	 */
	EstLib.replaceAll = function(string, find, replace) {
		return string.replace(new RegExp(EstLib.escapeRegExp(find), 'g'), replace);
	};

	/**
	 * @param {Array} x
	 * @param {Array} y
	 * @return {Array}
	 */
	EstLib.unionArrays = function(x, y) {
		var obj={}, i,nb;
		for(i=0, nb=x.length; i<nb; i++){
			var xi=x[i];
			obj[xi]=xi;
		}
		for(i=0, nb=y.length; i<nb; i++){
			var yi=y[i];
			obj[yi]=yi;
		}
		var res=[];
		for(var k in obj)
			if (obj.hasOwnProperty(k)) res.push(obj[k]);
		return res;
	};

	//{1:"fff",df:15} to ["fff",15]
	EstLib.objValuesToArrays = function(obj) {
		return Object.keys(obj).map(function(k){return obj[k];});
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

	/**
	 * @param mls
	 * @return{Array.<Array.<number>>|null}
	 */
	EstLib.getEnvelope = function(mls){
		if(!mls) return null;
		//to be extended - supports only multiline strings
		var latMin=99999, lonMin=99999, latMax=-99999, lonMax=-99999;
		for(var i=0; i<mls.coordinates.length; i++){
			var cs = mls.coordinates[i];
			for(var j=0; j<cs.length; j++){
				var c = cs[j];
				if(c[0]>lonMax) lonMax=c[0];
				if(c[0]<lonMin) lonMin=c[0];
				if(c[1]>latMax) latMax=c[1];
				if(c[1]<latMin) latMin=c[1];
			}
		}
		if(latMin==99999 || lonMin==99999 || latMax==-99999 || lonMax==-99999) return null;
		return [[latMin, lonMin],[latMax, lonMax]];
	};

	/**
	 * @param{number} num
	 * @return {string}
	 */
	EstLib.numberWithSpaces = function(num) {
		var str = num.toString().split('.');
		if (str[0].length >= 5)
			str[0] = str[0].replace(/(\d)(?=(\d{3})+$)/g, "$1 ");
		if (str[1] && str[1].length >= 5)
			str[1] = str[1].replace(/(\d{3})/g, "$1 ");
		return str.join('.');
	};



	function preventDefault(e) {
		e = e || window.event;
		if (e.preventDefault) e.preventDefault();
		e.returnValue = false;
	}

	EstLib.disableScrolling = function() {
		if (window.addEventListener)
			window.addEventListener('DOMMouseScroll', preventDefault, false);
		window.onmousewheel = document.onmousewheel = preventDefault;
	};

	EstLib.enableScrolling = function() {
		if (window.removeEventListener)
			window.removeEventListener('DOMMouseScroll', preventDefault, false);
		window.onmousewheel = document.onmousewheel = null;
	};





	//From https://code.google.com/p/stringencoders/source/browse/trunk/javascript/base64.js
	EstLib.encodeBase64 = function(s) {
		if (arguments.length !== 1) {
			throw new SyntaxError("Not enough arguments");
		}

		var getbyte = function(s,i) {
			var x = s.charCodeAt(i);
			if (x > 255) {
				console.log("Error");
				return null;
			}
			return x;
		};

		var padchar = '=';
		var alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

		var i, b10;
		var x = [];

		// convert to string
		s = '' + s;

		var imax = s.length - s.length % 3;

		if (s.length === 0) {
			return s;
		}
		for (i = 0; i < imax; i += 3) {
			b10 = (getbyte(s,i) << 16) | (getbyte(s,i+1) << 8) | getbyte(s,i+2);
			x.push(alpha.charAt(b10 >> 18));
			x.push(alpha.charAt((b10 >> 12) & 0x3F));
			x.push(alpha.charAt((b10 >> 6) & 0x3f));
			x.push(alpha.charAt(b10 & 0x3f));
		}
		switch (s.length - imax) {
			case 1:
				b10 = getbyte(s,i) << 16;
				x.push(alpha.charAt(b10 >> 18) + alpha.charAt((b10 >> 12) & 0x3F) +
					padchar + padchar);
				break;
			case 2:
				b10 = (getbyte(s,i) << 16) | (getbyte(s,i+1) << 8);
				x.push(alpha.charAt(b10 >> 18) + alpha.charAt((b10 >> 12) & 0x3F) +
					alpha.charAt((b10 >> 6) & 0x3f) + padchar);
				break;
		}
		return x.join('');
	};

	EstLib.getPropName = function(obj){
		for (var name in obj) { return name; }
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

	/*
	 EstLib.fireEvent = function(element, event){
	 var e;
	 if(document.createEventObject){
	 // for IE
	 try {
	 e = document.createEventObject();
	 jQuery(element).change();
	 return element.fireEvent('on'+event,e);
	 } catch(e) {}
	 } else{
	 e = document.createEvent("HTMLEvents");
	 e.initEvent(event, true, true);
	 return !element.dispatchEvent(e);
	 }
	 }
	 */
	/*EstLib.fireEvent = function(el, etype){
	 if (el.fireEvent) {
	 el.fireEvent('on' + etype);
	 } else {
	 var evObj = document.createEvent('Events');
	 evObj.initEvent(etype, true, false);
	 el.dispatchEvent(evObj);
	 }
	 };*/
	/*EstLib.fireEvent = function(el, etype) {
	 var event;
	 if (document.createEvent) {
	 event = document.createEvent("HTMLEvents");
	 event.initEvent(etype, true, true);
	 } else {
	 event = document.createEventObject();
	 event.eventType = etype;
	 }
	 event.eventName = etype;
	 if (el.dispatchEvent) {
	 el.dispatchEvent(event);
	 } else {
	 el.fireEvent("on" + etype, event);
	 }
	 }*/

	//transform 1 into 1st, 2 into 2nd, 3 into 3rd, etc...
	EstLib.getNumbered = function(number,lg){
		lg=lg||"en";
		switch(lg){
			case "fr":
				switch(number){
					case 1: return "1er";
					default: return number+"ème";
				}
			default:
				switch(number){
					case 1: return "1st";
					case 2: return "2nd";
					case 3: return "3rd";
					default: return number+"th";
				}
		}
	};


	/**
	 * Returns browser language
	 * @return {string}
	 */
	EstLib.getLang = function(){
		return navigator.language || navigator.languages[0] || navigator.browserLanguage;
	};

	/**
	 * Returns 2 chars language code
	 * @return {string}
	 */
	EstLib.getLang2Chars = function(){
	    var lg = EstLib.getParameterByName("lang") || EstLib.getLang() || "en";
	    return lg.substring(0, 2);
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

	/**
	 * Returns max size
	 * @return {object}
	 */
	EstLib.getMaxSize = function(){
		var w = window,
	    e = document.documentElement,
	    g = document.getElementsByTagName("body")[0];
		return {
			width: w.innerWidth || e.clientWidth || g.clientWidth,
			height: w.innerHeight|| e.clientHeight|| g.clientHeight };
	};




    EstLib.tooltip= function(config) {
    	config = config || {};
    	config.div = config.div || "tooltip";
    	config.width = config.width || "150px";
    	config.font = config.font || "14px";
    	config.background = config.background || "white";
    	config.padding = config.padding || "5px";
    	config.border = config.border || "0px";
    	config["border-radius"] = config["border-radius"] || "5px";
    	config["box-shadow"] = config["box-shadow"] || "5px 5px 5px grey";

    	config.transitionDuration = config.transitionDuration || 200;
    	config.xOffset = config.xOffset || 30;
    	config.yOffset = config.yOffset || 20;

    	var tooltip;

    	function my() {
    		tooltip = d3.select("#"+config.div);

            tooltip.style("width",config.width);
            tooltip.style("font",config.font);
            tooltip.style("background",config.background);
            tooltip.style("padding",config.padding);
            tooltip.style("border",config.border);
            tooltip.style("border-radius",config["border-radius"]);
            tooltip.style("box-shadow",config["box-shadow"]);

            tooltip.style("position","absolute");
            tooltip.style("pointer-events","none");
            tooltip.style("opacity","0");
    	}

    	my.mouseover = function(html){
    		tooltip.html(html)
            .style("left", (d3.event.pageX+config.xOffset) + "px").style("top", (d3.event.pageY-config.yOffset) + "px")
            .transition().duration(config.transitionDuration).style("opacity",1);
        };

        my.mousemove = function(){
        	tooltip.style("left", (d3.event.pageX+config.xOffset) + "px").style("top", (d3.event.pageY-config.yOffset) + "px");
        };

        my.mouseout = function(){
        	tooltip.transition().duration(config.transitionDuration).style("opacity",0);
        };

    	my();
    	return my;
	};



	EstLib.loadingImage = function(config){
		config = config || {};
		config.imgsrc = config.imgsrc || "img/loading.gif";
		config.alttxt = config.alttxt || "Loading...";

		var ldiv = $("<div>").css({"width":"100%","height":"100%","top":"0","left":"0","position":"fixed","display":"block","opacity":"0.7","background-color":"#fff","z-index":"99","text-align":"center"}).appendTo("body");
			$("<img>").attr("src", config.imgsrc).attr("alt", config.alttxt).css({"position":"absolute","top":"50%","left":"50%","z-index":"100"}).appendTo(ldiv);

		return ldiv;
	};


}(jQuery, window.EstLib = window.EstLib || {} ));
