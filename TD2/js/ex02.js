var ctx = {
    SVG_NS: "http://www.w3.org/2000/svg",
    w: 720,
    h: 720,
    DM: {RV:"Radial Velocity", PT: "Primary Transit", ML: "Microlensing"},
    POINT_SIZE: 50,
};

var initGenerators = function(size) {
    ctx.crossGenerator = d3.symbol().type(d3.symbolCross).size(size);
    ctx.triangleGenerator = d3.symbol().type(d3.symbolTriangle).size(size);
    ctx.circleGenerator = d3.symbol().type(d3.symbolCircle).size(size);
};

var initSVGcanvas = function(planetData){
    // scales to compute (x,y) coordinates from data values to SVG canvas
    var maxMass = d3.max(planetData,
        function(d){
            if (d.mass > 0){return parseFloat(d.mass);}
            else {return 0;}
        });
    var maxStarMass = d3.max(planetData,
        function(d){
            if (d.star_mass > 0){return parseFloat(d.star_mass);}
            else {return 0;}
        });
    var maxDate = d3.max(planetData,
        function(d){
            return parseFloat(d.discovered);
        });
    var minDate = d3.min(planetData,
        function(d){
            if (d.discovered > 0){return parseFloat(d.discovered);}
            else {return maxDate;}
        });
    ctx.xScale = d3.scaleLinear().domain([0, maxStarMass])
        .range([60, ctx.w-20]);
    ctx.yScale = d3.scaleLinear().domain([0, maxMass])
        .range([ctx.h-60, 20]);
    ctx.colorScale = d3.scaleLinear()
        .domain ([minDate, maxDate])
        .range (['#89CFEF', "#000080"]);
    // 1 Msun & 1 MJup indicators
    d3.select("#bkgG")
        .append("line")
        .attr("x1", 0)
        .attr("y1", ctx.yScale(1))
        .attr("x2", ctx.w)
        .attr("y2", ctx.yScale(1))
        .style("stroke", "#DDD");
    // ... cont'd
    d3.select("#bkgG")
        .append("line")
        .attr("x1", ctx.xScale(1))
        .attr("y1", 0)
        .attr("x2", ctx.xScale(1))
        .attr("y2", ctx.h)
        .style("stroke", "#DDD");
    // x- and y- axes
    d3.select("#bkgG").append("g")
        .attr("transform", "translate(0,"+ (ctx.h - 50) +")")
        .call(d3.axisBottom(ctx.xScale).ticks(10))
        .selectAll("text")
        .attr("transform", "scale(1,1)")
        .style("text-anchor", "middle");
    d3.select("#bkgG").append("g")
        .attr("transform", "translate(50,0)")
        .call(d3.axisLeft(ctx.yScale).ticks(10))
        .selectAll("text")
        .style("text-anchor", "end");
    // x-axis label
    d3.select("#bkgG")
        .append("text")
        .attr("y", ctx.h - 12)
        .attr("x", ctx.w/2)
        .style("text-anchor", "middle")
        .style("font-family", "sans-serif")
        .style("font-size", "12")
        .text("Star Mass (Msun)");
    // y-axis label
    d3.select("#bkgG")
        .append("text")
        .attr("y", 0)
        .attr("x", 0)
        .attr("transform", "rotate(-90) translate(-"+ctx.h/2+",18)")
        .style("text-anchor", "middle")
        .style("font-family", "sans-serif")
        .style("font-size", "12")
        .text("Mass (Mjup)");
};

var populateSVGcanvas = function(planetData) {
    initGenerators(ctx.POINT_SIZE);
    d3.select("svg").selectAll("path")
        // we clean the data before displaying it
        .data(planetData.filter(function(d) { return d['detection_type'] != "" && d['mass'] > 0 && d['star_mass'] > 0 && d['discovered'] > 0; }))
        .enter()
        .append("path")
        // the shape depends on the detyection method used to discover the planet
        .attr("d", function(d) {
            switch (d['detection_type']) {
                case "Radial Velocity":
                    return ctx.circleGenerator();
                case "Imaging":
                    return ctx.crossGenerator();
                case "Astrometry":
                    return ctx.triangleGenerator();
            }
        })
        // the position depends on the (mass, star_mass)
        .attr("transform", function(d) { return "translate("+ctx.xScale(d['star_mass'])+","+ctx.yScale(d['mass'])+")"; })
        // the color depends on the date of discovery
        .style("stroke", function (d) {
                return ctx.colorScale(d['discovered'])
            })
};

var createViz = function(){
    var svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", ctx.w);
    svgEl.attr("height", ctx.h);
    var rootG = svgEl.append("g").attr("id", "rootG");
    rootG.append("g").attr("id", "bkgG");
    loadData();
};

var loadData = function(){
    d3.csv("exoplanet.eu_catalog.csv").then(function(planets){
        initSVGcanvas(planets);
        populateSVGcanvas(planets);
    }).catch(function(error){ console.log(error); });
};
