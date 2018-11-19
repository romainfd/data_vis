var createPlot = function(){
    vlSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v3.json",
        "background": "black",
        "config": {
            "view": {"stroke": "transparent"}
        },
    };
    vlOpts = {width:1000, height:600, actions:false};
    vegaEmbed("#map", vlSpec, vlOpts);
};
