/**
 *
 * Generic functions for eurostat statistics
 * Dependence: d3js v4
 *
 * @author julien Gaffuri
 *
 */
(function(d3, EstLib) {


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

}(d3, window.EstLib = window.EstLib || {} ));
