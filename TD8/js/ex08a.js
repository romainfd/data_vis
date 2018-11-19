var createPlot = function(){
    vlSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v3.json",
        "background": "black",
        "config": {
            "view": {"stroke": "transparent"}
        },
        "layer": [
            // THE MAP
            {
                "data": {
                    "url": "data/us-10m.json",
                    "format": {
                        "type": "topojson",
                        "feature": "states"
                    }
                },
                "projection": {
                    "type": "albersUsa"
                },
                "mark": {
                    "type": "geoshape",
                    "stroke": "grey"
                }
            },
            {
                "data": {
                    "url": "data/airports.json"
                },
                "transform": [{
                    "lookup": "state",  // key in our data
                    "from": {
                        "data": {"url": "data/states_tz.csv"},  // JOIN WITH
                        "key": "State",  // ON the foreign key
                        "fields": ["TimeZone"]  // SELECT what
                    }
                }, {
                    "filter": "!test(regexp(/[0-9]/), datum.iata)"  // we remove the airport with with a number
                    // based on {"filter": {"field": "height", "lt": 180}}
                }],
                "projection": {
                    "type": "albersUsa"
                },
                "mark": "point",
                "encoding": {
                    "longitude": {
                        "field": "longitude",
                        "type": "quantitative"
                    },
                    "latitude": {
                        "field": "latitude",
                        "type": "quantitative"
                    },
                    "size": {"value": 10},
                    "color": {
                        "field": "TimeZone",
                        "type": "nominal",
                        "legend": false
                    }
                }
            }
        ]
    };
    vlOpts = {width:1000, height:600, actions:false};
    vegaEmbed("#map", vlSpec, vlOpts);
};
