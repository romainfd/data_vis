var ctx = {
    'scaleType': 'linear',
    'sampleSize': '*',
};

var createScatterPlot = function(sampleVal, scaleType){
    // scatterplot: planet mass vs. star mass
    // vega specification
    var vlSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v3.json",
        "data": { 'url' : 'exoplanet.eu_catalog.csv'},
        "transform": [{
            "filter": {
                "field": "detection_type",
                "oneOf": ["Radial Velocity", "Primary Transit", "Microlensing"]
            },
        }, {
            "filter": {
                "field": "mass",
                "gt": 0
            },
        }, {
            "filter": {
                "field": "star_mass",
                "gt": 0
            },
        }],
        "mark": "point",
        "encoding": {
            'x': {
                'field': 'star_mass',
                'type': 'quantitative',
                "axis": {"title": "Mass Star (Msun)"},
                'scale': {'type': scaleType}
            },
            'y': {
                'field': 'mass',
                'type': 'quantitative',
                "axis": {"title": "Mass (Mjup)"},
                'scale': {'type': scaleType}
            },
            'color': { 'field': 'discovered', 'type': 'temporal', 'timeUnit': 'year', "legend": { 'title': 'Year discovered'}},
            'shape': { 'field': 'detection_type', 'type': 'nominal', "legend": { 'title': 'Detection Method'}},
            'tooltip': [
                {'field': '# name', 'type': 'nominal'},
                {'field': 'discovered', 'type': 'temporal', 'timeUnit': 'year'},
            ],
        }
    };
    // we change the sampling if required
    // string (including '*') or <= 0 => 1000
    if (!isNaN(parseInt(sampleVal)) && sampleVal > 0) {
        vlSpec['transform'].push({'sample': sampleVal});
    }

    // see options at https://github.com/vega/vega-embed/blob/master/README.md
    var vlOpts = {width:720, height:720, actions:false};
    // populate div #masses (of size 720x720) with this scatterplot
    vegaEmbed("#masses", vlSpec, vlOpts);
};

var createHistogram = function(){
    // histogram: planet mass (binned)
    // vega specification
    var vlSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v3.json",
        "data": { 'url' : 'exoplanet.eu_catalog.csv'},
        "transform": [{
            "filter": {
                "field": "detection_type",
                "oneOf": ["Radial Velocity", "Primary Transit", "Microlensing"]
            }
        }],
        "mark": "bar",  // do not forget
        "encoding": {
            'x': {
                "bin": {'step' : 5},  // true by default
                'field': 'mass',
                'type': 'quantitative',
                "axis": {"title": "Mass (Mjup)"}
            },
            "y": {
                "aggregate": "count",
                "type": "quantitative",
                "axis": {"title": "Count"},
                "scale": {"domain": [0,1400]},
            },
        },
    };
    // populate div #massHist (of size 300x300) with this histogram
    var vlOpts = {width:300, height:300, actions:false};
    vegaEmbed("#massHist", vlSpec, vlOpts);
};

var createLinePlot = function(){
    // line plot: planet discovery count vs. year
    // vega specification
    var vlSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v3.json",
        "data": { 'url' : 'exoplanet.eu_catalog.csv'},
        "transform": [{
            "filter": {
                "field": "detection_type",
                "oneOf": ["Radial Velocity", "Primary Transit", "Microlensing"]
            }
        }, {
            // we use Window Transform
            "sort": [{
                'field': 'discovered',
            }],
            'window': [{
                'op': 'count',
                'as': 'cumulative_count',
            }],
            'frame': [null, 0],
        }],
        // to superpose 2 displays : be careful about the order
        'layer': [{
            "mark": "area",  // do not forget
            "encoding": {
                'x': {
                    'field': 'discovered',
                    'type': 'temporal',
                    "timeUnit": 'year',
                },
                "y": {
                    'field': 'cumulative_count',
                    "type": "quantitative",
                },
                'fill': {
                    'value': '#DDD',
                },
            },
        }, {
            // for the cumulative area
            "mark": "line",  // do not forget
            "encoding": {
                'x': {
                    'field': 'discovered',
                    'type': 'temporal',
                    "timeUnit": 'year',
                },
                "y": {
                    "aggregate": "count",
                    "type": "quantitative",
                    "axis": {"title": "Count"},
                },
                'color': {
                    'field': 'detection_type',
                    'type': 'nominal',
                },
                // to have more than just the cumulated sum
                // useless once we display by colors
                "detail": {
                    "field": "detection_type",
                    "type": "nominal",
                }
            },
        }],
    };
    // populate div #discOverTime (of size 300x300) with this line plot
    var vlOpts = {width:300, height:300, actions:false};
    vegaEmbed("#discOverTime", vlSpec, vlOpts);
};

var createViz = function(){
    createScatterPlot('*', 'linear');
    createHistogram();
    createLinePlot();
};


var handleKeyEvent = function(e){
    if (e.keyCode === 13){
        // enter
        e.preventDefault();
        setSample();
    }
};

var updateScatterPlot = function(){
    createScatterPlot(ctx.sampleSize, ctx.scaleType);
};

var setScale = function(){
    var scaleSel = document.querySelector('#scaleSel').value;
    ctx.scaleType = scaleSel;
    updateScatterPlot();
};

var setSample = function(){
    var sampleVal = document.querySelector('#sampleTf').value;
    if (sampleVal.trim()===''){
        return;
    }
    ctx.sampleSize = sampleVal;
    updateScatterPlot();
};
