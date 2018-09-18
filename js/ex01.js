var ctx = {
    SVG_NS: "http://www.w3.org/2000/svg",
    DEFAULT_POINT_COUNT: 20,
    GLYPH_SIZE: 8,
    w: 700,
    h: 480,
};

var createViz = function(){
    /* Method called automatically when the HTML page has finished loading. */
    var mainDiv = document.getElementById("main");
    var svgElem = document.createElementNS(ctx.SVG_NS, "svg");
    svgElem.setAttribute("width", ctx.w);
    svgElem.setAttribute("height", ctx.h);
    mainDiv.appendChild(svgElem);

    // Add the version div
    var versionElem = document.createElement("div");
    versionElem.appendChild(document.createTextNode("Generated with D3 v"+d3.version));
    versionElem.classList.add("footer");
    mainDiv.appendChild(versionElem);
};

var handleKeyEvent = function(e){
    /* Callback triggered when any key is pressed in the input text field.
       e contains data about the event.
       visit http://keycode.info/ to find out how to test for the right key value */
    if (e.key == "Enter") {
        e.preventDefault();
        set();
    }
};

var set = function(){
    /* Callback triggered when the "Set" button is clicked. */
    // on efface un eventuel ancien groupe
    var oldGroup = document.querySelector('svg g');
    if (oldGroup != null) {
        oldGroup.remove();
    }
    // On cree le nouveau groupe
    var groupElem = document.createElementNS(ctx.SVG_NS, "g");
    // on recupere les parametres desires
    var nb = document.getElementById("countTf").value;
    var search = document.getElementById("searchType").value;
    // on le populate
    switch (search) {
        case "color":
            addForms('circle', 'blue', nb - 1, groupElem);
            addForms('circle', 'red', 1, groupElem);
            break;
        case "shape":
            addForms('rect', 'red', nb - 1, groupElem);
            addForms('circle', 'red', 1, groupElem);
            break;
        case "colorANDshape":
            var complement = nb % 2 == 1 ? 0 : -1;
            var half = parseInt(nb/2);
            addForms('rect', 'red', half + complement, groupElem);
            addForms('circle', 'blue', half, groupElem);
            addForms('circle', 'red', 1, groupElem);
            break;
    }
    // on l'ajoute
    document.querySelector("svg").appendChild(groupElem);
};

var addForms = function(shape, color, nb, parentGroup) {
    for (var i = 0; i < nb; i++) {
        var form = document.createElementNS(ctx.SVG_NS, shape);
        // parametres generaux
        form.setAttribute('fill', color);
        // on parametrise nos formes specifiquement
        switch (shape) {
            case "circle":
                form.setAttribute('cx', ctx.GLYPH_SIZE + Math.random()*(ctx.w-2*ctx.GLYPH_SIZE));
                form.setAttribute('cy', ctx.GLYPH_SIZE + Math.random()*(ctx.h-2*ctx.GLYPH_SIZE));
                form.setAttribute('r', ctx.GLYPH_SIZE);
                break;
            case "rect":
                form.setAttribute('x', Math.random()*(ctx.w-2*ctx.GLYPH_SIZE));
                form.setAttribute('y', Math.random()*(ctx.h-2*ctx.GLYPH_SIZE));
                form.setAttribute('width', 2*ctx.GLYPH_SIZE);
                form.setAttribute('height', 2*ctx.GLYPH_SIZE);
                break;
        }
        parentGroup.appendChild(form);
    }
};