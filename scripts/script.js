var w = 800;
var h = 300;
var paddingTop = 25;
var paddingBottom = 35;
var paddingLeft = 35;
var paddingRight = 15;
var linesColumns = 9;
var linesRows = 10;
var pitchPadding = 50; // in cents

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

var getAllPerformancePaths = function(performances) {
  var pitchTrackPaths = [];
  var audioTrackPaths = [];
  for (const key in performances) {
    pitchTrackPaths.push(performances[key].paths.pitch);
    audioTrackPaths.push(performances[key].paths.audio);
  };
  return [pitchTrackPaths, audioTrackPaths];
};

var getAllMetadata = function(performances) {
  var metadata = [];
  for (const key in performances) {
    metadata.push(performances[key].metadata);
  };
  return metadata;
};

var getAllMotifs = function(performances) {
  var motifs = [];
  for (const key in performances) {
    motifs.push(performances[key].motifsGroups);
  };
  return motifs;
};

var parsePitchTrack = function(track) {
  var pitch = [];
  var time = [];
  for (var i = 0; i < track.length; i++) {
    pitch.push(parseFloat(track[i].pitch));
    time.push(parseFloat(track[i].time));
  }
  return [pitch, time];
};

var expandCentsSvara = function(centsSvara) {
  var expandedCentsSvara = {};
  for (const key in centsSvara) {
    var val = centsSvara[key];
    var intKey = parseInt(key);
    expandedCentsSvara[intKey] = val;
    expandedCentsSvara[intKey+1200] = val;
    expandedCentsSvara[intKey+2400] = val;
    expandedCentsSvara[intKey-1200] = val;
    expandedCentsSvara[intKey-2400] = val;
  };
  return expandedCentsSvara;
};

var reduceCentsSvara = function(centsSvara, minPitch, maxPitch) {
  reducedCentsSvara = {};
  for (const key in centsSvara) {
    if ((key > minPitch) && (key < maxPitch)) {
      reducedCentsSvara[key] = centsSvara[key]
    };
  };
  return reducedCentsSvara;
};

var pitchPlotNew = function(
  timeValues, pitchValues, t1, t2, w, h, tonic, svaraCents) {
  
  // Convert Hz to Cents
  var pitchCents = pitchToCents(pitchValues, tonic);

  // Get formated data
  data = createDatum(pitchCents, timeValues)

  // Get axis limits
  var minTime = Math.floor(d3.min(timeValues));
  var maxTime = Math.ceil(d3.max(timeValues));
  
  var minPitch = Math.floor(d3.min(pitchCents)) - pitchPadding;
  var maxPitch = Math.ceil(d3.max(pitchCents)) + pitchPadding;
  
  // Get only the svaras we care about
  var centsSvara = expandCentsSvara(swap(svaraCents));
  var centsSvara = reduceCentsSvara(centsSvara, minPitch, maxPitch);
  var allSvaras = d3.keys(centsSvara);

  // Configure axis
  var xTicks = d3.range(minTime, maxTime, 1);

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

  ////////////////////
  // Populate chart //
  ///////////////// //
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
       if((d%1200 == 0)) {
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


  // Plotted line
  var line = d3.line()
               .x(function(d) { return xScale(d.time);})
               .y(function(d) { return yScale(d.pitch);})
               .curve(d3.curveBasis);
 
  // Plot
  svg.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", line)
        .style("opacity", 0.7)
        .style("stroke", "orange")
        .style("stroke-width", 1);

  // Invisible entire track region
  svg.append("rect") 
        .attr("x", xScale(minTime))
        .attr("y", yScale(maxPitch))
        .attr("width", w-paddingRight-xScale(minTime))
        .attr("height", yScale(minPitch)-paddingTop)
        .style("opacity", 0)
        .on("mouseover", function(d) {
          d3.select(this)
            .style("fill", "grey")
            .style("stroke", "black")
            .style("stroke-width", 1)
            .style("opacity", "0.1");
        })                  
        .on("mouseout", function(d) {
          d3.select(this).style("opacity", 0); // this shohuld be identical to that in style.css
        });

  // Highlighed pattern region
  svg.append("rect") 
     .attr("x", xScale(t1))
     .attr("y", yScale(maxPitch))
     .attr("width", xScale(t2)-xScale(t1))
     .attr("height", yScale(minPitch)-paddingTop)
     .attr("class", 'patternArea')
     .on("mouseover", function(d) {
       d3.select(this).style("opacity", "0.3");
     })
     .on("mouseout", function(d) {
       d3.select(this).style("opacity", "0.2"); // this shohuld be identical to that in style.css
     });
};

var addMetadata = function(metadata) {
  // TODO: improve tthis
  var chart = d3.select(".chart");
  console.log(chart.width);

  var svg = chart.append("svg")
                 .attr("width", 500)
                 .attr("height", h);

  yInit = 30
  for (const key in metadata) {
    val = metadata[key];
    svg.append("text")
        .attr("text-anchor", "left")
        .attr("alignment-baseline", "middle")
        .attr("x", 0)
        .attr("y", yInit)
        .text(key + ': ' + val);
    yInit += 30
  }  
  
  //svg.append("rect") 
  //      .attr("x", 0)
  //      .attr("y", 0)
  //      .attr("width", w)
  //      .attr("height", h)
  //      .style('fill', 'black');
};

var removePlot = function() {
    d3.select("svg").remove();
    d3.select(".gralBtns").remove();
    d3.selectAll(".lineSelector").remove();
};

var carnaticPatterns = function(dataFile) {
  d3.json(dataFile).then(function(data) {

    removePlot();

    var svaraCents = data.svaraCents;
    var performances = data.performances;
    var paths = getAllPerformancePaths(performances);
    var metadatas = getAllMetadata(performances);
    var motifs = getAllMotifs(performances);
    var pitchTrackPaths = paths[0];
    var audioPaths = paths[1];
    
    var promises = [];

    // Add pitch tracks to queue
    pitchTrackPaths.forEach(function(path) {
      promises.push(d3.tsv(path))
    });
    
    Promise.all(promises).then(function(values) {

      // Load and parse pitch/audio tracks
      pitchTracks = [];
      audioTracks = [];
      for (var i = 0; i < values.length; i++) {
        pitchTracks.push(parsePitchTrack(values[i]));
        //audioTracks.push(p5.loadSound(audioPaths[i]));
      }
      
      //audioTracks[0].play();

      var pitch = pitchTracks[0][0];
      var time = pitchTracks[0][1];
      var metadata = metadatas[0];

      tonic = metadata.tonic;
      xValues = time.slice(100, 10000)
      yValues = pitch.slice(100, 10000)

      pitchPlotNew(xValues, yValues, 13, 20, w, h, tonic, svaraCents)
      addMetadata(metadata);

    });

/*
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
        */
  });

};

var defaultFile = d3.select("input[type='radio']:checked").property("value")
carnaticPatterns(defaultFile);

d3.selectAll("input[type='radio']")
  .on("click", function() {
    var fileName = d3.select(this).property("value");
    carnaticPatterns(fileName);
  });
