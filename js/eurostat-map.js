/**
 *
 * Make maps from Eurostat data
 *
 * @author julien Gaffuri
 *
 */
(function(d3, EstLib) {

	//pattern: make diameter larger than size
	//make symbols truly proportionnal
	//adopt new shema (simple)
	//add classification method as parameter
	//add legend
	//support data flags
	//check how no-data is handled
	//insets (with nuts2json)
	//transform nice nuts map using eurostat-map.js?

	
	EstLib.map = function(svgId, ebcode, dimensions, opts) {
		opts = opts || {};
		opts.type = opts.type || "ch"; //or "ps"
		opts.width = opts.width || 800;
		opts.scale = opts.scale || "20M";
		opts.nutsLvl = opts.nutsLvl || "3";
		opts.time = opts.time || "2016";
		opts.proj = opts.proj || "3035";
		opts.NUTSyear = opts.NUTSyear || 2013;
		opts.clnb = opts.clnb || 7;
		opts.lg = opts.lg || "en";
		opts.preFun = opts.preFun || function() {};
		opts.postFun = opts.postFun || function() {};
		opts.zoom = opts.zoom==null? true : opts.zoom;
		opts.zoomExtentMin = opts.zoomExtentMin || 0.5;
		opts.zoomExtentMax = opts.zoomExtentMax || 6;
		opts.bckFillColor = opts.bckFillColor || "#b3cde3";
		opts.drawGraticule = opts.drawGraticule==null? true : opts.drawGraticule;
		opts.drawCoastalMargin = opts.drawCoastalMargin==null? true : opts.drawCoastalMargin;
		opts.coastalMarginColor = opts.coastalMarginColor || "white";
		opts.tooltip = opts.tooltip==null? true : opts.tooltip;
		opts.unitText = opts.unitText || "";
		if(opts.type==="ch") opts.classToFillStyle = opts.classToFillStyle || EstLib.getColorLegend(opts.clnb);
		opts.filtersDefinitionFun = opts.filtersDefinitionFun || function(svg) {};



		d3.queue()
		.defer(d3.json, "https://raw.githubusercontent.com/eurostat/Nuts2json/gh-pages/" + opts.NUTSyear + "/" + opts.proj + "/" + opts.scale + "/" + opts.nutsLvl + ".json")
		.defer(d3.json, EstLib.getEstatDataURL(ebcode, dimensions))
		.await(
				function(error, nuts, data) {
					//execute prefunction
					opts.preFun();

					//tooltip element
					var tooltip = opts.tooltip? EstLib.tooltip() : null;

					//decode statistical data
					data = JSONstat(data).Dataset(0);

					//prepare SVG element
					var height = opts.width * (nuts.bbox[3] - nuts.bbox[1]) / (nuts.bbox[2] - nuts.bbox[0]),
						svg = d3.select("#"+svgId).attr("width", opts.width).attr("height", height)
						path = d3.geoPath().projection(d3.geoIdentity().reflectY(true).fitSize([ opts.width, height ], topojson.feature(nuts, nuts.objects.gra)));

					if(opts.drawCoastalMargin)
						//define filter for coastal margin
						svg.append("filter").attr("id", "blur").attr("x","-100%").attr("y", "-100%").attr("width","400%")
							.attr("height", "400%").append("feGaussianBlur").attr("in", "SourceGraphic").attr("stdDeviation", "4");
					
					//add additional filters
					opts.filtersDefinitionFun(svg);

					//draw background rectangle
					svg.append("rect").attr("id", "bck").attr("x", 0)
							.attr("y", 0).attr("width", opts.width).attr("height", height)
							.style("fill", opts.bckFillColor);

					//prepare drawing group
					var g = svg.append("g").attr("transform", "translate(0,0)");
					if(opts.zoom) {
						//add zoom function
						svg.call(d3.zoom().scaleExtent([ opts.zoomExtentMin, opts.zoomExtentMax ])
							.on("zoom",
								function() {
									var k = d3.event.transform.k;
									d3.selectAll(".gra").style("stroke-width", (1/k)+"px");
									d3.selectAll(".bn_0").style("stroke-width", (1/k)+"px");
									d3.selectAll(".bn_oth").style("stroke-width", (1/k)+"px");
									d3.selectAll(".bn_co").style("stroke-width", (1/k)+"px");
									d3.selectAll(".cntbn").style("stroke-width", (1/k)+"px");
									g.attr("transform", d3.event.transform);
								}));
					}

					if(opts.drawCoastalMargin) {
						//draw coastal margin
						g.append("g").selectAll("path").data(topojson.feature(nuts, nuts.objects.cntbn).features)
							.enter().append("path").attr("d", path)
							.style("fill", "none")
							.style("stroke-width", "8px")
							.style("filter", "url(#blur)")
							.style("stroke-linejoin", "round")
							.style("stroke-linecap", "round")
							.style("stroke", function(bn) {
									if (bn.properties.co === "T") return opts.coastalMarginColor; return "none";
							});
						g.append("g").selectAll("path").data(topojson.feature(nuts, nuts.objects.nutsbn).features)
							.enter().append("path").attr("d", path)
							.style("fill", "none")
							.style("stroke-width", "8px")
							.style("filter", "url(#blur)")
							.style("stroke-linejoin", "round")
							.style("stroke-linecap", "round")
							.style("stroke", function(bn) {
									if (bn.properties.co === "T") return opts.coastalMarginColor; return "none";
							});
					}

					if(opts.drawGraticule) {
						//draw graticule
						g.append("g").selectAll("path").data(topojson.feature(nuts,nuts.objects.gra).features)
							.enter().append("path").attr("d", path)
							.style("fill", "none")
							.attr("class", "gra");
					}

					//draw country regions
					g.append("g").selectAll("path").data(topojson.feature(nuts, nuts.objects.cntrg).features)
						.enter().append("path").attr("d", path)
						.attr("class", "cntrg")
						.on("mouseover",function(rg) {
							if(opts.tooltip) tooltip.mouseover("<b>" + rg.properties.na + "</b>");
						}).on("mousemove", function() {
							if(opts.tooltip) tooltip.mousemove();
						}).on("mouseout", function() {
							if(opts.tooltip) tooltip.mouseout();
						})

					//prepare NUTS regions data
					var nutsRG = topojson.feature(nuts, nuts.objects.nutsrg).features;

					//link values to NUTS regions and build list of values to make classification
					var values = [];
					for (var i=0; i<nutsRG.length; i++) {
						var rg = nutsRG[i];
						var value = data.Data({ geo : rg.properties.id });
						if (!value || !value.value) continue;
						rg.properties.val = value.value;
						values.push(+value.value);
					}

					//build list of classes and classification based on quantiles
					var classif = d3.scaleQuantile().domain(values).range( [...Array(opts.clnb).keys()] );
					classif.quantiles();

					//draw NUTS regions regions
					g.append("g").selectAll("path").data(nutsRG)
						.enter().append("path").attr("d", path)
						.attr("class", "nutsrg")
						.attr("ecl", function(rg) {
							if (!rg.properties.val) return "nd";
							return +classif(+rg.properties.val);
						}).on("mouseover", function(rg) {
							if(opts.tooltip) tooltip.mouseover("<b>" + rg.properties.na + "</b><br>" + rg.properties.val + (opts.unitText?" "+opts.unitText:""));
						}).on("mousemove", function() {
							if(opts.tooltip) tooltip.mousemove();
						}).on("mouseout", function() {
							if(opts.tooltip) tooltip.mouseout();
						});

					//draw country boundaries
					g.append("g").selectAll("path").data(topojson.feature(nuts, nuts.objects.cntbn).features)
						.enter().append("path").attr("d", path)
						.style("fill", "none").style("stroke-linecap", "round").style("stroke-linejoin", "round")
						.attr("class", function(bn) {
							if (bn.properties.co === "T")return "bn_co"; return "cntbn";
						});

					//draw NUTS boundaries
					var bn = topojson.feature(nuts, nuts.objects.nutsbn).features;
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


					if(opts.type == "ps") {
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
							if(opts.tooltip) tooltip.mouseover("<b>" + rg.properties.na + "</b><br>" + rg.properties.val + (opts.unitText?" "+opts.unitText:""));
						}).on("mousemove", function() {
							if(opts.tooltip) tooltip.mousemove();
						}).on("mouseout", function() {
							if(opts.tooltip) tooltip.mouseout();
						});

					} else {
						//choropleth map
						//apply style to nuts regions depending on class
						g.selectAll("path.nutsrg")
						.attr("fill", function() {
							return opts.classToFillStyle[ d3.select(this).attr("ecl") ];
						});
					}


					//execute postfunction
					opts.postFun();

				});

	};



	//build a color legend object
	EstLib.getColorLegend = function(clnb, opts) {
		opts = opts || {};
		//see https://github.com/d3/d3-scale-chromatic/
		//ex: interpolateGnBu
		opts.colorFun = opts.colorFun || d3.interpolateYlOrRd;
		opts.nd = opts.nd || "lightgray";
		var classToStyle = {};
		for (var ecl = 0; ecl < clnb; ecl++)
			classToStyle[ecl] = opts.colorFun( ecl/(clnb-1) );
		classToStyle.nd = opts.nd;
		return classToStyle;
	}



	//point pattern map
	
	//build a point pattern legend object
	EstLib.getDottedLegend = function(clnb, opts) {
		opts = opts || {};
		opts.nd = opts.nd || "white";
		var classToStyle = {};
		for (var ecl = 0; ecl < clnb; ecl++)
			classToStyle[ecl] = "url(#pattern_"+ecl+")";
		classToStyle.nd = opts.nd;
		return classToStyle;
	}
	//make function which build point patterns style
	EstLib.getDottedPatternDefinitionFun = function(clnb, opts) {
		opts = opts || {};
		opts.shape = opts.shape || "circle";
		var s = opts.patternSize || 10;
		opts.bckColor = opts.bckColor || "white";
		opts.symbColor = opts.symbColor || "black";
		return function(svg) {
			for(var i=0; i<clnb; i++) {
				var si = s*i/(clnb-1);
				var patt = svg.append("pattern").attr("id","pattern_"+i).attr("x","0").attr("y","0").attr("width",s).attr("height",s).attr("patternUnits","userSpaceOnUse");
				patt.append("rect").attr("x",0).attr("y",0).attr("width",s).attr("height",s).style("stroke","none").style("fill",opts.bckColor)
				if(opts.shape=="square")
					patt.append("rect").attr("x",0).attr("y",0).attr("width",si).attr("height",si).style("stroke","none").style("fill",opts.symbColor)
				else
					patt.append("circle").attr("cx",s*0.5).attr("cy",s*0.5).attr("r",si*0.7).style("stroke","none").style("fill",opts.symbColor)
			}
		};
	};









	EstLib.map2 = function(){
		var
		codesHierarchy = {}, //codesHierarchy: code,children[]
		div = "sunburst", //the div element where to build the svg element
		radius = 150 //the chart size
		;

		//the output object
		var out = {};

		var
		shapes
		;



		var build = function(){
			//build
			//shapes = shapesG.datum(codesHierarchy).selectAll("path")
			//out.function35325(0);
		};

		//set data, with transition
		//values: code:value
		out.set = function(data, duration){
			duration = duration || 0;

/*
			shapes.data(partition.value(function(d) { return values?values[d.code]:1; }).nodes)
			.transition().duration(duration).attrTween("d", arcTween)
			.each("end", function(){ out.drawLabels(duration*0.5); })
			;*/
			return out;
		};



		out.codesHierarchy = function(v) {
			if (!arguments.length) return codesHierarchy;
			codesHierarchy=v;
			build();
			return out;
		};

		out.div = function(v) {
			if (!arguments.length) return div;
			div=v;
			build();
			return out;
		};

		out.radius = function(v) {
			if (!arguments.length) return radius;
			radius=v;
			build();
			return out;
		};

		return out;
	}


}(d3, window.EstLib = window.EstLib || {} ));
