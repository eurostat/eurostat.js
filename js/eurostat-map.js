/**
 *
 * Make maps from Eurostat data
 *
 * @author julien Gaffuri
 *
 */
(function(d3, EstLib) {

	//js dependencies
	//typologies
	//decompose
	//choice
	//add legend element
	//add classification method as parameter ?
	//loading message (?)
	//support data flags
	//insets (with nuts2json)
	//adopt data cache
	//transform nice nuts map using eurostat-map.js?
	//doc

	EstLib.map = function() {
		//the id of the svg element to draw into
		var svgId = "map";
		//the width of the svg element, in px
		var width = 800;
		//the code of the eurobase database
		var ebcode = "demo_r_d3dens";
		//the dimension projector to extract the statistical data
		var dimensions = { time : 2017 };
		//the map type: "ch" for choropleth and "ps" for proportionnal circles
		var type = "ch"; //or "ps"
		//the map lod, among 3M, 10M, 20M, 60M
		var scale = "20M";
		//the map projection (epsg code)
		var proj = "3035";
		//the map nuts level, from 0 to 3
		var nutsLvl = "3";
		//the NUTS version, among 2010, 2013, 2016
		var NUTSyear = 2013;
		//the number of classes of the map
		var clnb = 7;
		//the langage
		var lg = "en";
		//if the map is zoomable, specify the scale extent
		var scaleExtent = [1,6];
		//draw the graticule
		var drawGraticule = true;
		//draw the coastal margin
		var drawCoastalMargin = true;
		//the color of the coastal margin
		var coastalMarginColor = "white";
		//show tooltip text when passing over map regions
		var showTooltip = true;
		//the text to use in the tooltip for the unit of the values
		var unitText = "";
		//for choropleth maps, color interpolation function. see https://github.com/d3/d3-scale-chromatic/   -   ex: interpolateGnBu
		var colorFun = d3.interpolateYlOrRd;
		//fill color for no data regions
		var noDataFillStyle = "lightgray";
		//for choropleth maps, the function returning the fill style depending on the class number and the number of classes
		var classToFillStyle = EstLib.getColorLegend(colorFun);
		//the function defining some fill patterns to be reused for the choropleth map
		var filtersDefinitionFun = function() {};
		//the maximum size for the proportional circles
		var psMaxSize = 30;
		//text to show for no data case
		var noDataText = "No data";

		//the output object
		var out = {};

		var statData, values, nutsData, nutsRG, nutsRGCentroids;
		var height, svg, path;
		var tooltip = showTooltip? EstLib.tooltip() : null;

		//ease the loading of URL parameters. Use with function EstLib.loadURLParameters()
		out.set = function(opts) {
			if(opts.w) out.width(opts.w);
			if(opts.s) out.scale(opts.s);
			if(opts.lvl) out.nutsLvl(opts.lvl);
			//if(opts.time)  = opts.time;
			if(opts.proj) out.proj(opts.proj);
			if(opts.y) out.NUTSyear(opts.y);
			if(opts.clnb) out.clnb(+opts.clnb);
			if(opts.lg) out.lg(opts.lg);
			if(opts.type) out.type(opts.type);
			return out;
		};

		//use that for initial build of a map
		out.build = function() {
			out.updategeoData();
			out.updateStatData();
			return out;
		};

		//get nuts geometries
		out.updategeoData = function() {
			nutsData = null;
			d3.queue()
			.defer(d3.json, "https://raw.githubusercontent.com/eurostat/Nuts2json/gh-pages/" + NUTSyear + "/" + proj + "/" + scale + "/" + nutsLvl + ".json")
			.await( function(error, nuts___) {
					nutsData = nuts___;
					out.buildMapTemplate();
					if(!statData) return;
					out.updateStatValues();
				});
			return out;
		}

		//get stat data
		out.updateStatData = function() {
			statData = null;
			d3.queue().defer(d3.json, EstLib.getEstatDataURL(ebcode, dimensions)).await(
				function(error, data___) {
					statData = JSONstat(data___).Dataset(0);
					if(!nutsData) return;
					out.updateStatValues();
				});
			return out;
		}


		//buid a map template, based on the geometries only
		out.buildMapTemplate = function() {
			//empty svg
			if(svg) svg.selectAll("*").remove();

			//decode topojson to geojson
			var gra = topojson.feature(nutsData, nutsData.objects.gra).features;
			nutsRG = topojson.feature(nutsData, nutsData.objects.nutsrg).features;
			var nutsbn = topojson.feature(nutsData, nutsData.objects.nutsbn).features;
			var cntrg = topojson.feature(nutsData, nutsData.objects.cntrg).features;
			var cntbn = topojson.feature(nutsData, nutsData.objects.cntbn).features;

			//prepare SVG element
			height = width * (nutsData.bbox[3] - nutsData.bbox[1]) / (nutsData.bbox[2] - nutsData.bbox[0]),
			svg = d3.select("#"+svgId).attr("width", width).attr("height", height)
			path = d3.geoPath().projection(d3.geoIdentity().reflectY(true).fitSize([ width, height ], topojson.feature(nutsData, nutsData.objects.gra)));

			if(drawCoastalMargin)
				//define filter for coastal margin
				svg.append("filter").attr("id", "coastal_blur").attr("x","-100%").attr("y", "-100%").attr("width","400%")
					.attr("height", "400%").append("feGaussianBlur").attr("in", "SourceGraphic").attr("stdDeviation", "4");

			//add additional filters for fill patterns for example
			filtersDefinitionFun(svg, clnb);

			//draw background rectangle
			svg.append("rect").attr("id", "sea").attr("x", 0).attr("y", 0)
				.attr("width", width).attr("height", height);

			//prepare drawing group
			var zg = svg.append("g").attr("id","zoomgroup").attr("transform", "translate(0,0)");
			if(scaleExtent) {
				//add zoom function
				svg.call(d3.zoom().scaleExtent(scaleExtent)
					.on("zoom", function() {
							var k = d3.event.transform.k;
							d3.selectAll(".gra").style("stroke-width", (1/k)+"px");
							d3.selectAll(".bn_0").style("stroke-width", (1/k)+"px");
							d3.selectAll(".bn_oth").style("stroke-width", (1/k)+"px");
							d3.selectAll(".bn_co").style("stroke-width", (1/k)+"px");
							d3.selectAll(".cntbn").style("stroke-width", (1/k)+"px");
							zg.attr("transform", d3.event.transform);
						}));
			}

			if(drawCoastalMargin) {
				//draw coastal margin
				var cg = zg.append("g").attr("id","g_coast_margin")	
					.style("fill", "none")
					.style("stroke-width", "8px")
					.style("filter", "url(#coastal_blur)")
					.style("stroke-linejoin", "round")
					.style("stroke-linecap", "round");
				//countries bn
				cg.append("g").attr("id","g_coast_margin_cnt")
					.selectAll("path").data(cntbn).enter().append("path").attr("d", path)
					.style("stroke", function(bn) {
						if (bn.properties.co === "T") return coastalMarginColor; return "none";
					});
				//nuts bn
				cg.append("g").attr("id","g_coast_margin_nuts")
					.selectAll("path").data(nutsbn).enter().append("path").attr("d", path)
					.style("stroke", function(bn) {
						if (bn.properties.co === "T") return coastalMarginColor; return "none";
					});
			}

			if(drawGraticule) {
				//draw graticule
				zg.append("g").attr("id","g_gra").selectAll("path").data(gra)
					.enter().append("path").attr("d", path)
					.style("fill", "none").attr("class", "gra");
			}

			//draw country regions
			zg.append("g").attr("id","g_cntrg").selectAll("path").data(cntrg)
				.enter().append("path").attr("d", path)
				.attr("class", "cntrg")
				.on("mouseover",function(rg) {
					if(showTooltip) tooltip.mouseover("<b>" + rg.properties.na + "</b>");
				}).on("mousemove", function() {
					if(showTooltip) tooltip.mousemove();
				}).on("mouseout", function() {
					if(showTooltip) tooltip.mouseout();
				})

			//draw NUTS regions
			zg.append("g").attr("id","g_nutsrg").selectAll("path").data(nutsRG)
				.enter().append("path").attr("d", path)
				.attr("class", "nutsrg")
				.attr("fill", "white")
				.on("mouseover", function(rg) {
					if(showTooltip) tooltip.mouseover("<b>" + rg.properties.na + "</b><br>" + (rg.properties.val? rg.properties.val + (unitText?" "+unitText:"") : noDataText));
				}).on("mousemove", function() {
					if(showTooltip) tooltip.mousemove();
				}).on("mouseout", function() {
					if(showTooltip) tooltip.mouseout();
				});

			//draw country boundaries
			zg.append("g").attr("id","g_cntbn").selectAll("path").data(cntbn)
				.enter().append("path").attr("d", path)
				.style("fill", "none").style("stroke-linecap", "round").style("stroke-linejoin", "round")
				.attr("class", function(bn) {
					if (bn.properties.co === "T")return "bn_co"; return "cntbn";
				});

			//draw NUTS boundaries
			nutsbn.sort(function(bn1, bn2) { return bn2.properties.lvl - bn1.properties.lvl; });
			zg.append("g").attr("id","g_nutsbn").selectAll("path").data(nutsbn).enter()
				.append("path").attr("d", path)
				.style("fill", "none").style("stroke-linecap", "round").style("stroke-linejoin", "round")
				.attr("class", function(bn) {
					bn = bn.properties;
					if (bn.co === "T") return "bn_co";
					var cl = [ "bn_" + bn.lvl ];
					if (bn.oth === "T") cl.push("bn_oth");
					return cl.join(" ");
				});
			
			//prepare group for proportional symbols
			zg.append("g").attr("id","g_ps");

			return out;
		};



		//run when the stat values have changed
		out.updateStatValues = function() {
			//link values to NUTS regions
			//build list of values
			values = [];
			for (var i=0; i<nutsRG.length; i++) {
				var rg = nutsRG[i];
				var value = statData.Data({ geo : rg.properties.id });
				if (!value || !value.value) continue;
				rg.properties.val = value.value;
				values.push(+value.value);
			}

			//update classification and styles
			out.updateClassificationAndStyle();

			return out;
		}


		//run when the classification has changed
		out.updateClassificationAndStyle = function() {
			//NB: no classification is required for proportional symbols map

			if(type == "ch") {
				//build list of classes and classification based on quantiles
				var classif = d3.scaleQuantile().domain(values).range( [...Array(clnb).keys()] );
				classif.quantiles();

				//apply classification based on value
				svg.selectAll("path.nutsrg")
				.attr("ecl", function(rg) {
					if (!rg.properties.val) return "nd";
					return +classif(+rg.properties.val);
				})
			}
			
			//update style
			out.updateStyle();

			return out;
		}


		//run when the map style/legend has changed
		out.updateStyle = function() {

			if(type == "ps") {
				//proportionnal symbol map
				//see https://bl.ocks.org/mbostock/4342045
				var radius = d3.scaleSqrt().domain([0, Math.max(...values)]).range([0, psMaxSize*0.5]);

				nutsRGCentroids = [];
				//compute list of centroids of nutsRG
				for(var i=0; i<nutsRG.length; i++) {
					var nr = nutsRG[i];
					var geomc = {"type": "Point", "coordinates": d3.geoPath().centroid(nr)}
					var nrc = {type:"feature", properties:nr.properties, geometry:geomc };
					nutsRGCentroids.push(nrc);
					nr.geometry = geomc; //TODO
				}

				//TODO use nutsRGCentroids instead of nutsRG
				//draw proportional symbols
				d3.select("#g_ps").selectAll(".symbol")
				.data(nutsRG.sort(function(a, b) { return b.properties.val - a.properties.val; }))
				.enter()
				.append("path").attr("class", "symbol")
				.attr("d", path.pointRadius(function(d) { return d.properties.val? radius(d.properties.val) : 0; }))
				.on("mouseover", function(rg) {
					if(showTooltip) tooltip.mouseover("<b>" + rg.properties.na + "</b><br>" + rg.properties.val + (unitText?" "+unitText:""));
				}).on("mousemove", function() {
					if(showTooltip) tooltip.mousemove();
				}).on("mouseout", function() {
					if(showTooltip) tooltip.mouseout();
				});

			} else {
				//choropleth map
				//apply style to nuts regions depending on class
				svg.selectAll("path.nutsrg")
				.attr("fill", function() {
					var ecl = d3.select(this).attr("ecl");
					if(!ecl||ecl==="nd") return noDataFillStyle || "gray";
					return classToFillStyle( ecl, clnb );
				});
			}
			return out;
		};


		out.svgId = function(v) { if (!arguments.length) return svgId; svgId=v; return out; };
		out.width = function(v) { if (!arguments.length) return width; width=v; return out; };
		out.ebcode = function(v) { if (!arguments.length) return ebcode; ebcode=v; return out; };
		out.dimensions = function(v) { if (!arguments.length) return dimensions; dimensions=v; return out; };		
		out.type = function(v) { if (!arguments.length) return type; type=v; return out; };
		out.scale = function(v) { if (!arguments.length) return scale; scale=v; return out; };
		out.proj = function(v) { if (!arguments.length) return proj; proj=v; return out; };
		out.nutsLvl = function(v) { if (!arguments.length) return nutsLvl; nutsLvl=v; return out; };
		out.NUTSyear = function(v) { if (!arguments.length) return NUTSyear; NUTSyear=v; return out; };
		out.clnb = function(v) { if (!arguments.length) return clnb; clnb=v; return out; };
		out.lg = function(v) { if (!arguments.length) return lg; lg=v; return out; };
		out.scaleExtent = function(v) { if (!arguments.length) return scaleExtent; scaleExtent=v; return out; };
		out.drawGraticule = function(v) { if (!arguments.length) return drawGraticule; drawGraticule=v; return out; };
		out.drawCoastalMargin = function(v) { if (!arguments.length) return drawCoastalMargin; drawCoastalMargin=v; return out; };
		out.coastalMarginColor = function(v) { if (!arguments.length) return coastalMarginColor; coastalMarginColor=v; return out; };
		out.showTooltip = function(v) { if (!arguments.length) return showTooltip; showTooltip=v; return out; };
		out.unitText = function(v) { if (!arguments.length) return unitText; unitText=v; return out; };
		out.colorFun = function(v) { if (!arguments.length) return colorFun; colorFun=v; classToFillStyle = EstLib.getColorLegend(colorFun); return out; };
		out.noDataFillStyle = function(v) { if (!arguments.length) return noDataFillStyle; noDataFillStyle=v; return out; };
		out.classToFillStyle = function(v) { if (!arguments.length) return classToFillStyle; classToFillStyle=v; return out; };
		out.filtersDefinitionFun = function(v) { if (!arguments.length) return filtersDefinitionFun; filtersDefinitionFun=v; return out; };
		out.psMaxSize = function(v) { if (!arguments.length) return psMaxSize; psMaxSize=v; return out; };
		out.noDataText = function(v) { if (!arguments.length) return noDataText; noDataText=v; return out; };

		return out;
	};



	//build a color legend object
	EstLib.getColorLegend = function(colorFun) {
		colorFun = colorFun || d3.interpolateYlOrRd;
		return function(ecl, clnb) { return colorFun( ecl/(clnb-1) ); }
	}


	//fill pattern style

	//build a fill pattern legend object { nd:"white", 0:"url(#pattern_0)", 1:"url(#pattern_1)", ... }
	EstLib.getFillPatternLegend = function() {
		return function(ecl) { return "url(#pattern_"+ecl+")"; }
	}

	//make function which build fill patterns style
	EstLib.getFillPatternDefinitionFun = function(opts) {
		opts = opts || {};
		opts.shape = opts.shape || "circle";
		var s = opts.patternSize || 10;
		opts.bckColor = opts.bckColor || "white";
		opts.symbColor = opts.symbColor || "black";
		return function(svg, clnb) {
			for(var i=0; i<clnb; i++) {
				var si = 1+(s-1)*i/(clnb-1);
				var patt = svg.append("pattern").attr("id","pattern_"+i).attr("x","0").attr("y","0").attr("width",s).attr("height",s).attr("patternUnits","userSpaceOnUse");
				patt.append("rect").attr("x",0).attr("y",0).attr("width",s).attr("height",s).style("stroke","none").style("fill",opts.bckColor)
				if(opts.shape=="square")
					patt.append("rect").attr("x",0).attr("y",0).attr("width",si).attr("height",si).style("stroke","none").style("fill",opts.symbColor)
				else
					patt.append("circle").attr("cx",s*0.5).attr("cy",s*0.5).attr("r",si*0.6).style("stroke","none").style("fill",opts.symbColor)
			}
		};
	};








}(d3, window.EstLib = window.EstLib || {} ));
