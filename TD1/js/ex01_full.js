var ctx = {
    SVG_NS: "http://www.w3.org/2000/svg",
    DEFAULT_POINT_COUNT: 20,
    GLYPH_SIZE: 12,
    w: 480,
    h: 480,
};

var randomGenerator = function(pointCount){
    var res = [];
    for (var i=0;i<pointCount;i++){
        res.push([Math.floor(Math.random()*(ctx.w-ctx.GLYPH_SIZE)) + ctx.GLYPH_SIZE/2.0,
                  Math.floor(Math.random()*(ctx.h-ctx.GLYPH_SIZE))+ ctx.GLYPH_SIZE/2.0]);
    }
    // console.log(res);
    return res;
};

var generateCircle = function(pos, color){
    var circle = document.createElementNS(ctx.SVG_NS, "circle");
    circle.setAttribute("cx", pos[0]);
    circle.setAttribute("cy", pos[1]);
    circle.setAttribute("r", ctx.GLYPH_SIZE/2.0);
    circle.setAttribute("fill", color);
    return circle;
};

var generateRectangle = function(pos, color){
    var rect = document.createElementNS(ctx.SVG_NS, "rect");
    rect.setAttribute("x", pos[0]-ctx.GLYPH_SIZE/2);
    rect.setAttribute("y", pos[1]-ctx.GLYPH_SIZE/2);
    rect.setAttribute("width", ctx.GLYPH_SIZE);
    rect.setAttribute("height", ctx.GLYPH_SIZE);
    rect.setAttribute("fill", color);
    return rect;
};

var populateSVGcanvas = function(pointCount, searchType){
    // var svgEl = document.getElementsByTagName("svg")[0];
    var svgEl = document.querySelector("svg");
    while (svgEl.firstChild) {
        svgEl.removeChild(svgEl.firstChild);
    }
    var gEl = document.createElementNS(ctx.SVG_NS, "g");
    gEl.setAttribute("id", "glyphs");
    svgEl.appendChild(gEl);
    if (searchType == "color"){
        var randomPoints = randomGenerator(pointCount-1);
        for (var i=0;i<randomPoints.length;i++){
            gEl.appendChild(generateCircle(randomPoints[i], "blue"));
        }
        var randomPoints = randomGenerator(1);
        gEl.appendChild(generateCircle(randomPoints[0], "red"));
    }
    else if (searchType == "shape"){
        var randomPoints = randomGenerator(pointCount-1);
        for (var i=0;i<randomPoints.length;i++){
            gEl.appendChild(generateRectangle(randomPoints[i], "red"));
        }
        var randomPoints = randomGenerator(1);
        gEl.appendChild(generateCircle(randomPoints[0], "red"));
    }
    else { // colorANDshape
        var randomPoints = randomGenerator(pointCount/2);
        for (var i=0;i<randomPoints.length;i++){
            gEl.appendChild(generateRectangle(randomPoints[i], "red"));
        }
        randomPoints = randomGenerator(pointCount/2);
        for (var i=0;i<randomPoints.length;i++){
            gEl.appendChild(generateCircle(randomPoints[i], "blue"));
        }
        var randomPoints = randomGenerator(1);
        gEl.appendChild(generateCircle(randomPoints[0], "red"));
    }
};

var createViz = function(){
    /* Method called automatically when the HTML page has finished loading. */
    // document.getElementById("countTf").setAttribute("value", ctx.DEFAULT_POINT_COUNT);
    document.querySelector("#countTf").setAttribute("value", ctx.DEFAULT_POINT_COUNT);
    // var mainDiv = document.getElementById("main");
    var mainDiv = document.querySelector("#main");
    var svgEl = document.createElementNS(ctx.SVG_NS, "svg");
    svgEl.setAttribute("width", ctx.w);
    svgEl.setAttribute("height", ctx.h);
    mainDiv.appendChild(svgEl);
    var footerEl = document.createElement("div");
    footerEl.setAttribute("class", "footer");
    footerEl.appendChild(document.createTextNode("Generated with D3 v"+d3.version));
    mainDiv.appendChild(footerEl);
    set();
};

var handleKeyEvent = function(e) {
    /* Callback triggered when any key is pressed in the input text field.
       e contains data about the event.
       visit http://keycode.info/ to find out how to test for the right key value */
    if (e.keyCode === 13){
        // enter
        e.preventDefault();
        set();
    }
};

var set = function(){
    /* Callback triggered when the "Set" button is clicked. */
    // var count = document.getElementById('countTf').value;
    var count = document.querySelector('#countTf').value;
    if (count.trim()===''){
        return;
    }
    // var searchType = document.getElementById('searchType').value;
    var searchType = document.querySelector('#searchType').value;
    populateSVGcanvas(parseInt(count), searchType);
};
