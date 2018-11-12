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
    //...
};

var transitionToColorStrips = function(){
    //...
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
    })
    loadData(svgEl);
};

var loadData = function(svgEl){
    d3.json("house_prices.json").then(function(data){
        createMaps(transformData(data), svgEl);
    }).catch(function(error){console.log(error)});
};
