var ctx = {
    w: 1280,
    h: 720,
};

// https://github.com/d3/d3-force
var simulation = d3.forceSimulation()
                   .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(5).strength(0.08))
                   .force("charge", d3.forceManyBody())
                   .force("center", d3.forceCenter(ctx.w / 2, ctx.h / 2));

// https://github.com/d3/d3-scale-chromatic
var color = d3.scaleOrdinal(d3.schemeAccent);

var createGraphLayout = function(data, svg){
    var minCount = 3000;

    // 1. Data formatting and filtering
    // We wrap it to have the good format for d3
    var graph = {
        'nodes': [],
        'links': [],
    };
    // the links based on flights
    data['flights'].forEach(function(flight) {
        // filter
        if (flight['count'] < minCount) {
            return;
        }
        // format
        graph['links'].push({
           "source": flight["origin"],
           "target": flight["destination"],
           "value": flight["count"]
        });
    });

    // we build a dictionary to find the time zone from the state easily
    var states_tz_dic = {};
    data['states_tz'].forEach(function(state_tz) {
        states_tz_dic[state_tz["State"]] = state_tz["TimeZone"];
    });

    // we built a hashset to check for connected airports
    var connectedAirports = {};
    graph['links'].forEach(function(link) {
        connectedAirports[link['source']] = true;
        connectedAirports[link['target']] = true;
    });

    // the nodes based on airports
    data['airports'].forEach(function(airport) {
        // the IATA code should not start with a number AND he is connected by a selected link
        if (isNaN(airport["iata"][0]) && (connectedAirports[airport["iata"]] === true)) {
            graph['nodes'].push({
                "id": airport["iata"],
                "group": states_tz_dic[airport["state"]],
                "state": airport["state"],
                "city": airport["city"]
            });
        }
    });

    // 2. We populate the canvas
    // scale creation
    var maxCount = d3.max(graph['links'],
        function(d){
            return parseFloat(d.value);
        });
    var width_scale = d3.scaleLinear()
        .domain([minCount, maxCount])
        .range([1, 10]);

    // the nodes
    var g_nodes = svg.append("g").attr('class', 'nodes')
        .selectAll("circle")
        .data(graph['nodes'])
        .enter()
        .append("circle")
        .attr("r", 5)
        .attr("title", function(d) { return d['city']+" ("+d['id']+")";})
        .style("fill", function(d) { return color(d['group']); })  // ATTENTION : fill for style color
    // Here we add an SVG title element the contents of which is effectively rendered in a tooltipg
    g_nodes.append("svg:title")
        .text(function(d) { console.log(d); return d["id"]; });


    // the links
    var g_links = svg.append("g").attr('class', 'links')
        .selectAll("line")
        .data(graph['links'].filter(function(line) {
            return line['value'] >= minCount;
        }))
        .enter()
        .append("line")
        .attr("opacity", 0.2)
        .style("stroke-width", function(d) { return width_scale(d['value']); });

    // to be able to drag
    g_nodes.call(d3.drag().on("start", startDragging)
                          .on("drag", dragging)
                          .on("end", endDragging));

    // 3. Launching the simulation
    // var graph holding the input data structure created earlier:
    simulation.nodes(graph.nodes)
        .on("tick", ticked);
    simulation.force("link")
        .links(graph.links);
    function ticked(){
        // code run at each iteration of the simulation
        g_links.attr("x1", function(d){return d.source.x;})
            .attr("y1", function(d){return d.source.y;})
            .attr("x2", function(d){return d.target.x;})
            .attr("y2", function(d){return d.target.y;});
        g_nodes.attr("cx", function(d){return d.x;})
            .attr("cy", function(d){return d.y;});
    }
};

var createViz = function(){
    var svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", ctx.w);
    svgEl.attr("height", ctx.h);
    loadData(svgEl);
};

var loadData = function(svgEl){
    var states = d3.csv("states_tz.csv");
    var airports = d3.json("airports.json");
    var flights = d3.json("flights.json");
    Promise.all([states, airports, flights]).then(function(dataIn) {
        var data = {
            'states_tz': dataIn[0],
            'airports': dataIn[1],
            'flights': dataIn[2],
        };
        createGraphLayout(data, svgEl);
    }).catch(function(error){ console.log(error); });
};

function startDragging(node){
    if (!d3.event.active){
        simulation.alphaTarget(0.3).restart();
    }
    node.fx = node.x;
    node.fy = node.y;
}

function dragging(node){
    node.fx = d3.event.x;
    node.fy = d3.event.y;
}

function endDragging(node){
    if (!d3.event.active){
        simulation.alphaTarget(0);
    }
    // commenting the following lines out will keep the
    // dragged node at its current location, permanently
    // unless moved again manually
    node.fx = null;
    node.fy = null;
}
