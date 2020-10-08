const displayPieChart = function( values, names, colors, legendTitle, radius = 140, innerRadius = 39, width = 640, height = 480, xc, yc, 
                                lineLength = 25, gap = 5, marginLeft = 23, marginBottom = 30) {

    xc = xc || width * 0.4,
    yc = yc || height * 0.4;

    let sum = values.reduce((acc, value) => acc + value, 0);

    if (sum === 0) {
        return;
    }

    const sortedValues = values.slice().sort(function(a, b) { return b - a; });

    const data = [];
    for (i = 0; i < names.length; i++) {
        data[i] = {};
        data[i].name = names[i];
        data[i].value = values[i];
        data[i].rate = Math.round(values[i] / sum * 100);
        data[i].index = sortedValues.indexOf(values[i]);
        data[i].radius = 1.0 - 0.1 * data[i].index;
    }

    var key = function(d){ return d.data.rate; };

    var arc = d3.arc()
        .outerRadius(function (d) { return radius * d.data.radius; })
        .innerRadius(innerRadius);

    var gapArc = d3.arc()
        .innerRadius(function (d) { return radius * d.data.radius + gap; })
        .outerRadius(function (d) { return radius * d.data.radius + gap; });

    var outerArc = d3.arc()
        .innerRadius(function (d) { return radius * d.data.radius + gap + lineLength; })
        .outerRadius(function (d) { return radius * d.data.radius + gap + lineLength; });

    var pie = d3.pie()
        .sortValues(function(a, b) { return b - a; })
        .value(function(d) { return d.rate; });

    var svg = d3.select("body")
        .append("svg")
        .attr("class", "axis")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + xc + "," + yc + ")");

    var slices = svg.append("g")
        .attr("class", "slices");
    var labels = svg.append("g")
        .attr("class", "labels");
    var lines = svg.append("g")
        .attr("class", "lines");

    var g = slices.selectAll(".arc")
        .data(pie(data))
        .enter()
        .append("g")
        .attr("class", "arc");

    g.append("path")
    .style("fill", function(d,i) { return colors[i]; })
    .transition()
    .delay(function(d) { return d.index * 500; })
    .duration(function(d) {
        if (d.data.rate != 0)
            return 500;
        else
            return 0;
    })
    .attrTween('d', function(d) {
        var i = d3.interpolate(d.startAngle + 0.1, d.endAngle);
        return function(t) {
            d.endAngle = i(t); 
            return arc(d)
        }
    }); 


    /* ------- TEXT LABELS -------*/
    function midAngle(d) {
        return d.startAngle + (d.endAngle - d.startAngle) / 2;
    }

    var text = svg.select(".labels")
        .selectAll("text")
        .data(pie(data), key)
        .enter()
        .append("text")
        .attr("dy", ".35em")
        .attr("x", function(d) {
            var posX = outerArc.centroid(d)[0];
            posX += 20 * (midAngle(d) < Math.PI ? 1 : -1);
            return posX;
        })
        .attr("y", function(d) {
            return outerArc.centroid(d)[1];
        })
        .text( function(d) {
            return d.data.rate + '%';
        })
        .style("text-anchor", function(d) {
            align = (midAngle(d) < Math.PI ? "start" : "end");
            return align;
        })
        .style("display", "none");

    text.transition()
        .delay(function(d) { return (d.index + 1) * 500; })
        .duration(500)
        .style("display", function(d) {
            if (d.data.rate != 0)
                return "block"
            else
                return "none"
        });

    text.exit()
        .remove();


    /* ------- SLICE TO TEXT POLYLINES -------*/
    var polyline = svg.select(".lines")
        .selectAll("polyline")
        .data(pie(data), key)
        .enter()
        .append("polyline")
        .attr("points", function(d) {
            var pos = outerArc.centroid(d);
            pos[0] += 15 * (midAngle(d) < Math.PI ? 1 : -1);
            return [gapArc.centroid(d), outerArc.centroid(d), pos]; 
        })
        .attr("stroke", function(d, i){ return colors[i];})
        .attr("stroke-width","1.45px")
        .attr("fill","none")
        .style("display", "none");

    polyline.transition()
        .delay(function(d){ return (d.index + 1) * 500; })
        .duration(500)
        .style("display", function(d) {
            if (d.data.rate != 0)
                return "block"
            else
                return "none"
        });

    polyline.exit()
        .remove();

    slices.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", (innerRadius + 10))
        .attr("fill", "rgba(0, 0, 0, 0.34)");
  
    var gradient = slices.append("radialGradient")
        .attr("id", "gradient")
        .attr("cx", 0.5)
        .attr("cy", 0.5)
        .attr("r", 0.5);

    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#ececec");
    gradient.append("stop")
        .attr("offset", "90%")
        .attr("stop-color", "#ffffff");
    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#cacaca");

    slices.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", innerRadius)
        .attr("fill", "url(#gradient)");

    // slices.append("image")
    //     .attr("x", -24)
    //     .attr("y", -25)
    //     .attr("width", 48)
    //     .attr("height", 50)
    //     .attr("xlink:href","img/pie_diagram_img.png");

    var legend = d3.select("svg")
        .append("g")
        .attr("class", "legend");

    if (legendTitle) {
        legend.append("g")
            .attr("class", "legend-title")
            .attr("transform", "translate(0, -30)")
            .append("text")
            .attr("class", "legend-text")
            .attr("x", -5)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "start")
            .text(legendTitle);
    }

    var legendItem = legend.selectAll(".legend-item")
        .data(pie(data))
        .enter()
        .append("g")
        .attr("class", "legend-item")
        .attr("transform", function(d, i) {
            return "translate(0, " + i * 30 + ")"; 
        });

    legendItem.append("rect")
        .attr("x", 0)
        .attr("y", 4)
        .attr("width", 10)
        .attr("height", 10)
        .attr("transform",function() { return 'rotate(45, ' + 0 +', 4)' })
        .style("fill", function(d, i) { return colors[i]; });

    legendItem.append("text")
        .attr("class", "legend-text")
        .attr("x", 15)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .text(function(d) { return d.data.name; });

    const legendText = document.querySelectorAll('.legend-text')
    let longestLegendText = legendText[0].getComputedTextLength()
    for (i = 1; i < legendText.length; i++) {
        if (legendText[i].getComputedTextLength() > longestLegendText ) {
            longestLegendText = legendText[i].getComputedTextLength();
        }
    }

    legend.attr("transform", "translate(" + (width - marginLeft - longestLegendText - 15) + ", " + (height - (data.length + 1) * 20 - marginBottom) + ")");

    var obj = {
        Destroy: function () {
            $('.axis').remove();
        },
        _this: {svg: svg}
    };

    return obj;
}

const colors = ["#d24a43", "#6ac0f3", "#77ba7e"];
const names = ["Тип 1", "Тип 2", "Тип 3"];
const values = [17, 20, 8];

displayPieChart(values, names, colors, "Заголовок легенды");
