var ctx = {
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

var makeMap = function(svgEl){
    ctx.mapG = svgEl.append("g")
                    .attr("id", "map");
    // bind and draw geographical features to <path> elements
    addCountries();
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
    // ...
};

var fadeWaterIn = function(){
    var path4proj = null;  // ...
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
};

var fadeWaterOutBeforeProjSwitch = function(sourceProj, targetProj){
    d3.select("g#rivers").remove();
    d3.select("g#lakes").remove();
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
