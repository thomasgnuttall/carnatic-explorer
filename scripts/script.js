var w = 800;
var h = 300;
var paddingTop = 25;
var paddingBottom = 35;
var paddingLeft = 35;
var paddingRight = 15;
var linesColumns = 9;
var linesRows = 10;
var pitchPadding = 50; // in cents
var tonic = 196;

// for now random pitch values, to replace later
var pitch = [];
for(let i = 0; i < 10000; i++) {
  pitch.push(Math.random() * (400 - 150) + 150);
}
var time = d3.range(0,10000)

function swap(o){
  var ret = {};
  for(var key in o){
    ret[o[key]] = key;
  }
  return ret;
}


var pitchToCents = function(pitchValues, tonic) {
  var pitchCents = [];
  for(let i = 0; i < pitchValues.length; i++) {
    var p = pitchValues[i];
    if (p == 0) {
      var pCent = null;
    } else {
      var pCent = 1200*Math.log2(p / tonic);
    };
    pitchCents.push(pCent);
  }
  return pitchCents
};

var createDatum = function(pitchValues, timeValues) {
  var datum = [];
  for(let i = 0; i < pitchValues.length; i++) {
    var p = pitchValues[i];
    var t = timeValues[i];
    if (p !== null) {
      datum.push({'pitch':p, 'time':t});
    };
  }
  return datum
};

var pitchPlotNew = function(
  timeValues, pitchValues, w, h, tonic, svaraCents, extProp = 0.5) {
  
  var centsSvara = swap(svaraCents);
  var pitchCents = pitchToCents(pitchValues, tonic);
  var allSvaras = d3.values(svaraCents);

  // TODO: expand svaracents to ocataves

  // Get formated data
  data = createDatum(pitchCents, timeValues)

  // Get axis limits
  var minTime = Math.floor(d3.min(timeValues));
  var maxTime = Math.ceil(d3.max(timeValues));
  
  var minPitch = Math.floor(d3.min(pitchCents)) - pitchPadding;
  var maxPitch = Math.ceil(d3.max(pitchCents)) + pitchPadding;

  // Configure axis
  var xTicks = d3.range(minTime, maxTime, 150);

  var xScale = d3.scaleLinear()
                 .domain([minTime, maxTime])
                 .range([paddingLeft, w-paddingRight]);

  var yScale = d3.scaleLinear()
                 .domain([minPitch, maxPitch])
                 .range([h-paddingBottom, paddingTop]);

  var xAxis = d3.axisBottom()
                .scale(xScale)
                .tickValues(xTicks)
                .tickFormat(function(d, i) {
                    return xTicks[i];
                  });

  var yAxis = d3.axisLeft()
                .scale(yScale)
                .tickValues(allSvaras)
                .tickFormat(function(d, i) {
                    return centsSvara[d];
                  });

  // Populate chart
  /////////////////
  var chart = d3.select(".chart");

  var svg = chart.append("svg")
                 .attr("width", w)
                 .attr("height", h);

  // Axis stuff
  svg.append("g")
      .attr("class", "yAxis")
      .attr("transform", "translate(" + paddingLeft + ",0)")
      .call(yAxis)
      .style("font-size", 10);
  
  svg.append("g")
    .attr("class", "xAxis")
    .attr("transform", "translate(0," + (h - paddingBottom) + ")")
    .call(xAxis);
    
  svg.append("text")
     .attr("class", "yAxisLabel")
     .attr("text-anchor", "middle")
     .attr("alignment-baseline", "middle")
     .attr("transform", "rotate(270, 6, " + (h-paddingBottom-35) + ")")
     .attr("x", 80)
     .attr("y", h-paddingBottom-35)
     .text("Cents above Tonic of " + tonic + "Hz");

  svg.append("text")
     .attr("class", "yAxisLabel")
     .attr("text-anchor", "middle")
     .attr("alignment-baseline", "middle")
     .attr("x", 400)
     .attr("y", h-paddingBottom+30)
     .text("Time (seconds)");

  // Gridlines
  svg.selectAll("pitchLines")
     .data(allSvaras)
     .enter()
     .append("line")
     .attr("x1", paddingLeft)
     .attr("x2", w-paddingRight)
     .attr("y1", function(d) {return yScale(d);})
     .attr("y2", function(d) {return yScale(d);})
     .attr("class", function(d) {
       if((d%tonic == 0)) {
         return "tonicLine";
       } else {
         return "pitchLine"
       };
     });

  svg.selectAll("xGridlines")
     .data(xTicks)
     .enter()
     .append("line")
     .attr("x1", function(d) {return xScale(d);})
     .attr("x2", function(d) {return xScale(d);})
     .attr("y1", paddingTop)
     .attr("y2", function() {
       return yScale(minPitch);
     })
     .attr("class", "xGridline");


  var line = d3.line()
               .x(function(d) { return xScale(d.time);})
               .y(function(d) { return yScale(d.pitch);})
               .curve(d3.curveBasis);

  // Plot data
  svg.append("path")
     .datum(data)
     .attr("class", "line")
     .attr("d", line)
     .style("opacity", 0.7)
     .style("stroke", "orange")
     .style("stroke-width", 1)


};

