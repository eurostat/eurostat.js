/**
 *
 * Make maps from Eurostat data
 *
 * @author julien Gaffuri
 *
 */
(function(d3, EstLib) {
	//https://medium.com/@mbostock/a-better-way-to-code-2b1d2876a3a0

	//add legend element for proportional circle
	//https://github.com/susielu/d3-legend
	//http://d3-legend.susielu.com/

	//add "no data" in legend

	//domains as parameter
	//deverging ramp -> define central value
	//svg export: with rounded coordinates - d3.round. test + edit in inkscape + fix. Function/button "export as svg"
	//js dependencies
	//typologies: use ordinal scale: var ordinal = d3.scaleOrdinal().domain(["a", "b", "c", "d", "e"]).range([ ... ]);

	//choice
	//add classification method as parameter ?
	//loading message (?)
	//support data flags
	//insets (with nuts2json)
	//adopt data cache
	//transform nice nuts map using eurostat-map.js?
	//doc
	//d3.v5.js ?
	//https://github.com/d3/d3-shape#symbols

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
		//graticule stroke style
		var graticuleStroke = "gray";
		//graticule stroke width
		var graticuleStrokeWidth = "1";
		//sea fill style
		var seaFillStyle = "#b3cde3";
		//draw the coastal margin
		var drawCoastalMargin = true;
		//the color of the coastal margin
		var coastalMarginColor = "white";
		//show tooltip text when passing over map regions
		var showTooltip = true;
		//the text to use in the tooltip for the unit of the values
		var unitText = "";

		//fill color for no data regions
		var noDataFillStyle = "lightgray";
		//text to show for no data case
		var noDataText = "No data";

		//for choropleth maps, color interpolation function. see https://github.com/d3/d3-scale-chromatic/   -   ex: interpolateGnBu
		var colorFun = d3.interpolateYlOrRd;
		//for choropleth maps, the function returning the fill style depending on the class number and the number of classes
		var classToFillStyle = EstLib.getColorLegend(colorFun);
		//the function defining some fill patterns to be reused for the choropleth map
		var filtersDefinitionFun = function() {};

		//the maximum size for the proportional circles
		var psMaxSize = 30;

		//legend
		var showLegend = true;
		var legendFontFamily = EstLib.fontFamilyDefault;
		var legendTitle = "Legend";
		var legendTitleFontSize = 20;
		var legendAscending = true;
		var legendBackGroundFill = "white";
		var legendTitleWidth = 140;
		var legendLabelWrap = 140;
		var legendLabelOffset = 5;
		var legendLabelFontSize = 15;
		var legendLabelDelimiter = " - ";
		var legendShapeWidth = 20;
		var legendShapeHeight = 16;
		var legendShapePadding = 2;
		var legendBoxMargin = 10;
		var legendBoxPadding = 10;
		var legendBoxCornerRadius = legendBoxPadding;
		var legendBoxOpacity = 0.5;
		var legendBoxFill = "white";
		var legendBoxWidth = legendBoxPadding*2 + Math.max(legendTitleWidth, legendShapeWidth + legendLabelOffset + legendLabelWrap);
		var legendBoxHeight = legendBoxPadding*2 + legendTitleFontSize + legendShapeHeight + (1+legendShapeHeight+legendShapePadding)*(out.clnb()-1) +12;

		var nutsrgFillStyle = "#eee"; //used for ps map
		var nutsrgSelectionFillStyle = "purple";
		var nutsbnStroke = {0:"#777",1:"#777",2:"#777",3:"#777",oth:"#444",co:"#1f78b4"};
		var nutsbnStrokeWidth = {0:1,1:0.2,2:0.2,3:0.2,oth:1,co:1};
		var cntrgFillStyle = "lightgray";
		var cntrgSelectionFillStyle = "darkgray";
		var cntbnStroke = "#777";
		var cntbnStrokeWidth = 1;


		var psFill = "#B45F04";
		var psFillOpacity = 0.6;
		var psStroke = "#fff";
		var psStrokeWidth = 0.6;

		//the output object
		var out = {};

		var statData, values, nutsData, nutsRG;
		var height, svg, path;
		var classif;

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
				.attr("width", width).attr("height", height)
				.style("fill", seaFillStyle);

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
				zg.append("g").attr("id","g_gra")
					.style("fill", "none")
					.style("stroke", graticuleStroke)
					.style("stroke-width", graticuleStrokeWidth)
					.selectAll("path").data(gra)
					.enter().append("path").attr("d", path).attr("class", "gra");
			}

			//draw country regions
			zg.append("g").attr("id","g_cntrg").selectAll("path").data(cntrg)
				.enter().append("path").attr("d", path)
				.attr("class", "cntrg")
				.style("fill", cntrgFillStyle)
				.on("mouseover",function(rg) {
					d3.select(this).style("fill", cntrgSelectionFillStyle)
					if(showTooltip) tooltip.mouseover("<b>" + rg.properties.na + "</b>");
				}).on("mousemove", function() {
					if(showTooltip) tooltip.mousemove();
				}).on("mouseout", function() {
					d3.select(this).style("fill", cntrgFillStyle)
					if(showTooltip) tooltip.mouseout();
				});

			//draw NUTS regions
			zg.append("g").attr("id","g_nutsrg").selectAll("path").data(nutsRG)
				.enter().append("path").attr("d", path)
				.attr("class", "nutsrg")
				.attr("fill", nutsrgFillStyle)
				.on("mouseover", function(rg) {
					var sel = d3.select(this);
					sel.attr("fill___", sel.attr("fill"));
					sel.attr("fill", nutsrgSelectionFillStyle);
					if(showTooltip) tooltip.mouseover("<b>" + rg.properties.na + "</b><br>" + (rg.properties.val? rg.properties.val + (unitText?" "+unitText:"") : noDataText));
				}).on("mousemove", function() {
					if(showTooltip) tooltip.mousemove();
				}).on("mouseout", function() {
					var sel = d3.select(this);
					sel.attr("fill", sel.attr("fill___"));
					if(showTooltip) tooltip.mouseout();
				});

			//draw country boundaries
			zg.append("g").attr("id","g_cntbn")
				.style("fill", "none").style("stroke-linecap", "round").style("stroke-linejoin", "round")
				.selectAll("path").data(cntbn)
				.enter().append("path").attr("d", path)
				.attr("class", function(bn) {
					if (bn.properties.co === "T")return "bn_co"; return "cntbn";
				})
				.style("stroke", cntbnStroke)
				.style("stroke-width", cntbnStrokeWidth);

			//draw NUTS boundaries
			nutsbn.sort(function(bn1, bn2) { return bn2.properties.lvl - bn1.properties.lvl; });
			zg.append("g").attr("id","g_nutsbn")
				.style("fill", "none").style("stroke-linecap", "round").style("stroke-linejoin", "round")
				.selectAll("path").data(nutsbn).enter()
				.append("path").attr("d", path)
				.attr("class", function(bn) {
					bn = bn.properties;
					if (bn.co === "T") return "bn_co";
					var cl = ["bn_" + bn.lvl ];
					if (bn.oth === "T") cl.push("bn_oth");
					return cl.join(" ");
				})
				.style("stroke", function(bn) {
					bn = bn.properties;
					if (bn.co === "T") return nutsbnStroke.co || "#1f78b4";
					if (bn.oth === "T") return nutsbnStroke.oth || "#444";
					return nutsbnStroke[bn.lvl] || "#777";
				})
				.style("stroke-width", function(bn) {
					bn = bn.properties;
					if (bn.co === "T") return nutsbnStrokeWidth.co || 1;
					if (bn.oth === "T") return nutsbnStrokeWidth.oth || 1;
					return nutsbnStrokeWidth[bn.lvl] || 0.2;
				});

			//prepare group for proportional symbols
			zg.append("g").attr("id","g_ps");

			//prepare group for legend
			svg.append("g").attr("id","legendg");

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
				classif = d3.scaleQuantile().domain(values).range( [...Array(clnb).keys()] );
				classif.quantiles();

				//apply classification based on value
				svg.selectAll("path.nutsrg")
				.attr("ecl", function(rg) {
					if (!rg.properties.val) return "nd";
					return +classif(+rg.properties.val);
				})
			}

			//update legend
			out.updateLegend(classif);

			//update style
			out.updateStyle();

			return out;
		};

		
		out.updateLegend = function() {
			//draw legend
			if(showLegend) {
				var lgg = d3.select("#legendg");

				if(type == "ch") {
					//locate
					legendBoxWidth = legendBoxWidth || legendBoxPadding*2 + Math.max(legendTitleWidth, legendShapeWidth + legendLabelOffset + legendLabelWrap);
					legendBoxHeight = legendBoxHeight || legendBoxPadding*2 + legendTitleFontSize + legendShapeHeight + (1+legendShapeHeight+legendShapePadding)*(out.clnb()-1) +12;
					lgg.attr("transform", "translate("+(width-legendBoxWidth-legendBoxMargin+legendBoxPadding)+","+(legendTitleFontSize+legendBoxMargin+legendBoxPadding-6)+")");

					//remove previous content
					lgg.selectAll("*").remove();

					//background rectangle
					var lggBR = lgg.append("rect").attr("id", "legendBR").attr("x", -legendBoxPadding).attr("y", -legendTitleFontSize-legendBoxPadding+6)
					.attr("rx", legendBoxCornerRadius).attr("ry", legendBoxCornerRadius)
					.attr("width", legendBoxWidth).attr("height", legendBoxHeight)
					.style("fill", legendBoxFill).style("opacity", legendBoxOpacity);

					//define legend
					//see http://d3-legend.susielu.com/#color
					var colorLegend = d3.legendColor()
					.title(legendTitle)
					.titleWidth(legendTitleWidth)
					.useClass(true)
					.scale(classif)
					.ascending(legendAscending)
					.shapeWidth(legendShapeWidth)
					.shapeHeight(legendShapeHeight)
					.shapePadding(legendShapePadding)
					.labelFormat(d3.format(".2f"))
					//.labels(d3.legendHelpers.thresholdLabels)
					.labels(function({i,genLength,generatedLabels,labelDelimiter}) {
						if (i === 0) {
							const values = generatedLabels[i].split(` ${labelDelimiter} `)
							return `< ${values[1]}`
						} else if (i === genLength - 1) {
							const values = generatedLabels[i].split(` ${labelDelimiter} `)
							return `>= ${values[0]} `
						}
						return generatedLabels[i]
					})
					.labelDelimiter(legendLabelDelimiter)
					.labelOffset(legendLabelOffset)
					.labelWrap(legendLabelWrap)
					//.labelAlign("end") //?
					//.classPrefix("from ")
					//.orient("vertical")
					//.shape("rect")
					.on("cellover", function(ecl){
						var sel = d3/*.select("#g_nutsrg")*/.selectAll("[ecl='"+ecl+"']");
						sel.style("fill", nutsrgSelectionFillStyle);
						sel.attr("fill___", function(d) { d3.select(this).attr("fill"); });
					})
					.on("cellout", function(ecl){
						var sel = d3/*.select("#g_nutsrg")*/.selectAll("[ecl='"+ecl+"']");
						sel.style("fill", function(d) { d3.select(this).attr("fill___"); });
					});

					//make legend
					lgg.call(colorLegend);

					//apply fill style to legend elements
					svg.selectAll(".swatch")
					.attr("ecl", function() {
						var ecl = d3.select(this).attr("class").replace("swatch ","");
						if(!ecl||ecl==="nd") return "nd";
						return ecl;
					})
					.attr("fill", function() {
						var ecl = d3.select(this).attr("class").replace("swatch ","");
						if(!ecl||ecl==="nd") return noDataFillStyle || "gray";
						return classToFillStyle( ecl, clnb );
					})
					//.attr("stroke", "black")
					//.attr("stroke-width", 0.5)
					;

					//apply style to legend elements
					lgg.select(".legendTitle").style("font-size", legendTitleFontSize);
					lgg.selectAll("text.label").style("font-size", legendLabelFontSize);
					lgg.style("font-family", legendFontFamily);

				} else if(type == "ps") {
					//TODO
				} else {
					console.log("Unknown map type: "+type)
				}
			}
			return out;
		};
		

		//run when the map style/legend has changed
		out.updateStyle = function() {

			if(type == "ch") {
				//choropleth map
				//apply style to nuts regions depending on class
				svg.selectAll("path.nutsrg")
				.attr("fill", function() {
					var ecl = d3.select(this).attr("ecl");
					if(!ecl||ecl==="nd") return noDataFillStyle || "gray";
					return classToFillStyle( ecl, clnb );
				});

			} else if (type == "ps") {
				//proportionnal symbol map
				//see https://bl.ocks.org/mbostock/4342045 and https://bost.ocks.org/mike/bubble-map/
				var radius = d3.scaleSqrt().domain([0, Math.max(...values)]).range([0, psMaxSize*0.5]);

				d3.select("#g_ps").selectAll("circle")
				.data(nutsRG.sort(function(a, b) { return b.properties.val - a.properties.val; }))
				.enter().append("circle")
			    .attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
			    .attr("r", function(d) { return d.properties.val? radius(d.properties.val) : 0; })
			    .attr("class","symbol")
			    .on("mouseover", function(rg) {
			    	d3.select(this).style("fill", nutsrgSelectionFillStyle)
			    	if(showTooltip) tooltip.mouseover("<b>" + rg.properties.na + "</b><br>" + rg.properties.val + (unitText?" "+unitText:""));
			    }).on("mousemove", function() {
			    	if(showTooltip) tooltip.mousemove();
			    }).on("mouseout", function() {
			    	d3.select(this).style("fill", psFill)
			    	if(showTooltip) tooltip.mouseout();
			    })
			    .style("fill", psFill)
			    .style("fill-opacity", psFillOpacity)
			    .style("stroke", psStroke)
			    .style("stroke-width", psStrokeWidth);

			} else {
				console.log("Unexpected map type: "+type);
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
		out.seaFillStyle = function(v) { if (!arguments.length) return seaFillStyle; seaFillStyle=v; return out; };
		out.drawCoastalMargin = function(v) { if (!arguments.length) return drawCoastalMargin; drawCoastalMargin=v; return out; };
		out.coastalMarginColor = function(v) { if (!arguments.length) return coastalMarginColor; coastalMarginColor=v; return out; };
		out.showTooltip = function(v) { if (!arguments.length) return showTooltip; showTooltip=v; return out; };
		out.unitText = function(v) { if (!arguments.length) return unitText; unitText=v; return out; };
		out.colorFun = function(v) { if (!arguments.length) return colorFun; colorFun=v; classToFillStyle = EstLib.getColorLegend(colorFun); return out; };
		out.noDataFillStyle = function(v) { if (!arguments.length) return noDataFillStyle; noDataFillStyle=v; return out; };
		out.noDataText = function(v) { if (!arguments.length) return noDataText; noDataText=v; return out; };
		out.classToFillStyle = function(v) { if (!arguments.length) return classToFillStyle; classToFillStyle=v; return out; };
		out.filtersDefinitionFun = function(v) { if (!arguments.length) return filtersDefinitionFun; filtersDefinitionFun=v; return out; };
		out.psMaxSize = function(v) { if (!arguments.length) return psMaxSize; psMaxSize=v; return out; };
		out.showLegend = function(v) { if (!arguments.length) return showLegend; showLegend=v; return out; };

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
		var ps = opts.patternSize || 5;
		var smin = opts.minSize || 1;
		var smax = opts.maxSize || 5.5;
		opts.bckColor = opts.bckColor || "white";
		opts.symbColor = opts.symbColor || "black";
		return function(svg, clnb) {
			for(var i=0; i<clnb; i++) {
				var si = smin+(smax-smin)*i/(clnb-1);
				var patt = svg.append("pattern").attr("id","pattern_"+i).attr("x","0").attr("y","0").attr("width",ps).attr("height",ps).attr("patternUnits","userSpaceOnUse");
				patt.append("rect").attr("x",0).attr("y",0).attr("width",ps).attr("height",ps).style("stroke","none").style("fill",opts.bckColor)
				if(opts.shape=="square")
					patt.append("rect").attr("x",0).attr("y",0).attr("width",si).attr("height",si).style("stroke","none").style("fill",opts.symbColor)
				else
					patt.append("circle").attr("cx",ps*0.5).attr("cy",ps*0.5).attr("r",si*0.5).style("stroke","none").style("fill",opts.symbColor)
			}
		};
	};



}(d3, window.EstLib = window.EstLib || {} ));
