var ctx = {
    current_projection: "ER",  // ER or IM
    dataInput: "110", // 110 or 50 (more precise)
    w: 960,
    h: 484,
    undefinedColor: "#AAA",
    YEAR: "2015",
    panZoomMode: true,
    TRANSITION_DURATION: 2000,
    rivers: [],
    lakes: [],
    countries: [],
};

ctx.color = d3.scaleLinear()
    .domain([0, 100])
    .range(["#ff4400", "white"]);

const PROJECTIONS = {
    ER: d3.geoEquirectangular().scale(ctx.h / Math.PI),
    IM: d3.geoInterrupt(d3.geoMollweideRaw,
         [[ // northern hemisphere
           [[-180,   0], [-100,  90], [ -40,   0]],
           [[ -40,   0], [  30,  90], [ 180,   0]]
         ], [ // southern hemisphere
           [[-180,   0], [-160, -90], [-100,   0]],
           [[-100,   0], [ -60, -90], [ -20,   0]],
           [[ -20,   0], [  20, -90], [  80,   0]],
           [[  80,   0], [ 140, -90], [ 180,   0]]
         ]])
         .scale(165)
         .translate([ctx.w / 2, ctx.h / 2])
         .precision(.1),
};

function getCurrentProjection() {
    return PROJECTIONS[ctx.current_projection];
}

var makeMap = function(svgEl){
    ctx.mapG = svgEl.append("g")
                    .attr("id", "map");
    // bind and draw geographical features to <path> elements
    // draw countries
    addCountries();
    // draw all water bodies
    fadeWaterIn();
    // panning and zooming
    svgEl.append("rect")
         .attr("width", ctx.w)
         .attr("height", ctx.h)
         .style("fill", "none")
         .style("pointer-events", "all")
         .call(d3.zoom()
                 .scaleExtent([1, 8])
                 .on("zoom", zoomed)
         );
    function zoomed() {
        if (ctx.panZoomMode){
            ctx.mapG.attr("transform", d3.event.transform);
        }
    }
};

var addCountries = function(){
    var geoPathGen = d3.geoPath()
        .projection(getCurrentProjection());  // getCurrentProjection() to have consistent projection over everything

    // bind countries to path
    ctx.mapG
        .selectAll("path")
        .data(ctx.countries)
        .enter()
        .append("path")
        .attr("class", "country")  // add class country
        .attr("d", geoPathGen)   // knows how to draw based on the features data
        // set display
        .style("fill",  (d) => d['properties']['water_source'] == undefined ? "grey" : ctx.color(d['properties']['water_source']))
        .attr("stroke", "#DDD")
        .attr("clip-path", "url(#clip)");  // to clip display with projection
        //.attr("stroke-width", "1.5px");
};

var fadeWaterIn = function(){
    var path4proj = d3.geoPath()
        .projection(getCurrentProjection());  // getCurrentProjection() to have consistent projection over everything
    // clipping
    var defs = d3.select("svg").insert("defs", "#map");
    defs.append("path")
        .datum({type: "Sphere"})
        .attr("id", "sphere")
        .attr("d", path4proj);
    defs.append("path")
        .datum({type: "Sphere"})
        .attr("id", "clipSphere")
        .attr("d", path4proj);
    defs.append("clipPath")
        .attr("id", "clip")
        .append("use")
        .attr("xlink:href", "#clipSphere");
    d3.select("svg")
        .insert("use", "#map")
        .attr("class", "sphereBounds")
        .attr("xlink:href", "#sphere")
        .attr("opacity", 1);

    // ADD RIVERS
    ctx.mapG
        .append("g")
        .attr("id", "rivers")
        .style("opacity", 1)
        .selectAll("path")
        .data(ctx.rivers)
        .enter()
        .append("path")
        .attr("class", "river")  // add class river
        .attr("d", path4proj)   // knows how to draw based on the features data
        .attr("clip-path", "url(#clip)");  // to clip display with projection
    // NOT FILL => it fills river lines poorly

    // ADD LAKES
    ctx.mapG
        .append("g")
        .attr("id", "lakes")
        .style("opacity", 1)
        .selectAll("path")
        .data(ctx.lakes)
        .enter()
        .append("path")
        .attr("class", "lake")  // add class lake
        .attr("d", path4proj)   // knows how to draw based on the features data
        .attr("clip-path", "url(#clip)");  // to clip display with projection
};

