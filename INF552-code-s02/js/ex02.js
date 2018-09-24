var ctx = {
    SVG_NS: "http://www.w3.org/2000/svg",
    w: 720,
    h: 720,
    DM: {RV:"Radial Velocity", PT: "Primary Transit", ML: "Microlensing"},
    POINT_SIZE: 10,
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
    ctx.xScale = d3.scaleLinear().domain([0, maxStarMass])
        .range([60, ctx.w-20]);
    ctx.yScale = d3.scaleLinear().domain([0, maxMass])
        .range([ctx.h-60, 20]);
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

var populateSVGcanvas = function(planetData){
    d3.select("svg").selectAll("circle")
        .data(planetData)
        .enter()
        .append("circle")
        .attr("class", "foo")
        .attr("cx", function(d) { return d['mass']; })
        .attr("cy", function(d) { return d['star_mass']; })
        .attr("r", ctx.POINT_SIZE)
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
    }).catch(function(error){console.log(error)});
};