var carnaticPatterns = function(dataFile) {
  d3.json(dataFile).then(function(data) {

    d3.select("svg").remove();
    d3.select(".gralBtns").remove();
    d3.selectAll(".lineSelector").remove();

    var svaraCents   = data.svaraCents;
    var performances = data.performances;

    //var ppOut = pitchPlot(dataset, w, h, linesRows, linesColumns, xAxis, yAxis, xAxisValues, yAxisValues, 
      //            paddingLeft, paddingRight, paddingTop, paddingBottom, upbeats, minPitch, yScale, xScale, titles, line, opacity);
    
    
    //var gralBtns = ppOut[0];
    //var checkedLines = ppOut[1];
    
    xValues = time.slice(100, 1000)
    yValues = pitch.slice(100, 1000)
    pitchPlotNew(xValues, yValues, w, h, tonic, svaraCents)

    // General Buttons
    gralBtns.append("input")
            .attr("type", "button")
            .attr("value", "Select all")
            .on("click", function() {
              d3.selectAll("input.ariaCheckbox").property("checked", true);
              d3.selectAll("input.lineCheckbox").each(function() {
                var thisCheckbox = d3.select(this);
                var lineValue = thisCheckbox.property("checked");
                var lineID = thisCheckbox.attr("data-lineID");
                if (lineValue == false) {
                  d3.select(this).property("checked", true);
                  checkedLines.push(lineID);
                };
              });
            showCheckedLines();
            });

    gralBtns.append("input")
            .attr("type", "button")
            .attr("value", "None")
            .on("click", function() {
              d3.selectAll("input.ariaCheckbox").property("checked", false);
              d3.selectAll("input.lineCheckbox").each(function() {
                var thisCheckbox = d3.select(this);
                var lineValue = thisCheckbox.property("checked");
                var lineID = thisCheckbox.attr("data-lineID");
                if (lineValue == true) {
                  d3.select(this).property("checked", false);
                  checkedLines.splice(lineID, 1);
                };
              });
            showCheckedLines();
            });


    // Buttons
    // titles.forEach(function(d, i) {
    for (var i = 0; i < titles.length; i++) {
      var row = i;
      var ariaID = titles[i].id;
      var div = d3.select(".lineSelector[data-row='" + row + "'][data-column='0']");

      div.append("input")
         .attr("class", "ariaCheckbox")
         .attr("data-ariaID", ariaID)
         .attr("data-row", row)
         .attr("type", "checkbox")
         .property("checked", true);

      div.append("label")
         .attr("class", "ariaLabel")
         .attr("data-ariaID", ariaID)
         .text(titles[i].title);

      var titleID = titles[i].id;

      var column = 1;

      dataset.forEach(function(d, i) {
        var ariaID = d.id[0];
        var lineNumber = +d.id[1]+1;
        var lineID = ariaID + "-" + lineNumber;

        if (titleID == ariaID) {

          var div = d3.select(".lineSelector[data-row='" + row + "'][data-column='" + column + "']");

          div.append("input")
              .attr("class", "lineCheckbox")
              .attr("data-ariaID", ariaID)
              .attr("data-lineID", lineID)
              .attr("data-row", row)
              .attr("type", "checkbox")
              .property("checked", true);

          div.append("label")
             .attr("class", "lineLabel")
             .attr("data-lineID", lineID)
             .text(lineNumber)
             .on("mouseover", function() {
               highlightLine(ariaID, lineID);
             })
             .on("mouseout", function() {
               anonymizeLine(ariaID, lineID);
             });
          column++;
        };
      });
    };



    var showCheckedLines = function() {
      opacity = Math.ceil(10 / checkedLines.length) / 10;
      d3.selectAll("path.line")
        .select(function() {
          var line = d3.select(this);
          var lineID = line.attr("data-lineID")
          if (checkedLines.includes(lineID)) {
            line.classed("hidden", false)
            line.style("opacity", opacity);
          } else {
            line.classed("hidden", true);
          }
        });
      };



    // Control buttons
    d3.selectAll("input.ariaCheckbox")
      .on("change", function() {
        var ariaCheckbox = d3.select(this);
        var ariaValue = ariaCheckbox.property("checked");
        var row = ariaCheckbox.attr("data-row");
        d3.selectAll(".lineCheckbox[data-row='" + row + "']").each(function() {
          var lineCheckbox = d3.select(this);
          var lineValue = lineCheckbox.property("checked");
          var lineID = lineCheckbox.attr("data-lineID");
          if (ariaValue) {
            if (lineValue == false) {
              lineCheckbox.property("checked", true);
              checkedLines.push(lineID);
            };
          } else {
            if (lineValue) {
              lineCheckbox.property("checked", false);
              var index = checkedLines.indexOf(lineID);
              checkedLines.splice(index, 1);
            };
          };
          showCheckedLines();
        });
      });

    d3.selectAll(".lineCheckbox")
      .on("change", function() {
        var lineID = d3.select(this).attr("data-lineID");
        var row = d3.select(this).attr("data-row");
        if (checkedLines.includes(lineID)) {
          var index = checkedLines.indexOf(lineID);
          checkedLines.splice(index, 1);
        } else {
          checkedLines.push(lineID);
        };
        showCheckedLines();
        var ariaCheckbox = d3.select(".ariaCheckbox[data-row='" + row + "']");
        var allTrue = [];
        d3.selectAll(".lineCheckbox[data-row='" + row + "']").each(function() {
          var lineValue = d3.select(this).property("checked");
          allTrue.push(lineValue);
        });
        if (allTrue.includes(false)) {
          ariaCheckbox.property("checked", false);
        } else {
          ariaCheckbox.property("checked", true);
        };
      });
  });
};

var defaultFile = d3.select("input[type='radio']:checked").property("value")
carnaticPatterns(defaultFile);

d3.selectAll("input[type='radio']")
  .on("click", function() {
    var fileName = d3.select(this).property("value");
    carnaticPatterns(fileName);
  });
