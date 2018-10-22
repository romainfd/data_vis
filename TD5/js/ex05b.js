var ctx = {
    w: 1200,
    h: 1200,
    darken: 20,
    paddingOuter: 6,
    paddingInner: 3,
};

var createRadialTree = function(data, svg){
    // we add the parent IDs
    data.forEach(function(d) {
        // for the parent we remove the last 2 digits
        d['parentCode'] = d.Code.substring(0, d.Code.length - 2);
    });
    // we add a dummy root
    data.push({ 'Code': "GF", 'parentCode': null, "Description": "", "Level": 0});

    // we add the group
    svg = svg.append("g").attr("transform", "translate(" + (ctx.w / 2) + "," + (ctx.h / 2) + ")");

    // we stratify
    var strat = d3.stratify()
        .id(function(d){return d.Code;})
        .parentId(function(d){return d.parentCode; });

    // we create the tree
    var tree = d3.tree()
        .size([2 * Math.PI, 500])
        .separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });

    // we create the tree_root with our tree and stratified data
    var root = tree(strat(data));

    // the color scaler : we wrap the color scale and the fader
    var fader = function(c){ return d3.interpolateRgb(c, "#fff")(0.4); },
        color = d3.scaleOrdinal(d3.schemeDark2.map(fader)),
        tiny = function(c) { return tinycolor(color(c)).darken(ctx.darken).toHexString(); };

    var link = svg.selectAll(".link")
        .data(root.links())
        .enter().append("path")
        .attr("class", "link")
        .attr("d", d3.linkRadial()
            .angle(function(d) { return d.x; })
            .radius(function(d) { return d.y; }))
        // we color the link with stroke
        .style("stroke", function(d) {
            return tiny(d.target.data.Code.substring(0, 4));
        });

    var node = svg.selectAll(".node")
        .data(root.descendants())
        .enter().append("g")
        .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
        .attr("transform", function(d) { return "translate(" + radialPoint(d.x, d.y) + ")"; })
        .style("fill", function(d) {
            return tiny(d.data.Code.substring(0, 4));
        });
    // show tooltips for all nodes using title
    node.append("title")
        .text(function(d) {
            return d.data.Description;
        });

    node.append("circle")
        .attr("r", 2.5)
        .style("fill", function(d) {
            return d.data.Level == 0 ? "black" : tiny(d.data.Code.substring(0, 4));
        })
        .style("stroke", function(d) {
            return d.data.Level == 0 ? "black" : tiny(d.data.Code.substring(0, 4));
        });


    node.append("text")
        .attr("dy", "0.31em")
        .attr("x", function(d) { return d.x < Math.PI === !d.children ? 6 : -6; })
        .attr("text-anchor", function(d) { return d.x < Math.PI === !d.children ? "start" : "end"; })
        .attr("transform", function(d) { return "rotate(" + (d.x < Math.PI ? d.x - Math.PI / 2 : d.x + Math.PI / 2) * 180 / Math.PI + ")"; })
        // we display the title
        .text(function(d) {
            var desc = d.data.Description;
            if (desc.length > 20) {
                return desc.substring(0, 18)+"...";
            } else {
                return desc;
            }
        });
};

function radialPoint(x, y) {
    return [(y = +y) * Math.cos(x -= Math.PI / 2), y * Math.sin(x)];
}

var createViz = function(){
    var svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", ctx.w);
    svgEl.attr("height", ctx.h);
    loadData(svgEl);
};

var loadData = function(svgEl){
    // load cofog.csv
    d3.csv("cofog.csv").then(function(data){
        // and call createRadialTree(...) passing this data and svgEL
        createRadialTree(data, svgEl);
    }).catch(function(error){console.log(error)});
};
