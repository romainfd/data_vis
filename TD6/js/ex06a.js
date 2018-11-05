var createPlot = function(){
    vlSpec = {
        "data": {
            "url": "house_prices.json",
        },
        "transform": [
            {"fold": [
                "AZ-Phoenix",
                    "CA-Los Angeles",
                    "CA-San Diego",
                    "CA-San Francisco",
                    "DC-Washington",
                    "FL-Miami",
                    "GA-Atlanta",
                    "IL-Chicago",
                    "MA-Boston",
                    "MI-Detroit",
                    "MN-Minneapolis",
                    "NC-Charlotte",
                    "NV-Las",
                    "Vegas",
                    "NY-New",
                    "York",
                    "National-US",
                    "OH-Cleveland",
                    "OR-Portland",
                    "TX-Dallas",
                    "WA-Seattle"
                ], "as": ["city", "cs_index"]}],
        "mark": "line",  // do not forget
        "encoding": {
            'x': {
                'field': 'Date',
                'type': 'temporal',
                "timeUnit": 'yearmonth',
            },
            "y": {
                "field": "cs_index",
                "type": "quantitative",
                "axis": {"title": "CS_index"},
            },
            'color': {
                'field': 'city',
                'type': 'nominal',
            }
        },
    };
    vlOpts = {width:1000, height:400, actions:false};
    vegaEmbed("#ts", vlSpec, vlOpts);
};
