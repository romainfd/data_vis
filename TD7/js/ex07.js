var ctx = {
    w: 1200,
    h: 900,
    STAGE_DURATION: 1000,
    DOUBLE_CLICK_THRESHOLD: 300,
    totalStripHeight: 400,
    totalLinePlotHeight: 900,
    vmargin: 2,
    hmargin: 4,
    timeParser: d3.timeParse("%Y-%m-%d"),
    timeAxisHeight: 20,
    linePlot: false,
    valueExtentOverAllSeries: [0,0],
    linesNb: null,
};

var transformData = function(data){
    var res = {dates:[], series:[]};
    var values_per_city = {};
    for (k in data[0]){
        if (k != "Date"){
            values_per_city[k] = [];
        }
    }
    data.forEach(
        function(d){
            res.dates.push(d.Date);
            for (k in d){
                if (k != "Date"){
                    values_per_city[k].push(d[k]);
                }
            }
        }
    );
    // populate series with the 3 composite indices first
    for (k of ["National-US", "Composite-10", "Composite-20"]){
        res.series.push({"name": k, "values": values_per_city[k]});
        delete values_per_city[k];
    }
    // then with individual cities, sorted by DTW distance to National-US
    // https://github.com/GordonLesti/dynamic-time-warping
    var distFunc = function(a, b){
        return Math.abs(a-b);
    };
    var cities = [];
    for (k in values_per_city){
        // series[0] is National-US
        var dtwDist = (new DynamicTimeWarping(res.series[0].values,
                                              values_per_city[k],
                                              distFunc)).getDistance();
        cities.push({"name": k, "values": values_per_city[k], "dtw": dtwDist});
    }
    cities.sort((a,b) => d3.ascending(a.dtw, b.dtw));
    res.series.push.apply(res.series, cities);

    ctx.linesNb = res.series.length;

    console.log(res);
    return res;
};

var createMaps = function(data, svgEl){
    ctx.valueExtentOverAllSeries = [d3.min(data.series,
                                           (d) => (d3.min(d.values))),
                                    d3.max(data.series,
                                           (d) => (d3.max(d.values)))];
    ctx.color = d3.scaleLinear()
                  .domain([ctx.valueExtentOverAllSeries[0],
                           100,
                           ctx.valueExtentOverAllSeries[1]])
                  .range(["red", "white", "blue"]);
    ctx.BAND_H = (ctx.totalStripHeight-ctx.timeAxisHeight) / data.series.length;
    // for each band (city series)
    data.series.forEach(function(s,i){
        // create a <g> and put it in the right place
        // so that bands are juxtaposed vertically
        var mapG = svgEl.append("g")
                        .classed("plot", true)
                        .attr("transform",
                              "translate("+ctx.hmargin+","+(i*ctx.BAND_H)+")");
        // populate each band with vertical lines,
        // one for each value in the series (a line corresponds to a year)
        // the line being colored according to the value for that year
        mapG.selectAll("line")
            .data(s.values)
            .enter()
            .append("line")
            .attr("x1", (d,j) => (j))
            .attr("y1", ctx.vmargin)
            .attr("x2", (d,j) => (j))
            .attr("y2", ctx.BAND_H-ctx.vmargin)
            .attr("stroke", (d) => ((d == null) ? "#AAA" : ctx.color(d)));
        // add the series' name after the color map
        mapG.append("text")
            .attr("x", data.dates.length + 2*ctx.hmargin)
            .attr("y", ctx.BAND_H-ctx.vmargin-3)
            .text(s.name);
    });
    // time axis
    var timeScale = d3.scaleTime()
                      .domain(d3.extent(data.dates, (d) => ctx.timeParser(d)))
                      .rangeRound([0, data.dates.length-1]);
    svgEl.append("g")
         .attr("id", "timeAxis")
         .attr("transform",
               "translate("+ctx.hmargin+","+(ctx.totalStripHeight-ctx.timeAxisHeight)+")")
         .call(d3.axisBottom(timeScale).ticks(d3.timeYear.every(5)));
    // legend
    var valueRange4legend = d3.range(ctx.valueExtentOverAllSeries[0],
                                     ctx.valueExtentOverAllSeries[1], 2).reverse();

    var scale4colorLegend = d3.scaleLinear()
                       .domain(ctx.valueExtentOverAllSeries)
                       .rangeRound([valueRange4legend.length,0]);

    var legendG = svgEl.append("g")
                        .attr("id", "colorLegend")
                        .attr("opacity", 1)
                        .attr("transform", "translate("+500+","+50+")");
    legendG.selectAll("line")
           .data(valueRange4legend)
           .enter()
           .append("line")
           .attr("x1", 0)
           .attr("y1", (d,j) => (j))
           .attr("x2", ctx.BAND_H)
           .attr("y2", (d,j) => (j))
           .attr("stroke", (d) => (ctx.color(d)));
    legendG.append("g")
           .attr("transform", "translate("+(ctx.BAND_H+4)+",0)")
           .call(d3.axisRight(scale4colorLegend).ticks(5));
    legendG.append("text")
           .attr("x", 0)
           .attr("y", valueRange4legend.length+12)
           .text("Case-Shiller Index");
};

