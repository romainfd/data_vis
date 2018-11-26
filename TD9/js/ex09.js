var ctx = {
    w: 800,
    h: 400,
    LA_MIN: 41.31,
    LA_MAX: 51.16,
    LO_MIN: -4.93,
    LO_MAX: 7.72,
    TRANSITION_DURATION: 1000,
    scale: 1,
    currentFlights: [],
    planeUpdater: null,
    lowAltBound: 0,
    highAltBound: 0,
    binSize: 1000,  // in meters (for the altitude)
    updateRate: 10000,  // in ms
    maxAlt: 15000  // in meters (to filter input data)
};

var colorInvert = d3.scaleLinear()
    .domain([0, 15000])
    .range([0, 100]);

const PROJECTIONS = {
    ER: d3.geoEquirectangular().center([0,0]).scale(128).translate([ctx.w/2,ctx.h/2]),
};

var path4proj = d3.geoPath()
                  .projection(PROJECTIONS.ER);

var drawMap = function(countries, lakes, rivers, svgEl){
    ctx.mapG = svgEl.append("g")
                    .attr("id", "map");
    // bind and draw geographical features to <path> elements
    var path4proj = d3.geoPath()
                 .projection(PROJECTIONS.ER);
    var countryG = ctx.mapG.append("g").attr("id", "countries");
    countryG.selectAll("path.countries")
            .data(countries.features)
            .enter()
            .append("path")
            .attr("d", path4proj)
            .attr("class", "country");
    var lakeG = ctx.mapG.append("g").attr("id", "lakes");
    lakeG.selectAll("path.lakes")
         .data(lakes.features)
         .enter()
         .append("path")
         .attr("d", path4proj)
         .attr("class", "lake");
    var riverG = ctx.mapG.append("g").attr("id", "rivers");
    riverG.selectAll("path.rivers")
         .data(rivers.features)
         .enter()
         .append("path")
         .attr("d", path4proj)
         .attr("class", "river");
    ctx.mapG.append("g")
            .attr("id", "planes");
    // pan & zoom
    function zoomed() {
      ctx.mapG.attr("transform", d3.event.transform);
      var scale = ctx.mapG.attr("transform");
      scale = scale.substring(scale.indexOf('scale(')+6);
      scale = parseFloat(scale.substring(0, scale.indexOf(')')));
      ctx.scale = 1 / scale;
      if (ctx.scale != 1){
          d3.selectAll("image")
            .attr("transform", (d) => (getPlaneTransform(d)));
      }
    }
    var zoom = d3.zoom()
        .scaleExtent([1, 40])
        .on("zoom", zoomed);
    svgEl.call(zoom);
};

var getPlaneTransform = function(d){
    var xy = PROJECTIONS.ER([d.lon, d.lat]);
    var sc = 4*ctx.scale;
    var x = xy[0] - sc;
    var y = xy[1] - sc;
    if (d.bearing != null && d.bearing != 0){
        var t = "translate("+x+","+y+") rotate("+d.bearing+" "+sc+" "+sc+")";
        return (ctx.scale == 1) ? t : t + " scale("+ctx.scale+")";
    }
    else {
        var t = "translate("+x+","+y+")";
        return (ctx.scale == 1) ? t : t + " scale("+ctx.scale+")";
    }
};

var createViz = function(){
    d3.select("body")
      .on("keydown", function(d){handleKeyEvent(d3.event);});
    var svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", ctx.w);
    svgEl.attr("height", ctx.h);
    svgEl.append("rect")
         .attr("x", 0)
         .attr("y", 0)
         .attr("width", "100%")
         .attr("height", "100%")
         .attr("fill", "#bcd1f1");
    loadGeo(svgEl);
};

/* data fetching and transforming */
var loadGeo = function(svgEl){
    var promises = [d3.json("ne_50m_admin_0_countries.geojson"),
                    d3.json("ne_50m_lakes.geojson"),
                    d3.json("ne_50m_rivers_lake_centerlines.geojson")];
    Promise.all(promises).then(function(data){
        drawMap(data[0], data[1], data[2], svgEl);
    }).catch(function(error){console.log(error)});
};

var toggleUpdate = function(){
    // feel free to rewrite the 'if' test
    // this is just dummy code to make the interface
    // behave properly
    if (d3.select("#updateBt").attr("value") == "On"){
        d3.select("#updateBt").attr("value", "Off");
        // we switch repeating updates on
        repeatingUpdate();
    }
    else {
        d3.select("#updateBt").attr("value", "On");
    }
};

/* Input events */
var handleKeyEvent = function(e){
    if (e.keyCode === 85){
        // hitting u on the keyboard triggers flight data fetching and display
        updateData();
    }
};

// Downloading the data
var getData = function(callback) {
    // var url = "https://opensky-network.org/api/states/all?lamin="+ctx.LA_MIN+"&lomin="+ctx.LO_MIN+"&lamax="+ctx.LA_MAX+"&lomax="+ctx.LO_MAX;  // for debug
    var url = " https://opensky-network.org/api/states/all";
    d3.json(url).then(function(data){
        ctx.currentFlights = [];  // wed remove old data
        // we now add the newly fetched planes
        data.states.forEach(function(elem){
            if (elem[5] && elem[6] && elem[13] < ctx.maxAlt) {
                // makes sure lon & lat not null
                // and alt not to big to avoid tight histogram
                ctx.currentFlights.push({
                    'id': elem[0],
                    'callsign': elem[1],
                    'lon': elem[5],
                    'lat': elem[6],
                    'onground': elem[8],
                    'bearing': elem[10],
                    'alt': elem[13]
                });
            }
        });
        if (callback) {
            callback();
        }
    }).catch(function(error){console.log(error)});
};

