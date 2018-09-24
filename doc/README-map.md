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

Then, add the SVG element where the map should appear somewhere on your page:

```html
<svg id="map"></svg>
```

And finally, specify the map content and style in javascript. The example below draws a map showing population density in 2016 from Eurostat database *[demo_r_d3dens](http://appsso.eurostat.ec.europa.eu/nui/show.do?dataset=demo_r_d3dens)*. See [the result](https://bl.ocks.org/jgaffuri/raw/0d6e1b1c6f9e1297829f38b9c37737fe/) and [the code](https://bl.ocks.org/jgaffuri/0d6e1b1c6f9e1297829f38b9c37737fe).

```javascript
EstLib.map()
.width(1000)
.datasetCode("demo_r_d3dens")
.filters({time : 2016})
.unitText("people/km²")
.legendTitleText("Population density (people/km²)")
.legendBoxHeight(210)
.legendBoxWidth(190)
.build();
```


## Documentation

| Method | Type | Default value | Description |
| --- | --- | --- | --- |
| svgId | String | "map" | The id of the SVG element where to draw the map. |
| type | String | "ch" | The type of map. Possible values are "ch" for choropleth maps and "ps" for proportional symbols. |
| width | int | 800 | The width of the map in pixel. |
| datasetCode | String | "demo_r_d3dens" for population density map. | The Eurostat database code to retrieve the statistical figures. See [here](https://ec.europa.eu/eurostat/data/database) to find them. |
| filters | Object | { lastTimePeriod : 1 } |  The Eurostat dimension codes to filter the statistical figures. See [here](https://ec.europa.eu/eurostat/data/database) or [here](https://ec.europa.eu/eurostat/web/json-and-unicode-web-services/getting-started/query-builder) to find them.  |
| precision | int | 2 | The precision of the statistical figures to retrieve (number of decimal places). |
| scale | String | "20M" | The simplification level of the map, among "10M", "20M", "60M". |
| scaleExtent | Array | [1,4] | The zoom extent. Set to null to forbid zooming. |
| proj | String | "3035" | The map projection code. Possible values are given in [Nuts2json](https://github.com/eurostat/Nuts2json/blob/gh-pages/README.md)  |
| nutsLvl | int | 3 | The nuts level to show on the map, from 0 (national level) to 3 (local level) |
| NUTSyear | int | 2013 | The version of the NUTS dataset to use. Possible values are given in [Nuts2json](https://github.com/eurostat/Nuts2json/blob/gh-pages/README.md) |
| lg | String | "en" | The language. |
| showTooltip | boolean | true | A boolean value indicating if tooltip should appear on the map. |
| unitText | String | "" | The text to display to show the unit in the tooltip |

### For choropleth maps

When *type* is set to *"ch"*.

| Method | Type | Default value | Description |
| --- | --- | --- | --- |
| classifMethod | String | "quantile" | The classification method. Possible values are "quantile", "equinter" for equal intervals, and "threshold" for user defined threshol (see threshold method). |
| threshold | Array | [0] | classifMethod="threshold", the breaks of the classification. |
| makeClassifNice | boolean | true | Make nice break values. Works only for classifMethod="equinter". |
| clnb | int | 7 | The number of classes. |
| colorFun | thins or function | d3.interpolateYlOrRd | The color function, as defined in https://github.com/d3/d3-scale-chromatic/ |
| classToFillStyle | Function | See description | A function returning a fill style for each class number. The default values is the function returned by *EstLib.getColorLegend(colorFun())*. |
| filtersDefinitionFun | Function | function() {} | A function defining SVG filter elements. To be used to defined fill patterns.  |
| noDataFillStyle | String | "lightgray" | The fill style to be used for regions where no data is available. |
| noDataText | String | "No data" | The text to show for regions where no data is available.  |

### For proportional symbol map

When *type* is set to *"ps"*.

| Method | Type | Default value | Description |
| --- | --- | --- | --- |
| psMaxSize | number | 30 | The maximum size, in pixel. |
| psMinSize | number | 0.8 | The minimum size, for non null values, in pixel. |
| psMinValue | number | 0 | The minimum value of the range domain. |
| psFill |  | String | "#B45F04" | The fill color or pattern of the symbol. |
| psFillOpacity | number | 0.7 | The opacity of the symbol, from 0 to 1. |
| psStroke | String | "#fff" | The stroke color of pattern of the symbol. |
| psStrokeWidth | number | 0.5 | The width of the stroke. |

### Specify map template style

| Method | Type | Default value | Description |
| --- | --- | --- | --- |
| nutsrgFillStyle | String | "#eee" | The fill style of the NUTS regions, used for proportional circle maps. |
| nutsrgSelectionFillStyle | String | "#purple" | The fill style of the selected NUTS regions. |
| nutsbnStroke | String | {0:"#777", 1:"#777", 2:"#777", 3:"#777", oth:"#444", co:"#1f78b4"} | The stroke style of the NUTS boundaries, depending on the NUTS level. |
| nutsbnStrokeWidth | number | {0:1, 1:0.2, 2:0.2, 3:0.2, oth:1, co:1} | The stroke width of the NUTS boundaries, depending on the NUTS level. |
| cntrgFillStyle | String | "lightgray" | The fill style of the countries. |
| cntrgSelectionFillStyle | String | "darkgray" | The fill style of the selected countries. |
| cntbnStroke | String | "#777" | The stroke style of the country boundaries. |
| cntbnStrokeWidth | number | 1 | The stroke width of the country boundaries. |
| drawGraticule | boolean | true | Set to true to show the graticule (meridian and parallel lines). False otherwise. |
| graticuleStroke | String | "gray" | The stroke style of the graticule. |
| graticuleStrokeWidth | number | 1 | The stroke width of the graticule. |
| seaFillStyle | String | "#b3cde3" | The fill style of the sea areas. |
| drawCoastalMargin | boolean | true | Set to true to show a coastal blurry margin. False otherwise. |
| coastalMarginColor | String | "white" | The color of the coastal blurry margin. |
| coastalMarginWidth | number | 12 | The width of the coastal blurry margin. |
| coastalMarginStdDev | number | 12 | The standard deviation of the coastal blurry margin. |

### Specify the legend

| Method | Type | Default value | Description |
| --- | --- | --- | --- |
| showLegend | boolean | true | Set to true to show a legend. False otherwise. |
| legendFontFamily | String | EstLib.fontFamilyDefault | The legend font. |
| legendTitleText | String | "Legend" | The legend title. |
| legendTitleFontSize | int | 20 | The legend title font size. |
| legendTitleWidth | int | 140 | The legend title text wrap, in pixel. |
| legendBoxWidth | int | 250 | The legend box width. |
| legendBoxHeight | int | 350 | The legend box height. |
| legendBoxMargin | int | 10 | The legend box margin, in pixel. |
| legendBoxPadding | int | 10 | The legend box padding, in pixel. |
| legendBoxCornerRadius | int | 10 | The legend box corner radius, in pixel. |
| legendBoxFill | String | "white" | The legend box fill style. |
| legendBoxOpacity | number | 0.5 | The legend box opacity, from 0 to 1. |
| legendCellNb | int | 4 | The legend cells number (used for proportional symbol maps only). |
| legendAscending | String | true | The legend cells order. |
| legendShapeWidth | int | 20 | The cell width (used for choropleth maps only). |
| legendShapeHeight | int | 16 | The cell heigth (used for choropleth maps only). |
| legendShapePadding | int | 2 | The distance between 2 cells, in pixel. |
| legendLabelFontSize | int | 15 | The label font size. |
| legendLabelDelimiter | String | " - " | The label delimiter size (used for choropleth maps only). |
| legendLabelWrap | int | 140 | The label text wrap length, in pixel. |
| legendLabelDecNb | int | 2 | The number of decimal places to show in text labels. |
| legendLabelOffset | int | 5 | The number of pixels between the legend shape and its label, in pixel. |

### Update the map

After changing some parameters, one of the following methods need to be executed:

| Method | Returns | Description |
| --- | --- | --- |
| build | this | Build (or rebuild) the entire map. |
| updategeoData | this | Update the map when paramters on the geometries have changed. |
| updateStatData | this | Update the map when paramters on the statistical data have changed. |
| buildMapTemplate | this | Update the map when paramters on the map template have changed. |
| updateClassificationAndStyle | this | Update the map when paramters on the classification have changed. |
| updateLegend | this | Update the map when paramters on the legend have changed.  |
| updateStyle | this | Update the map when paramters on the style have changed.  |

### Others

| Method | Returns | Description |
| --- | --- | --- |
| getTime | String | Return the "time" parameter of the statistical data. It is necessary when a filter such as *{ lastTimePeriod : 1 }* is used. |
| set | this | Run 'myMap.set(EstLib.getURLParameters())' to retrieve parameters defined in the URL and apply them to a map element directly. |

Anything missing? Feel free to [ask](https://github.com/eurostat/eurostat.js/issues/new) !

## Technical details

Maps based on [NUTS regions](http://ec.europa.eu/eurostat/web/nuts/overview) rely on [Nuts2json API](https://github.com/eurostat/Nuts2json/blob/gh-pages/README.md) and [TopoJSON](https://github.com/mbostock/topojson/wiki) format. Statistical data are accessed using [Eurostat REST webservice](http://ec.europa.eu/eurostat/web/json-and-unicode-web-services/getting-started/rest-request) for [JSON-stat](https://json-stat.org/) data. The data are decoded and queried using [JSON-stat library](https://json-stat.com/). Maps are rendered as SVG maps using [D3.js library](https://d3js.org/).

## Support and contribution

Feel free to [ask support](https://github.com/eurostat/eurostat.js/issues/new), fork the project or simply star it (it's always a pleasure).