var transitionToLinePlots = function(){
    // 1. Remove the legend
    var removeLegend = function(callback) {
        d3.select("#colorLegend")
            .transition()
            .duration(ctx.STAGE_DURATION)
            .attr("opacity", 0)
            .on("end", callback);
    };

    // 2. Translate all the lines to fill the entire space
    var translatePlots = function(callback) {
        var linesLeft = 0;
        d3.selectAll(".plot")
            .transition()
            .duration(ctx.STAGE_DURATION)
            .attr("transform", (d, i) => ("translate(0, " + (ctx.spacePerLine * i) + ")"))
            .on("start", () => (linesLeft++))
            // if last line => call callback
            .on("end", function() { return linesLeft == 1 ? callback() : linesLeft--; });
        d3.select("#timeAxis")
            .transition()
            .attr("transform",
                "translate(0,"+(ctx.h-ctx.timeAxisHeight)+")")
    };

    // 3. Make all strips 1px tall
    var onePixelTall = function(callback) {
        var pixelsLeft = 0;
        d3.selectAll(".plot")
            .selectAll("line")
            .transition()
            .duration(ctx.STAGE_DURATION)
            .attr("y1", ctx.vmargin)
            .attr("y2", 1 + ctx.vmargin)
            .on("start", () => (pixelsLeft++))
             // if last line => call callback
            .on("end", function() { return pixelsLeft == 1 ? callback() : pixelsLeft--; });
    };

    // 4. Draw the lines
    var plotLines = function(callback) {
        ctx.ordinate = d3.scaleLinear()
            .domain([ctx.valueExtentOverAllSeries[0], ctx.valueExtentOverAllSeries[1]])
            .range([0, ctx.spacePerLine - 1]);
        var pixelsLeft = 0;
        d3.selectAll(".plot")
            .selectAll("line")
            .transition()
            .duration(ctx.STAGE_DURATION)
            .delay((d, i) => (ctx.STAGE_DURATION / 100 * i))  // 10ms delay for each
            // .attr("x1", (d,j) => (j))  // USELESS
            .attr("y1", function(d) { return ctx.spacePerLine - ctx.ordinate(d);})
            // ATTENTION: y increases downwards !! => ctx.spacePerLine - ...
            // .attr("x2", (d,j) => (j + 1))
            .attr("y2", function(d) {return ctx.spacePerLine - (ctx.ordinate(d) + 1); })
            .on("start", () => (pixelsLeft++))
            // if last line => call callback
            .on("end", function() { return pixelsLeft == 1 ? callback() : pixelsLeft--; });
    };

    // 5. Change pixels color to gray
    var toGray = function(callback) {
        d3.selectAll(".plot")
            .selectAll("line")
            .transition()
            .duration(ctx.STAGE_DURATION)
            .attr("stroke", (d) => ((d == null) ? "white" : "darkgray"));
    };

    ctx.spacePerLine = (ctx.h - ctx.timeAxisHeight) / ctx.linesNb;
    removeLegend(function() {
        translatePlots(function() {
            onePixelTall(function() {
                plotLines(function() {
                    toGray(function() {
                        console.log("Over");
                    });
                });
            });
        });
    });
};

var transitionToColorStrips = function(){
    // 1. Move back the display of the lines to colormap
    var changeDisplay = function(callback) {
        var pixelsLeft = 0;
        d3.selectAll(".plot")
            .selectAll("line")
            // 1.a we change the color
            .transition()
            .duration(ctx.STAGE_DURATION)
            .delay((d, i) => (ctx.STAGE_DURATION / 100 * i))  // 10ms delay for each
            .attr("stroke", (d) => ((d == null) ? "#AAA" : ctx.color(d)))
            // 1.b we format the line, back to the colormap
            .transition()
            .delay(ctx.STAGE_DURATION)
            .duration(ctx.STAGE_DURATION)
            // for each pixel we wait for stage_dur / 2 after the color change to move
            // ATTENTION: Here we are for each pixel when we chain transition !!
            // there is already the different delay offset for each !!
            .attr("x1", (d,j) => (j))
            .attr("y1", ctx.vmargin)
            .attr("x2", (d,j) => (j))
            .attr("y2", ctx.BAND_H-ctx.vmargin)
            .on("start", () => ( pixelsLeft++ ))
            .on("end", () => (pixelsLeft == 1 ? callback() : pixelsLeft-- ));
    };

    //2. We move the lines back to the good position (as well as the xaxis
    var moveBack = function(callback) {
        d3.select("#timeAxis")
            .transition()
            .duration(ctx.STAGE_DURATION)
            .attr("transform",
                "translate(" + ctx.hmargin + "," + (ctx.totalStripHeight - ctx.timeAxisHeight) + ")");
        var linesLeft = 0;
        d3.selectAll(".plot")
            .transition()
            .duration(ctx.STAGE_DURATION)
            // move them back to the right place
            .attr("transform", (d, i) => ("translate(" + ctx.hmargin + "," + (i * ctx.BAND_H) + ")"))
            .on("start", () => ( linesLeft++ ))
            .on("end", () => (linesLeft == 1 ? callback() : linesLeft--));
    };

    // 3. Put back the legend
    var addLegendBack = function() {
        d3.select("#colorLegend")
            .transition()
            .duration(ctx.STAGE_DURATION)
            .attr("opacity", 1);
    };

    changeDisplay(function() {
        moveBack(function() {
            addLegendBack();
        })
    });
};

var toggleVis = function(){
    if (ctx.linePlot){
        transitionToColorStrips();
    }
    else {
        transitionToLinePlots();
    }
    ctx.linePlot = !ctx.linePlot;
};

var createViz = function(){
    var svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", ctx.w);
    svgEl.attr("height", ctx.h);
    d3.select("body").on("mousedown", function(){
        var ts = d3.event.timeStamp;
        if ((ts-ctx.lastMousePress) < ctx.DOUBLE_CLICK_THRESHOLD){toggleVis();}
        ctx.lastMousePress = ts;
    });
    loadData(svgEl);
};

var loadData = function(svgEl){
    d3.json("house_prices.json").then(function(data){
        createMaps(transformData(data), svgEl);
    }).catch(function(error){console.log(error)});
};
