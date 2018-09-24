/**
 *
 * Make maps from Eurostat data
 *
 * @author julien Gaffuri
 *
 */
(function(d3, EstLib) {

	//TODO
	//youg/kos: check drawing order first. List all problems... fix them.
	//decompose?

	//*** v1 ***

	//diverging ramp -> define central value (0, average, 100, etc.)
	//fix zoom - line resize, etc.
	//propo circles: make nicer legend...
	//add "no data" in legend
	//constraint pan
	//adopt data cache ?
	//support data flags
	//svg export: with rounded coordinates - d3.round. test + edit in inkscape + fix. Function/button "export as svg"
	//js dependencies
	//choice
	//insets (with nuts2json)
	//transform nice nuts map using eurostat-map.js?
	//d3.v5.js ?
	//https://github.com/d3/d3-shape#symbols
	//proportional circles: extend to squares + other symbols?
	//typologies: use ordinal scale: var ordinal = d3.scaleOrdinal().domain(["a", "b", "c", "d", "e"]).range([ ... ]);

	//map with proportionnal rectangle (only height varies)/squares
	//composition chroploth + prop circle
	//composition choropleth map showing variation (diverging colors) + rectangle/bar showing quantities +/-
	//composition choropleth map showing share of something + pie chart (as ring if large) showing total quantity and further info on composition
	//maps with hash pattern. Test new patterns from https://riccardoscalco.it/textures/
	//map with fill pattern (hashes?) indicating composition
	//etc.

	EstLib.map = function() {

		//the output object
		var out = {};

		out.svgId_ = "map";
		out.type_ = "ch"; //or "ps"
		out.width_ = 800;
		out.datasetCode_ = "demo_r_d3dens";
		out.filters_ = { lastTimePeriod:1 };
		out.precision_ = 2;
		out.scale_ = "20M"; //3M, 10M, 20M, 60M
		out.scaleExtent_ = [1,4];
		out.proj_ = "3035";
		out.nutsLvl_ = 3;
		out.NUTSyear_ = 2013; //2010, 2013, 2016
		out.lg_ = "en";
		out.showTooltip_ = true;
		out.unitText_ = "";

		out.classifMethod_ = "quantile"; // or: equinter  threshold
		out.threshold_ = [0];
		out.makeClassifNice_ = true;
		out.clnb_ = 7;
		out.colorFun_ = d3.interpolateYlOrRd; // see https://github.com/d3/d3-scale-chromatic/   -   ex: interpolateGnBu
		out.classToFillStyle_ = EstLib.getColorLegend(out.colorFun_);
		out.filtersDefinitionFun_ = function() {};
		out.noDataFillStyle_ = "lightgray";
		out.noDataText_ = "No data";

		//proportional circles
		out.psMaxSize_ = 30;
		out.psMinSize_ = 0.8;
		out.psMinValue_ = 0;
		out.psFill_ = "#B45F04";
		out.psFillOpacity_ = 0.7;
		out.psStroke_ = "#fff";
		out.psStrokeWidth_ = 0.5;

		//style
		out.nutsrgFillStyle_ = "#eee"; //used for ps map
		out.nutsrgSelectionFillStyle_ = "purple";
		out.nutsbnStroke_ = {0:"#777",1:"#777",2:"#777",3:"#777",oth:"#444",co:"#1f78b4"};
		out.nutsbnStrokeWidth_ = {0:1,1:0.2,2:0.2,3:0.2,oth:1,co:1};
		out.cntrgFillStyle_ = "lightgray";
		out.cntrgSelectionFillStyle_ = "darkgray";
		out.cntbnStroke_ = "#777";
		out.cntbnStrokeWidth_ = 1;
		out.drawGraticule_ = true;
		out.graticuleStroke_ = "gray";
		out.graticuleStrokeWidth_ = 1;
		out.seaFillStyle_ = "#b3cde3";
		out.drawCoastalMargin_ = true;
		out.coastalMarginColor_ = "white";
		out.coastalMarginWidth_ = 12;
		out.coastalMarginStdDev_ = 12;

		//legend
		out.showLegend_ = true;
		out.legendFontFamily_ = EstLib.fontFamilyDefault;
		out.legendTitleText_ = "Legend";
		out.legendTitleFontSize_ = 20;
		out.legendTitleWidth_ = 140;
		out.legendBoxWidth_ = 250;
		out.legendBoxHeight_ = 350;
		out.legendBoxMargin_ = 10;
		out.legendBoxPadding_ = 10;
		out.legendBoxCornerRadius_ = out.legendBoxPadding_;
		out.legendBoxFill_ = "white";
		out.legendBoxOpacity_ = 0.5;
		out.legendCellNb_ = 4; // for ps only
		out.legendAscending_ = true;
		out.legendShapeWidth_ = 20;
		out.legendShapeHeight_ = 16;
		out.legendShapePadding_ = 2;
		out.legendLabelFontSize_ = 15;
		out.legendLabelDelimiter_ = " - ";
		out.legendLabelWrap_ = 140;
		out.legendLabelDecNb_ = 2;
		out.legendLabelOffset_ = 5;

		//definition of generic accessors based on the name of each property name
		for(var p in out)
			(function(){
				var p_=p;
				out[ p_.substring(0,p_.length-1) ] = function(v) { if (!arguments.length) return out[p_]; out[p_]=v; return out; };
			})();

		//override of some accessors
		out.colorFun = function(v) { if (!arguments.length) return out.colorFun_; out.colorFun_=v; out.classToFillStyle_ = EstLib.getColorLegend(out.colorFun_); return out; };
		out.threshold = function(v) { if (!arguments.length) return out.threshold_; out.threshold_=v; out.clnb(v.length+1); return out; };


		var statData, values, nutsData, nutsRG;
		var height, svg, path;
		var classif;

		var tooltip = out.showTooltip_? EstLib.tooltip() : null;

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
			.defer(d3.json, "https://raw.githubusercontent.com/eurostat/Nuts2json/gh-pages/" + out.NUTSyear_ + "/" + out.proj_ + "/" + out.scale_ + "/" + out.nutsLvl_ + ".json")
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
			//set precision
			out.filters_["precision"] = out.precision_;
			//select only required geo groups, depending on the specified nuts level
			out.filters_["geoLevel"] = out.nutsLvl_+""==="0"?"country":"nuts"+out.nutsLvl_;
			//force filtering of euro-geo-aggregates
			out.filters_["filterNonGeo"] = 1;
			d3.queue().defer(d3.json, EstLib.getEstatDataURL(out.datasetCode_, out.filters_)).await(
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
			height = out.width_ * (nutsData.bbox[3] - nutsData.bbox[1]) / (nutsData.bbox[2] - nutsData.bbox[0]),
			svg = d3.select("#"+out.svgId_).attr("width", out.width_).attr("height", height)
			path = d3.geoPath().projection(d3.geoIdentity().reflectY(true).fitSize([ out.width_, height ], topojson.feature(nutsData, nutsData.objects.gra)));

			if(out.drawCoastalMargin_)
				//define filter for coastal margin
				svg.append("filter").attr("id", "coastal_blur").attr("x","-100%").attr("y", "-100%").attr("width","400%")
					.attr("height", "400%").append("feGaussianBlur").attr("in", "SourceGraphic").attr("stdDeviation", out.coastalMarginStdDev_);

			//add additional filters for fill patterns for example
			out.filtersDefinitionFun_(svg, out.clnb_);

			//prepare drawing group
			var zg = svg.append("g").attr("id","zoomgroup").attr("transform", "translate(0,0)");
			if(out.scaleExtent_) {
				//add zoom function
				svg.call(d3.zoom().scaleExtent(out.scaleExtent_)
					.on("zoom", function() {
							var k = d3.event.transform.k;
							var cs = ["gra","bn_0","bn_oth","bn_co","cntbn"];
							for(var i=0; i<cs.length; i++)
								d3.selectAll("."+cs[i]).style("stroke-width", (1/k)+"px");
							zg.attr("transform", d3.event.transform);
						}));
			}

			//draw background rectangle
			zg.append("rect").attr("id", "sea").attr("x", 0).attr("y", 0)
				.attr("width", out.width_).attr("height", height)
				.style("fill", out.seaFillStyle_);

			if(out.drawCoastalMargin_) {
				//draw coastal margin
				var cg = zg.append("g").attr("id","g_coast_margin")	
					.style("fill", "none")
					.style("stroke-width", out.coastalMarginWidth_)
					.style("stroke", out.coastalMarginColor_)
					.style("filter", "url(#coastal_blur)")
					.style("stroke-linejoin", "round")
					.style("stroke-linecap", "round");
				//countries bn
				cg.append("g").attr("id","g_coast_margin_cnt")
					.selectAll("path").data(cntbn).enter().filter(function(bn){ return bn.properties.co === "T"; })
					.append("path").attr("d", path);
				//nuts bn
				cg.append("g").attr("id","g_coast_margin_nuts")
					.selectAll("path").data(nutsbn).enter().filter(function(bn){ return bn.properties.co === "T"; })
					.append("path").attr("d", path);
			}

			if(out.drawGraticule_) {
				//draw graticule
				zg.append("g").attr("id","g_gra")
					.style("fill", "none")
					.style("stroke", out.graticuleStroke_)
					.style("stroke-width", out.graticuleStrokeWidth_)
					.selectAll("path").data(gra)
					.enter().append("path").attr("d", path).attr("class", "gra");
			}

			//draw country regions
			zg.append("g").attr("id","g_cntrg").selectAll("path").data(cntrg)
				.enter().append("path").attr("d", path)
				.attr("class", "cntrg")
				.style("fill", out.cntrgFillStyle_)
				.on("mouseover",function(rg) {
					d3.select(this).style("fill", out.cntrgSelectionFillStyle_)
					if(out.showTooltip_) tooltip.mouseover("<b>" + rg.properties.na + "</b>");
				}).on("mousemove", function() {
					if(out.showTooltip_) tooltip.mousemove();
				}).on("mouseout", function() {
					d3.select(this).style("fill", out.cntrgFillStyle_)
					if(out.showTooltip_) tooltip.mouseout();
				});

			//draw NUTS regions
			zg.append("g").attr("id","g_nutsrg").selectAll("path").data(nutsRG)
				.enter().append("path").attr("d", path)
				.attr("class", "nutsrg")
				.attr("fill", out.nutsrgFillStyle_)
				.on("mouseover", function(rg) {
					var sel = d3.select(this);
					sel.attr("fill___", sel.attr("fill"));
					sel.attr("fill", out.nutsrgSelectionFillStyle_);
					if(out.showTooltip_) tooltip.mouseover("<b>" + rg.properties.na + "</b><br>" + (rg.properties.val||rg.properties.val==0? rg.properties.val + (out.unitText_?" "+out.unitText_:"") : out.noDataText_));
				}).on("mousemove", function() {
					if(out.showTooltip_) tooltip.mousemove();
				}).on("mouseout", function() {
					var sel = d3.select(this);
					sel.attr("fill", sel.attr("fill___"));
					if(out.showTooltip_) tooltip.mouseout();
				});

			//draw country boundaries
			zg.append("g").attr("id","g_cntbn")
				.style("fill", "none").style("stroke-linecap", "round").style("stroke-linejoin", "round")
				.selectAll("path").data(cntbn)
				.enter().append("path").attr("d", path)
				.attr("class", function(bn) {
					if (bn.properties.co === "T") return "bn_co"; return "cntbn";
				})
				.style("stroke", out.cntbnStroke_)
				.style("stroke-width", out.cntbnStrokeWidth_);

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
					if (bn.co === "T") return out.nutsbnStroke_.co || "#1f78b4";
					if (bn.oth === "T") return out.nutsbnStroke_.oth || "#444";
					return out.nutsbnStroke_[bn.lvl] || "#777";
				})
				.style("stroke-width", function(bn) {
					bn = bn.properties;
					if (bn.co === "T") return out.nutsbnStrokeWidth_.co || 1;
					if (bn.oth === "T") return out.nutsbnStrokeWidth_.oth || 1;
					return out.nutsbnStrokeWidth_[bn.lvl] || 0.2;
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
				if (!value) continue;
				if (isNaN(value.value)) continue;
				if (!value.value==0 && !value.value) continue;
				rg.properties.val = value.value;
				values.push(+value.value);
			}

			//update classification and styles
			out.updateClassificationAndStyle();

			return out;
		}

		//run when the classification has changed
		out.updateClassificationAndStyle = function() {

			if(out.type_ == "ch") {
				if(out.classifMethod_ === "quantile") {
					//https://github.com/d3/d3-scale#quantile-scales
					classif = d3.scaleQuantile().domain(values).range( [...Array(out.clnb_).keys()] );
				} else if(out.classifMethod_ === "equinter") {
					//https://github.com/d3/d3-scale#quantize-scales
					classif = d3.scaleQuantize().domain([d3.min(values),d3.max(values)]).range( [...Array(out.clnb_).keys()] );
					if(out.makeClassifNice_) classif.nice();
				} else if(out.classifMethod_ === "threshold") {
					//https://github.com/d3/d3-scale#threshold-scales
					out.clnb(out.threshold_.length + 1);
					classif = d3.scaleThreshold().domain(out.threshold_).range( [...Array(out.clnb_).keys()] );
				}

				//apply classification to nuts regions based on their value
				svg.selectAll("path.nutsrg")
				.attr("ecl", function(rg) {
					if (rg.properties.val!=0 && !rg.properties.val) return "nd";
					return +classif(+rg.properties.val);
				})
			} else if(out.type_ == "ps") {
				classif = d3.scaleSqrt().domain([out.psMinValue_, Math.max(...values)]).range([out.psMinSize_*0.5, out.psMaxSize_*0.5]);
			} else {
				console.log("Unknown map type: "+out.type_)
				return out;
			}

			//update legend
			out.updateLegend();

			//update style
			out.updateStyle();

			return out;
		};


		out.updateLegend = function() {
			var lgg = d3.select("#legendg");

			//draw legend
			if(!out.showLegend_) return out;

			//remove previous content
			lgg.selectAll("*").remove();

			if(out.type_ == "ch") {
				//locate
				out.legendBoxWidth_ = out.legendBoxWidth_ || out.legendBoxPadding_*2 + Math.max(out.legendTitleWidth_, out.legendShapeWidth_ + out.legendLabelOffset_ + out.legendLabelWrap_);
				out.legendBoxHeight_ = out.legendBoxHeight_ || out.legendBoxPadding_*2 + out.legendTitleFontSize_ + out.legendShapeHeight_ + (1+out.legendShapeHeight_+out.legendShapePadding_)*(out.clnb_-1) +12;
				lgg.attr("transform", "translate("+(out.width_-out.legendBoxWidth_-out.legendBoxMargin_+out.legendBoxPadding_)+","+(out.legendTitleFontSize_+out.legendBoxMargin_+out.legendBoxPadding_-6)+")");

				//background rectangle
				var lggBR = lgg.append("rect").attr("id", "legendBR").attr("x", -out.legendBoxPadding_).attr("y", -out.legendTitleFontSize_-out.legendBoxPadding_+6)
				.attr("rx", out.legendBoxCornerRadius_).attr("ry", out.legendBoxCornerRadius_)
				.attr("width", out.legendBoxWidth_).attr("height", out.legendBoxHeight_)
				.style("fill", out.legendBoxFill_).style("opacity", out.legendBoxOpacity_);

				//define legend
				//see http://d3-legend.susielu.com/#color
				var d3Legend = d3.legendColor()
				.title(out.legendTitleText_)
				.titleWidth(out.legendTitleWidth_)
				.useClass(true)
				.scale(classif)
				.ascending(out.legendAscending_)
				.shapeWidth(out.legendShapeWidth_)
				.shapeHeight(out.legendShapeHeight_)
				.shapePadding(out.legendShapePadding_)
				.labelFormat(d3.format(".0"+out.legendLabelDecNb_+"f"))
				//.labels(d3.legendHelpers.thresholdLabels)
				.labels(function(d) {
					if (d.i === 0)
						return "< " + d.generatedLabels[d.i].split(d.labelDelimiter)[1];
					else if (d.i === d.genLength-1)
						return ">=" + d.generatedLabels[d.i].split(d.labelDelimiter)[0];
					else
						return d.generatedLabels[d.i]
				})
				.labelDelimiter(out.legendLabelDelimiter_)
				.labelOffset(out.legendLabelOffset_)
				.labelWrap(out.legendLabelWrap_)
				//.labelAlign("end") //?
				//.classPrefix("from ")
				//.orient("vertical")
				//.shape("rect")
				.on("cellover", function(ecl){
					var sel = d3/*.select("#g_nutsrg")*/.selectAll("[ecl='"+ecl+"']");
					sel.style("fill", out.nutsrgSelectionFillStyle_);
					sel.attr("fill___", function(d) { d3.select(this).attr("fill"); });
				})
				.on("cellout", function(ecl){
					var sel = d3/*.select("#g_nutsrg")*/.selectAll("[ecl='"+ecl+"']");
					sel.style("fill", function(d) { d3.select(this).attr("fill___"); });
				});

				//make legend
				lgg.call(d3Legend);

				//apply style to legend elements
				svg.selectAll(".swatch")
				.attr("ecl", function() {
					var ecl = d3.select(this).attr("class").replace("swatch ","");
					if(!ecl||ecl==="nd") return "nd";
					return ecl;
				})
				.attr("fill", function() {
					var ecl = d3.select(this).attr("class").replace("swatch ","");
					if(!ecl||ecl==="nd") return out.noDataFillStyle_ || "gray";
					return out.classToFillStyle_( ecl, out.clnb_ );
				})
				//.attr("stroke", "black")
				//.attr("stroke-width", 0.5)
				;
				lgg.select(".legendTitle").style("font-size", out.legendTitleFontSize_);
				lgg.selectAll("text.label").style("font-size", out.legendLabelFontSize_);
				lgg.style("font-family", out.legendFontFamily_);

			} else if(out.type_ == "ps") {

				//locate
				out.legendBoxWidth_ = out.legendBoxWidth_ || out.legendBoxPadding_*2 + Math.max(out.legendTitleWidth_, out.psMaxSize_ + out.legendLabelOffset_ + out.legendLabelWrap_);
				out.legendBoxHeight_ = out.legendBoxHeight_ || out.legendBoxPadding_*2 + out.legendTitleFontSize_ + (out.psMaxSize_*0.7+out.legendShapePadding_)*(out.legendCellNb_)+35;
				lgg.attr("transform", "translate("+(out.width_-out.legendBoxWidth_-out.legendBoxMargin_+out.legendBoxPadding_)+","+(out.legendTitleFontSize_+out.legendBoxMargin_+out.legendBoxPadding_-6)+")");

				//background rectangle
				var lggBR = lgg.append("rect").attr("id", "legendBR").attr("x", -out.legendBoxPadding_).attr("y", -out.legendTitleFontSize_-out.legendBoxPadding_+6)
				.attr("rx", out.legendBoxCornerRadius_).attr("ry", out.legendBoxCornerRadius_)
				.attr("width", out.legendBoxWidth_).attr("height", out.legendBoxHeight_)
				.style("fill", out.legendBoxFill_).style("opacity", out.legendBoxOpacity_);

				//define legend
				//see http://d3-legend.susielu.com/#size
				var d3Legend = d3.legendSize()
				.title(out.legendTitleText_)
				.titleWidth(out.legendTitleWidth_)
				.scale(classif)
				.cells(out.legendCellNb_+1)
				.cellFilter(function(d){ if(!d.data) return false; return true; })
				.orient("vertical")
				.ascending(out.legendAscending_)
				.shape("circle") //"rect", "circle", or "line"
				.shapePadding(out.legendShapePadding_)
				//.classPrefix("prefix")
				.labels(function(d) { return d.generatedLabels[d.i] })
				//.labelAlign("middle") //?
				.labelFormat(d3.format("."+out.legendLabelDecNb_+"f"))
				.labelOffset(out.legendLabelOffset_)
				.labelWrap(out.legendLabelWrap_)
				;

				//make legend
				lgg.call(d3Legend);

				//apply style to legend elements
				svg.selectAll(".swatch")
				.style("fill", out.psFill_)
				.style("fill-opacity", out.psFillOpacity_)
				.style("stroke", out.psStroke_)
				.style("stroke-width", out.psStrokeWidth_);

				lgg.select(".legendTitle").style("font-size", out.legendTitleFontSize_);
				lgg.selectAll("text.label").style("font-size", out.legendLabelFontSize_);
				lgg.style("font-family", out.legendFontFamily_);

			} else {
				console.log("Unknown map type: "+out.type_)
			}

			return out;
		};


		//run when the map style/legend has changed
		out.updateStyle = function() {

			if(out.type_ == "ch") {
				//choropleth map
				//apply style to nuts regions depending on class
				svg.selectAll("path.nutsrg")
				.attr("fill", function() {
					var ecl = d3.select(this).attr("ecl");
					if(!ecl||ecl==="nd") return out.noDataFillStyle_ || "gray";
					return out.classToFillStyle_( ecl, out.clnb_ );
				});

			} else if (out.type_ == "ps") {
				//proportionnal symbol map
				//see https://bl.ocks.org/mbostock/4342045 and https://bost.ocks.org/mike/bubble-map/

				d3.select("#g_ps").selectAll("circle")
				.data(nutsRG.sort(function(a, b) { return b.properties.val - a.properties.val; }))
				.enter().filter(function(d) { return d.properties.val; })
				.append("circle")
				.attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
				.attr("r", function(d) { return d.properties.val? classif(+d.properties.val) : 0; })
				.attr("class","symbol")
				.on("mouseover", function(rg) {
					d3.select(this).style("fill", out.nutsrgSelectionFillStyle_)
					if(out.showTooltip_) tooltip.mouseover("<b>" + rg.properties.na + "</b><br>" + (rg.properties.val||rg.properties.val==0? rg.properties.val + (out.unitText_?" "+out.unitText_:"") : out.noDataText_));
				}).on("mousemove", function() {
					if(out.showTooltip_) tooltip.mousemove();
				}).on("mouseout", function() {
					d3.select(this).style("fill", out.psFill_)
					if(out.showTooltip_) tooltip.mouseout();
				})
				.style("fill", out.psFill_)
				.style("fill-opacity", out.psFillOpacity_)
				.style("stroke", out.psStroke_)
				.style("stroke-width", out.psStrokeWidth_);

			} else {
				console.log("Unexpected map type: "+out.type_);
			}
			return out;
		};


		//retrieve the time stamp of the map, even if not specified in the dimension initially
		out.getTime = function() {
			var t = out.filters_.time;
			if(t) return t;
			if(!statData) return;
			t = statData.Dimension("time");
			if(!t || !t.id || t.id.length==0) return;
			return t.id[0]
		};

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
