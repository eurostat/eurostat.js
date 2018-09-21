# eurostat-map.js

Reusable library for web maps showing [Eurostat](https://ec.europa.eu/eurostat) data.

[![Example](img/ch_ex.png)](https://bl.ocks.org/jgaffuri/raw/0d6e1b1c6f9e1297829f38b9c37737fe/)
[![Example](img/ps_ex.png)](https://bl.ocks.org/jgaffuri/raw/cf5f187bd195f9c8771a1a3a4898079a/)
[![Example](img/pp_ex.png)](https://bl.ocks.org/jgaffuri/raw/c8b99b207bb80a923bf1fd19f5d6de7e/)

## Examples

* [Population density map](https://bl.ocks.org/jgaffuri/raw/0d6e1b1c6f9e1297829f38b9c37737fe/) (see [the code](https://bl.ocks.org/jgaffuri/0d6e1b1c6f9e1297829f38b9c37737fe))
* [Population density map with dot pattern](https://bl.ocks.org/jgaffuri/raw/c8b99b207bb80a923bf1fd19f5d6de7e/) (see [the code](https://bl.ocks.org/jgaffuri/c8b99b207bb80a923bf1fd19f5d6de7e))
* [Population map with proportional circles](https://bl.ocks.org/jgaffuri/raw/cf5f187bd195f9c8771a1a3a4898079a/) (see [the code](https://bl.ocks.org/jgaffuri/cf5f187bd195f9c8771a1a3a4898079a))

## Quick start

First, add the various required libraries, replacing *X.Y.Z* with the version number of the last release (see [here](https://github.com/eurostat/eurostat.js/releases)):

```html
<script src="https://d3js.org/d3.v4.min.js"></script>
<script src="https://d3js.org/d3-queue.v3.min.js"></script>
<script src="https://d3js.org/topojson.v1.min.js"></script>
<script src="https://d3js.org/d3-color.v1.min.js"></script>
<script src="https://d3js.org/d3-interpolate.v1.min.js"></script>
<script src="https://d3js.org/d3-scale-chromatic.v1.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3-legend/2.25.6/d3-legend.min.js"></script>

<script src="https://cdn.jsdelivr.net/npm/jsonstat@0.13.3/json-stat.js"></script>

<script src="https://cdn.jsdelivr.net/gh/eurostat/eurostat.js@X.Y.Z/js/eurostat-lib.js"></script>
<script src="https://cdn.jsdelivr.net/gh/eurostat/eurostat.js@X.Y.Z/js/eurostat-map.js"></script>
<script src="https://cdn.jsdelivr.net/gh/eurostat/eurostat.js@X.Y.Z/js/eurostat-tooltip.js"></script>
```

Then, add a SVG element where the map should appear:

```html
<svg id="map"></svg>
```

And finally, specify the map content and style in javascript. The example below draws a map showing population density in 2016 from Eurostat database *[demo_r_d3dens](http://appsso.eurostat.ec.europa.eu/nui/show.do?dataset=demo_r_d3dens)*. See [the result](https://bl.ocks.org/jgaffuri/raw/0d6e1b1c6f9e1297829f38b9c37737fe/) and [the code](https://bl.ocks.org/jgaffuri/0d6e1b1c6f9e1297829f38b9c37737fe).

```javascript
EstLib.map()
.width(1000)
.ebcode("demo_r_d3dens")
.dimensions({time : 2016})
.unitText("people/km²")
.legendTitleText("Population density (people/km²)")
.legendBoxHeight(210)
.legendBoxWidth(190)
.build();
```


## Documentation

| Method | Returns | Default value | Description |
| --- | --- | --- | --- |
| svgId | this or String |  |  |
| type |  |  |  |
| width |  |  |  |
| ebcode |  |  |  |
| dimensions |  |  |  |
| unitText |  |  |  |
| scale |  |  |  |
| scaleExtent |  |  |  |
| proj |  |  |  |
| nutsLvl |  |  |  |
| NUTSyear |  |  |  |
| lg |  |  |  |
| showTooltip |  |  |  |
|  |  |  |  |
| classifMethod |  |  |  |
| threshold |  |  |  |
| makeClassifNice |  |  |  |
| clnb |  |  |  |
| colorFun |  |  |  |
| classToFillStyle |  |  |  |
| filtersDefinitionFun |  |  |  |
| noDataFillStyle |  |  |  |
| noDataText |  |  |  |
|  |  |  |  |
| psMaxSize |  |  |  |
| psMinSize |  |  |  |
| psFill |  |  |  |
| psFillOpacity |  |  |  |
| psStroke |  |  |  |
| psStrokeWidth |  |  |  |
|  |  |  |  |
| nutsrgFillStyle |  |  |  |
| nutsrgSelectionFillStyle |  |  |  |
| nutsbnStroke |  |  |  |
| nutsbnStrokeWidth |  |  |  |
| cntrgFillStyle |  |  |  |
| cntrgSelectionFillStyle |  |  |  |
| cntbnStroke |  |  |  |
| cntbnStrokeWidth |  |  |  |
| drawGraticule |  |  |  |
| graticuleStroke |  |  |  |
| graticuleStrokeWidth |  |  |  |
| seaFillStyle |  |  |  |
| drawCoastalMargin |  |  |  |
| coastalMarginColor |  |  |  |
|  |  |  |  |
| showLegend |  |  |  |
| legendFontFamily |  |  |  |
| legendTitleText |  |  |  |
| legendTitleFontSize |  |  |  |
| legendTitleWidth |  |  |  |
| legendAscending |  |  |  |
| legendCellNb |  |  |  |
| legendLabelWrap |  |  |  |
| legendLabelDecNb |  |  |  |
| legendLabelOffset |  |  |  |
| legendLabelFontSize |  |  |  |
| legendLabelDelimiter |  |  |  |
| legendShapeWidth |  |  |  |
| legendShapeHeight |  |  |  |
| legendShapePadding |  |  |  |
| legendBoxMargin |  |  |  |
| legendBoxPadding |  |  |  |
| legendBoxCornerRadius |  |  |  |
| legendBoxOpacity |  |  |  |
| legendBoxFill |  |  |  |
| legendBoxWidth |  |  |  |
| legendBoxHeight |  |  |  |


## Technical details

Maps based on [NUTS regions](http://ec.europa.eu/eurostat/web/nuts/overview) rely on [Nuts2json API](https://github.com/eurostat/Nuts2json/blob/gh-pages/README.md) and [TopoJSON](https://github.com/mbostock/topojson/wiki) format. Statistical data are accessed using [Eurostat REST webservice](http://ec.europa.eu/eurostat/web/json-and-unicode-web-services/getting-started/rest-request) for [JSON-stat](https://json-stat.org/) data. The data are decoded and queried using [JSON-stat library](https://json-stat.com/). Maps are rendered as SVG maps using [D3.js library](https://d3js.org/).

## Support and contribution

Feel free to [ask support](https://github.com/eurostat/eurostat.js/issues/new), fork the project or simply star it (it's always a pleasure).
