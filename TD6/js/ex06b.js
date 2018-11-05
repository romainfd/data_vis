var ctx = {
    w: 1200,
    h: 400,
    h_line: 14,
    spacing: 2.5,
    nb_of_dates: 348,
    legend_offset: 175,
    timeParser: d3.timeParse("%Y-%m-%d"),
};

var createColormap = function(data, svg) {
    // 1. We restructure the data to the good format
    var restr = {
        "dates": [],
        "seriesTemp": {},  // this is used as an aggregator (to have easy access to each city list of values)
        "series": []
    };
    // 1.a we use the first Date record to get all the cities
    for (var key in data[0]) {
        if (key != "Date") {
            restr.seriesTemp[key] = [];
        }
    }

    // 1.b we loop through the records and store them
    data.forEach(function (record) {
        for (var key in record) {
            if (key == "Date") {
                restr.dates.push(record[key]);
            } else {
                // this is the cs_index of a city
                restr.seriesTemp[key].push(record[key]);
            }
        }
    });

    // 1.c we go to the good format
    // First the 3 aggregates without dtw:
    var head = [];
    ["National-US", "Composite-10", "Composite-20"].forEach(function (city) {
        head.push({
            'name': city,
            'values': restr.seriesTemp[city]
        });
        // we remove them in order not to loop on them just after
        delete restr.seriesTemp[city];
    });
    // Then we do the usual cities and compute the dtw in the mean time
    var distFunc = function (a, b) {
        return Math.abs(a - b);
    };
    var dtw;
    for (var city in restr.seriesTemp) {
        dtw = new DynamicTimeWarping(head[0].values, restr.seriesTemp[city], distFunc);
        restr.series.push({
            'name': city,
            'values': restr.seriesTemp[city],
            'dtw': dtw.getDistance()
        });
    }
    // we can drop our aggregator
    delete restr.seriesTemp;
    // and add the head before the sorted items
    restr.series.sort(function (a, b) {
        return a.dtw - b.dtw;
    });
    restr.series = head.concat(restr.series);

    console.log(restr);
    // 2. We set the display
    // 2.a We built the color scheme
    /* d3.min computes the min of an array => below useless:
    var maxIndex = d3.max(restr.series,
        function(d){
            var max = 100, index;
            for (var i in d.values) {
                index = d.values[i];
                if (index != null && index > max) {
                    max = index;
                }
            }
            return max;
        });
    var minIndex = d3.min(restr.series,
        function(d){
            var min = 100, index;
            for (var i in d.values) {
                index = d.values[i];
                if (index != null && index < min) {
                    min = index;
                }
            }
            return min;
        });
    */
    // d3.min computes the min WITHOUT the null !!
    // we get the list of max/min
    var mins = [], maxs = [];
    restr.series.forEach(function(d) {
        maxs.push(d3.max(d.values));
        mins.push(d3.min(d.values));
    });
    var maxIndex = d3.max(maxs),
        minIndex = d3.min(mins);
    var color = d3.scaleLinear()
        .domain([minIndex, 100, maxIndex])
        .range(["red", "white", "blue"]);

    // 2.b We display the rows
    var rows = svg.selectAll("g")
        .data(restr.series)
        .enter()
        .append("g")
        .attr("width", ctx.nb_of_dates)
        .attr("height", ctx.h_line)
        .attr("transform", function(d, i) { return "translate(0," + i * (ctx.h_line + ctx.spacing) + ")"; });

    // 2.c We fill them with small colored lines
    rows.selectAll("line")
        .data(function(d) { return d.values; })
        .enter()
        .append("line")
        .attr("x1", function(cs_index, i) { return i; })
        .attr("x2", function(cs_index, i) { return i + 1; })
        .attr("y1", 0)
        .attr("y2", ctx.h_line)
        .style("stroke", function(cs_index) {
            if (cs_index == null) {
                return "grey";
            } else {
                return color(cs_index);
            }
        });

    // 3. We add the legends
    // 3.a We add the name of the row
    rows.selectAll('text')
        .data(function(d) { return [d.name]; })  // without the [ ] it just iterates on the string
        .enter()
        .append('text')
        .attr("transform", "translate(352, " + (ctx.h_line - 4) + ")")
        .attr("width", "100px")
        .text(function(d) { return d; });

    // 3.b We add the time axis
    ctx.xScale = d3.scaleTime().domain([ctx.timeParser(restr.dates[0]), ctx.timeParser(restr.dates[restr.dates.length - 1])])
        .range([0, ctx.nb_of_dates]);
    svg.append("g")
        .attr("transform", "translate(0,"+ (ctx.h - 20) +")")
        .call(d3.axisBottom(ctx.xScale).ticks(d3.timeYear.every(5)));

    // 3.c We add the legend
    var legend = svg.append("g")
        .attr("transform", "translate("+ (ctx.nb_of_dates + ctx.legend_offset) +", 20)")
        .attr("height", maxIndex - minIndex + 1)
        .attr("width", "5");
    // we draw a vertical line here
    var legendLines = d3.range(minIndex, maxIndex, 2).reverse();
    legend.selectAll("line")
        .data(legendLines)
        .enter()
        .append("line")
        .attr("x1", "0")
        .attr("x2", "10")
        .attr("y1", function(d , i) { return i; })
        .attr("y2", function(d , i) { return i + 1; })
        .style("stroke", function(cs_index) {
            return color(cs_index);
        });
    // we add the ticks
    ctx.legendScale = d3.scaleLinear().domain([maxIndex, minIndex])
        .range([0, legendLines.length]);  // height in pixels
    legend.append("g")
        .attr("transform", "translate(12.5, 0)")
        .call(d3.axisRight(ctx.legendScale).ticks(5));
    // we add the title of the legend
    legend.append("text")
        .attr("transform", "translate(-25, "+ (legendLines.length + 13) +")")
        .text("Case-shriller index");
};

var createViz = function(){
    var svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", ctx.w);
    svgEl.attr("height", ctx.h);
    loadData(svgEl);
};

var loadData = function(svgEl){
    d3.json("house_prices.json").then(function(data){
        createColormap(data, svgEl);
    }).catch(function(error){console.log(error)});
};