var fadeWaterOutBeforeProjSwitch = function(sourceProj, targetProj){

    d3.select("g#rivers")
        .transition()
        .duration(2000)
        .style("opacity", 0)
        .remove();
    d3.select("g#lakes")
        .transition()
        .duration(2000)
        .style("opacity", 0)
        .remove();
    d3.selectAll("defs").remove();
    d3.selectAll("use").remove();
    animateProjection(sourceProj, targetProj);
};

var getGlobalView = function(){
    // ...
};

var getCurrentProjection = function(){
    return (ctx.panZoomMode) ? PROJECTIONS.ER : PROJECTIONS.IM;
};

var switchProjection = function(toER){
    // toER = true => enabling pan-zoom => moving to EquiRectangular proj
    // toER = false => disabling pan-zoom => moving to Interrupted Mollweide proj
    if (toER){
        fadeWaterOutBeforeProjSwitch(PROJECTIONS.IM, PROJECTIONS.ER);
    }
    else {
        // toIM
        fadeWaterOutBeforeProjSwitch(PROJECTIONS.ER, PROJECTIONS.IM);
    }
}

var animateProjection = function(sourceProj, targetProj){
    var transCount = 0;
    getGlobalView();
    d3.select("svg").selectAll("path").transition()
      .duration(ctx.TRANSITION_DURATION)
      .attrTween("d", projectionTween(sourceProj, targetProj))
      .on("start", function(){transCount++;})
      .on("end", function(d){
          if (--transCount === 0){fadeWaterIn();}
      });
};

var projectionTween = function(sourceProj, targetProj){
    return function(d) {
        var t = 0;
        var projection = d3.geoProjection(project)
                           .scale(1)
                           .translate([ctx.w / 2, ctx.h / 2]);
        var path = d3.geoPath()
                     .projection(projection);
        function project(λ, φ) {
            λ *= 180 / Math.PI;
            φ *= 180 / Math.PI;
            var p0 = sourceProj([λ, φ]);
            var p1 = targetProj([λ, φ]);
            return [(1 - t) * p0[0] + t * p1[0], (1 - t) * -p0[1] + t * -p1[1]];
        }
        return function(_) {
            t = _;
            return path(d);
        };
    };
}

var createViz = function(){
    d3.select("body")
      .on("keydown", function(d){handleKeyEvent(d3.event);});
    Object.keys(PROJECTIONS).forEach(function(k) {
        PROJECTIONS[k].rotate([0, 0]).center([0, 0]);
    });
    var svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", ctx.w);
    svgEl.attr("height", ctx.h);
    loadData(svgEl);
};

var loadData = function(svgEl){
    // ... load data, transform it, store it in ctx
    // ... then call makeMap(svgEl)
    var countries = d3.json("data/ne_" + ctx.dataInput + "m_admin_0_countries.geojson");
    var lakes = d3.json("data/ne_" + ctx.dataInput + "m_lakes.geojson");
    var rivers = d3.json("data/ne_" + ctx.dataInput + "m_rivers_lake_centerlines.geojson");
    var water = d3.csv("data/drinking_water.csv");
    // 1. We collect all the data
    Promise.all([countries, lakes, rivers, water]).then(function(dataIn) {
        // 2. We format the data
        ctx.countries = dataIn[0].features;
        ctx.lakes = dataIn[1].features;
        ctx.rivers = dataIn[2].features;

        // To match the countries with the water data, we first format the water data to have fast access
        var waterDict = {};
        dataIn[3].forEach(function(elem) {
            if (elem["Year"] == ctx.YEAR) { // this is the year we want
                waterDict[elem["Code"]] = elem["ImprovedWaterSourcePC"];
            }
        });

        // now we match with our countries => loop through and look for info in waterDict
        ctx.countries.forEach(function(country) {
           country["properties"]["water_source"] = waterDict[country["properties"]["iso_a3"]];  // could be undefined
        });

        // 3. We make the map
        makeMap(svgEl);
    }).catch(function(error){ console.log(error); });
};

var handleKeyEvent = function(e){
    if (e.keyCode === 32){
        // space bar
        togglePZMode();
    }
};

var togglePZMode = function(){
    ctx.panZoomMode = !ctx.panZoomMode;
    switchProjection(ctx.panZoomMode);
};
