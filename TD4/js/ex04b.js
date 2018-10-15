var ctx = {
    diameter: 800,
    MIN_COUNT: 2000,
};

var color = d3.scaleOrdinal(d3.schemeDark2);

var restructureData = function(airports, flights, states_tz){
    var data = {   // to use the same code as ex04.js
        "airports": airports,
        "flights": flights,
        "states_tz": states_tz
    };
    var graph = {nodes:[], links:[]};
    var minCount = 3000;


    // SAME AS step 1 of ex04.js
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

    // we built a hashset to store the states used
    var states_concerned = {};
    // INSTEAD of using directly the dictionnary below to create our state parents node that contained states not visited by our links (ie no children)

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
        // the IATA code should not start with a number AND he is connected by a selected link AND not in Puerto Rico
        if (airport["iata"] != undefined && isNaN(airport["iata"][0]) && (connectedAirports[airport["iata"]] === true)) {
            graph['nodes'].push({
                "id": airport["iata"],
                "parent": airport["state"],
                "tz": states_tz_dic[airport["state"]],
                "state": airport["state"],
                "city": airport["city"]
            });
            states_concerned[airport["state"]] = true;
        }
    });


    // we add the states as nodes (they'll be parents to our flights)
    Object.keys(states_concerned).forEach(function(state) {
        graph['nodes'].push({
            id: state,
            parent: "USA",
            city: ""
        });
    });
    // we add a dummy root
    graph['nodes'].push({
        id: "USA",
        parent: "",
        city: ""
    });

    return graph;
};

var createEdgeBundling = function(data, svg){
    var radius = ctx.diameter / 2,
        innerRadius = radius - 120;

    var cluster = d3.cluster()
                    .size([360, innerRadius]);

    var line = d3.radialLine()
                 .curve(d3.curveBundle.beta(.75))
                 .radius(function(d) { return d.y; })
                 .angle(function(d) { return d.x / 180 * Math.PI; });

    var mainG = svg.attr("width", ctx.diameter)
                   .attr("height", ctx.diameter)
                   .append("g")
                   .attr("transform", "translate(" + radius + "," + radius + ")");

    var allLinks = mainG.append("g").selectAll(".link"),
        allNodes = mainG.append("g").selectAll(".node");

    // build the d3-hierarchy
    var root = d3.stratify()
                 .id(function(d){return d.id;})
                 .parentId(function(d){return d.parent;})
                 (data.nodes);
    // cluster it
    cluster(root);
    // get the leaves (airport nodes only)
    var airports = root.leaves();
    // map from IATA code to airport object in the hierarchy
    // for easier retrieval when processing flights
    iata2node = {};
    for (var i=0;i<airports.length;i++){
        iata2node[airports[i].id] = airports[i];
    }
    // add links between airports for each flight
    visualizedFlights = [];
    for (var i=0;i<data.links.length;i++){
        var flight = data.links[i];
        visualizedFlights.push(iata2node[flight.source].path(iata2node[flight.target]));
    }
    // map flights to SVG path elements
    allLinks = allLinks
      .data(visualizedFlights)
      .enter().append("path")
        .each(function(d){d.source = d[0], d.target = d[d.length - 1]; })
        .attr("class", "link")
        .attr("d", line);
    // map airports to text elements on the periphery
    allNodes = allNodes
      .data(root.leaves())
      .enter().append("text")
        .attr("class", "node")
        .attr("dy", "0.31em")
        .attr("transform",
              function(d){
                return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)");
              })
        .attr("text-anchor", function(d) {return d.x < 180 ? "start" : "end";})
        .text(function(d) {return d.data.city + ", " + d.data.state + " (" + d.data.id +")";})
        .style("fill", function(d) { return color(d.data.tz); })
        .on("mouseover", mouseovered)
        .on("mouseout", mouseouted);

    // highlight selected elements on mouseover by changing their CSS classes
    function mouseovered(d) {
        allNodes.each(function(n) { n.target = n.source = false; });
        allLinks.classed("link--target", function(l) { if (l.target === d) return l.source.source = true; })
                .classed("link--source", function(l) { if (l.source === d) return l.target.target = true; })
                .filter(function(l) { return l.target === d || l.source === d; })
                .raise();
        allNodes.classed("node--target", function(n) { return n.target; })
                .classed("node--source", function(n) { return n.source; });
    }

    function mouseouted(d) {
        allLinks.classed("link--target", false)
                .classed("link--source", false);
        allNodes.classed("node--target", false)
                .classed("node--source", false);
    }
};

var createViz = function(){
    var svgEl = d3.select("#main").append("svg");
    loadData(svgEl);
};

var loadData = function(svgEl){
    var airports = d3.json("airports.json");
    var flights = d3.json("flights.json");
    var states = d3.csv("states_tz.csv");
    Promise.all([airports, flights, states]).then(function(dataIn) {
        var resData = restructureData(dataIn[0], dataIn[1], dataIn[2]);
        console.log(resData);
        createEdgeBundling(resData, svgEl);
    }).catch(function(error){ console.log(error); });
};