// Initialisation
getData(function() {
    drawPlanes();
    createPlots();
    repeatingUpdate();  // launch the automatic update
});


// Update data
var updateData = function() {
    // collects data
    getData(function() {
        // then update the planes
        drawPlanes();
        // and the charts
        updatePlots();
    });
};

var repeatingUpdate = function() {
    // We check if we still want to update
    if (d3.select("#updateBt").attr("value") == "Off"){  // still haven't click to turn it off
        console.log("Automatic update");
        // if we still want, we trigger an update
        updateData();
        // and trigger a later update recursively
        setTimeout(repeatingUpdate, ctx.updateRate);
    }
};

var drawPlanes = function() {
    // add new planes
    d3.select("g#planes")
        .selectAll("image")
        .data(ctx.currentFlights, function(d) { return d.id;})
        .enter()
        .append("image")
        .attr("transform", function(d) { return getPlaneTransform(d); })
        .attr("xlink:href", "plane_icon.png")
        .attr("width", "8px")
        .attr("height", "8px")
        .on("mouseover", function(d) {
            document.getElementById("info").innerText = "Plane callsign: " + d.callsign;
            bindPlotDisplay(d);
        });
    // remove the old planes
    d3.select("g#planes")
        .selectAll("image")
        .data(ctx.currentFlights, function(d) { return d.id;})
        .exit()
        .remove();
    // update the existing planes (just set the display)
    d3.select("g#planes")
        .selectAll("image")
        .data(ctx.currentFlights, function(d) {return d.id;})
        .transition()
        .duration(500)
        .attr("transform", function(d) { return getPlaneTransform(d); });
};

var createPlots = function(){
    var vlSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v3.json",
        "data": {
            "name": 'planes',
            "values": ctx.currentFlights
        },
        "mark": "bar",
        "encoding": {
            "x": {"aggregate": "count", "field": "onground", "type": "quantitative"},
            "color": {"field": "onground", "type": "nominal"}
        }
    };
    var vlOpts = {width:200, height:50, actions:false};
    vegaEmbed("#inTheAir", vlSpec, vlOpts).then(function(res) {
        res.view.addEventListener('click', function(event, item) {
            console.log('CLICK1', event, item);
        });
        ctx.plot1 = res;
    });
    vlSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v3.json",
        // DATA IS SHARED
        "data": {
            "name": 'planes',
            "values": ctx.currentFlights
        },
        "signals": [{
            "name": "lowAlt",
            "value": 0
        }, {
            "name": "highAlt",
            "value": 1000
        }],
        "layer": [{
            "mark": "bar"
        }, {
            "mark": {
                "type": "text",
                "dy": -4
            },
            // HERE WE ADD ONE MORE ENCODING TO DISPLAY THE TEXT
            "encoding": {
                "text": {
                    "aggregate": "count",
                    "type": "quantitative"
                }
            }
        }, {
            "transform": [{
                //"filter": "datum.alt < ctx.highAlt"
                "filter": {
                    "field": "alt",
                    "range": [ctx.lowAltBound, ctx.highAltBound]
                }
                /*
                "filter": [{
                    "field": "alt",
                    "gt": {
                        "signal": "lowAlt"
                    }
                    //"range": [ctx.lowAltBound, ctx.highAltBound]
                    //"range": [1000, 1000 + 1000]
                }, {
                    "field": "alt",
                    "lt": {
                        "signal": "highAlt"
                    }
                }]*/
            }],
            "mark": "bar",
            "encoding": {
                "color": {
                    "value": "red"
                }
            }
        }],
        // THIS ENCODING IS SHARED BY ALL !!
        "encoding": {
            "x": {
                "bin": {
                    "step": ctx.binSize
                },
                "field": "alt",
                "type": "quantitative",
                axis: {
                    "title": "Altitude (in meters)"
                }
            },
            "y": {
                "aggregate": "count",
                "type": "quantitative"
            }
        }

    };
    vlOpts = {width:200, height:200, actions:false};
    vegaEmbed("#alt", vlSpec, vlOpts).then(function(res) {
        res.view.addEventListener('click', function(event, item) {
            const lowAlt = item.datum["bin_step_"+ctx.binSize+"_alt"];
            ctx.lowAltBound = lowAlt;
            ctx.highAltBound = lowAlt + ctx.binSize;
            // we update the other chart
            const changes = vega.changeset()
                .insert(ctx.currentFlights)
                .remove(function(d) {
                    return d.alt > lowAlt + ctx.binSize || d.alt < lowAlt;
                });
            ctx.plot1.view.change('planes', changes).run();

            // we update the map
            drawPlanes();
            // we remove the bad ones
            d3.select("g#planes")
                .selectAll("image")
                .data(ctx.currentFlights, function(d) { return d.id;})
                .filter((d) => d.alt < ctx.lowAltBound || d.alt > ctx.highAltBound)
                .remove();
            // we update the plots
            bindPlotDisplay({ "alt": lowAlt});  // to put the right bar in red
        });
        ctx.plot2 = res;
    });
};

var updatePlots = function() {
    const changes = vega.changeset().insert(ctx.currentFlights).remove(() => true);
    ctx.plot1.view.change('planes', changes).run();
    ctx.plot2.view.change('planes', changes).run();
};

// Function to update the display of a plot based on the plain data provided
var bindPlotDisplay = function(d) {
    // updates the altitude bounds
    ctx.lowAltBound = parseInt(d.alt / 1000) * 1000;
    ctx.highAltBound = ctx.lowAltBound + ctx.binSize;
    createPlots();
};