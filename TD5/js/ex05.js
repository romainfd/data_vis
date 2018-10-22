var ctx = {
    w: 1280,
    h: 720,
    darken: 40,
    paddingOuter: 6,
    paddingInner: 3,
    desat: 0.5,   // to desaturate
};

var createTreemap = function(data, svg){
    // we add the parent IDs
    data.forEach(function(d) {
        // for the parent we remove the last 2 digits
        d['parentCode'] = d.Code.substring(0, d.Code.length - 2);
    });
    // we add a dummy root
    data.push({ 'Code': "GF", 'parentCode': null});

    var root = d3.stratify()
        .id(function(d){return d.Code;})
        .parentId(function(d){return d.parentCode; })
        (data);

    var treemap = d3.treemap()
                    .tile(d3.treemapBinary)
                    .size([ctx.w, ctx.h])
        .paddingInner(ctx.paddingInner)
        .paddingOuter(ctx.paddingOuter);

    function sumByCount(node_data){
        // doesn't work because we already are one level too low
        return node_data.children ? 0 : 1;
    };
    // New sizes
    function sumByAmount(node_data){
        return node_data.Value;
    };

    root.eachBefore(function(d){ d.data.id = d.data.Code; })
        .sum(sumByAmount);

    treemap(root);

    var nodes = svg.selectAll("g")
                   .data(root.descendants())
                   .enter().append("g")
                   .attr("transform", function(d){return "translate(" + d.x0 + "," + d.y0 + ")";});

    // each node is represented by a rectangle
    // color scale
    //var color = d3.scaleOrdinal(d3.schemeAccent);
    // desaturated color scale
    var fader = function(c){ return d3.interpolateRgb(c, "#fff")(ctx.desat); },
        color = d3.scaleOrdinal(d3.schemeCategory10.map(fader));
    // representation
    nodes.append("rect")
         .attr("id", function(d){ return d.data.Code; })
         .attr("width", function(d){ return d.x1 - d.x0; })
        .attr("height", function(d) { return d.y1 - d.y0; })
        .style("fill", function(d) {
            if (d.data.Code.length <= 4) {
                // 1st level nodes and root
                return color(d.data.Code);
            } else {
                return "white";
            }
        })
        .style("fill-opacity", function(d) {
            if (d.data.Code.length <= 4) {
                // 1st level nodes and root
                return 1;
            } else {
                return 0;
            }
        })
        .style("stroke", function(d) {
            var fill = color(d.data.Code.substring(0, 4));
            var colorStr = tinycolor(fill).darken(ctx.darken).toHexString();
            return colorStr;  // we take the color of the matching 1st level parent but darker
        });

    // we generate a clipping path for each of them,
    // that will be used to ensure that labels don't overflow
    nodes.append("clipPath")
         .attr("id", function(d){return "clip-" + d.data.id;})
         .append("use")
         .attr("xlink:href", function(d){return "#" + d.data.id;});

    // show tooltips for all nodes using title
    nodes.append("title").text(function(d) {
        return d.data.Description;
    });

    // show labels only for leaf nodes
    var leafLabels = svg.selectAll("g.lb")
                    .data(root.leaves())
                    .enter()
                    .append("g")
                    .classed("lb", true)
                    .attr("transform", function(d){return "translate(" + d.x0 + "," + d.y0 + ")";});
    leafLabels.append("text")
              .attr("clip-path", function(d){return "url(#clip-" + d.data.id + ")";})
              .style("fill", function(d) {
                  var fill = color(d.data.Code.substring(0, 4));
                  var colorStr = tinycolor(fill).darken(ctx.darken).toHexString();
                  return colorStr;  // we take the color of the matching 1st level parent but darker
              })
              .selectAll("tspan")
              .data(function(d){ return d.data.Description.split(" "); })
              .enter().append("tspan")
              .attr("x", 4)
              .attr("y", function(d, i){return 13 + i * 10;})
              .text(function(d){return d;});
};

var createViz = function(){
    var svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", ctx.w);
    svgEl.attr("height", ctx.h);
    loadData(svgEl);
};

var loadData = function(svgEl){
    // load cofog.csv
    d3.csv("cofog.csv").then(function(data){
        // and call createTreemap(...) passing this data and svgEL
        createTreemap(data, svgEl);
    }).catch(function(error){console.log(error)});
};
