/**
 *
 * Make maps from Eurostat data
 *
 * @author julien Gaffuri
 *
 */
(function(d3, EstLib) {

	//ps: make symbols truly proportionnal
	//add classification method as parameter
	//add legend
	//support data flags
	//check how no-data is handled
	//insets (with nuts2json)
	//transform nice nuts map using eurostat-map.js?
	//adopt data cache

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
		var noDataColor = "gray";
		//for choropleth maps, the function returning the fill style depending on the class number and the number of classes
		var classToFillStyle = EstLib.getColorLegend(colorFun);
		//the function defining some fill patterns to be reused for the choropleth map
		var filtersDefinitionFun = function(svg) {};

		//the output object
		var out = {};

		var statData, values, nutsData, nutsRG;
		var height, svg, path;
		var tooltip = showTooltip? EstLib.tooltip() : null;


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
					nutsRG = topojson.feature(nutsData, nutsData.objects.nutsrg).features;
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


		out.buildMapTemplate = function() {
			//TODO empty svg

			//prepare SVG element
			height = width * (nutsData.bbox[3] - nutsData.bbox[1]) / (nutsData.bbox[2] - nutsData.bbox[0]),
			svg = d3.select("#"+svgId).attr("width", width).attr("height", height)
			path = d3.geoPath().projection(d3.geoIdentity().reflectY(true).fitSize([ width, height ], topojson.feature(nutsData, nutsData.objects.gra)));

			if(drawCoastalMargin)
				//define filter for coastal margin
				svg.append("filter").attr("id", "blur").attr("x","-100%").attr("y", "-100%").attr("width","400%")
					.attr("height", "400%").append("feGaussianBlur").attr("in", "SourceGraphic").attr("stdDeviation", "4");
			
			//add additional filters
			filtersDefinitionFun(svg);

			//draw background rectangle
			svg.append("rect").attr("id", "sea").attr("x", 0).attr("y", 0)
					.attr("width", width).attr("height", height);

			//prepare drawing group
			var g = svg.append("g").attr("transform", "translate(0,0)");
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
							g.attr("transform", d3.event.transform);
						}));
			}

			if(drawCoastalMargin) {
				//draw coastal margin
				g.append("g").selectAll("path").data(topojson.feature(nuts, nutsData.objects.cntbn).features)
					.enter().append("path").attr("d", path)
					.style("fill", "none")
					.style("stroke-width", "8px")
					.style("filter", "url(#blur)")
					.style("stroke-linejoin", "round")
					.style("stroke-linecap", "round")
					.style("stroke", function(bn) {
							if (bn.properties.co === "T") return coastalMarginColor; return "none";
					});
				g.append("g").selectAll("path").data(topojson.feature(nuts, nutsData.objects.nutsbn).features)
					.enter().append("path").attr("d", path)
					.style("fill", "none")
					.style("stroke-width", "8px")
					.style("filter", "url(#blur)")
					.style("stroke-linejoin", "round")
					.style("stroke-linecap", "round")
					.style("stroke", function(bn) {
							if (bn.properties.co === "T") return coastalMarginColor; return "none";
					});
			}

			if(drawGraticule) {
				//draw graticule
				g.append("g").selectAll("path").data(topojson.feature(nutsData, nutsData.objects.gra).features)
					.enter().append("path").attr("d", path)
					.style("fill", "none")
					.attr("class", "gra");
			}

			//draw country regions
			g.append("g").selectAll("path").data(topojson.feature(nutsData, nutsData.objects.cntrg).features)
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
			g.append("g").selectAll("path").data(nutsRG)
				.enter().append("path").attr("d", path)
				.attr("class", "nutsrg")
				.attr("fill", "white")
				.on("mouseover", function(rg) {
					if(showTooltip) tooltip.mouseover("<b>" + rg.properties.na + "</b><br>" + rg.properties.val + (unitText?" "+unitText:""));
				}).on("mousemove", function() {
					if(showTooltip) tooltip.mousemove();
				}).on("mouseout", function() {
					if(showTooltip) tooltip.mouseout();
				});

			//draw country boundaries
			g.append("g").selectAll("path").data(topojson.feature(nutsData, nutsData.objects.cntbn).features)
				.enter().append("path").attr("d", path)
				.style("fill", "none").style("stroke-linecap", "round").style("stroke-linejoin", "round")
				.attr("class", function(bn) {
					if (bn.properties.co === "T")return "bn_co"; return "cntbn";
				});

			//draw NUTS boundaries
			var bn = topojson.feature(nutsData, nutsData.objects.nutsbn).features;
			bn.sort(function(bn1, bn2) { return bn2.properties.lvl - bn1.properties.lvl; });
			g.append("g").selectAll("path").data(bn).enter()
				.append("path").attr("d", path)
				.style("fill", "none").style("stroke-linecap", "round").style("stroke-linejoin", "round")
				.attr("class", function(bn) {
					bn = bn.properties;
					if (bn.co === "T") return "bn_co";
					var cl = [ "bn_" + bn.lvl ];
					if (bn.oth === "T") cl.push("bn_oth");
					return cl.join(" ");
				});
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
				//TODO correct that
				//proportionnal symbol map
				//see https://bl.ocks.org/mbostock/4342045
				var maxSize = 20;
				var radius = d3.scaleSqrt().domain([0, Math.max(...values)]).range([0, maxSize]);

				//compute list of centroides of nutsRG
				for(var i=0; i<nutsRG.length; i++) {
					var nr = nutsRG[i];
					nr.geometry = {"type": "Point", "coordinates": d3.geoPath().centroid(nr)};
				}

				g.selectAll(".symbol")
				.data(nutsRG.sort(function(a, b) { return b.properties.val - a.properties.val; }))
				.enter().append("path").attr("class", "symbol")
				.attr("d", path.pointRadius(function(d) { return radius(d.properties.val); }))
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
					return classToFillStyle( d3.select(this).attr("ecl"), clnb );
				});
			}
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
		out.classToFillStyle = function(v) { if (!arguments.length) return classToFillStyle; classToFillStyle=v; return out; };
		out.filtersDefinitionFun = function(v) { if (!arguments.length) return filtersDefinitionFun; filtersDefinitionFun=v; return out; };

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
	EstLib.getFillPatternDefinitionFun = function(clnb, opts) {
		opts = opts || {};
		opts.shape = opts.shape || "circle";
		var s = opts.patternSize || 10;
		opts.bckColor = opts.bckColor || "white";
		opts.symbColor = opts.symbColor || "black";
		return function(svg) {
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
