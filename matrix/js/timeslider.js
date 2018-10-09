function drawTimeslider() {

  var margin = {top:50, right:50, bottom:0, left:50},
        width = 820 - margin.left - margin.right,
      height = 250 - margin.top - margin.bottom;

  var histHeight = height;

  var startDate = 1994,
      endDate = 2019;

  var barPadding = 1; // <-- New!

  /*var dateArray = d3.timeYears(startDate, d3.timeYear.offset(endDate, 1));

  var colours = d3.scaleOrdinal()
      .domain(dateArray)
      .range(['#ffc388','#ffb269','#ffa15e','#fd8f5b','#f97d5a','#f26c58','#e95b56','#e04b51','#d53a4b','#c92c42','#bb1d36','#ac0f29','#9c0418','#8b0000']);
  */

  d3.csv('timeslider_nonegatives.csv', function(error, data){

    // x scale for time
    var x = d3.scaleTime()
        .domain([startDate, endDate])
        .range([0, width])
        .clamp(true);
        //.ticks(d3.time.year,1);

    // y scale for histogram
    var y = d3.scaleLinear()
        .range([0, histHeight-margin.top])
        /*.domain([d3.min(data, function(d) {
          //console.log(d.nodes);
          return d.nodes; }), d3.max(data, function(d) {
          //console.log(d.nodes);
          return d.nodes; })]);*/
         .domain(d3.extent(data, function(d) { return parseFloat(d.nodes); }));

  //color scale
    /*var c = d3.scaleLinear()
        .range([0, 256])
        .domain(d3.extent(data, function(d) { return parseFloat(d.nodes); }));*/

        var c = d3.scaleOrdinal(d3.schemeCategory20c)
                .domain(d3.extent(data, function(d) { return parseFloat(d.nodes); }));

    var color_scale = d3.scaleLinear()
                        .domain(d3.extent(data, function(d) { return parseFloat(d.nodes); }))
                        .range(['beige', 'red']);

    /*console.log("histHeight: ");
    console.log(histHeight);
    console.log(y(-7766));
    console.log("scaleX: ");
    console.log(x(2000));*/

    var data3 = d3.range(0, 24).map(function (d) { return new Date(1995 + d, 10, 3); });
    //var data3 = [1938, 1981, 1980, 0.015, 0.02, 0.025];;

    /*var svg = d3.select("div#timeslider").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);*/

    var barchart = d3.select("div#timeslider").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    /*var slider  = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");*/

      /*g.append("g")
          .attr("class", "axis axis--x")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x));*/

      barchart.selectAll(".bar")
        .data(data)
        .enter().append("rect")
          .attr("class", function(d, i) {
          return "bar" + d.year;
          })
          .attr("x", function(d, i) {
          /*console.log(d.year);
          console.log("x" + x(d.year));*/
          return x(d.year);
          })
          .attr("y", function(d) {
          return histHeight - y(d.nodes); //height minus data - to inverse bar chart
          })
          .attr("width", width / data.length)
          .attr("height", function(d) {
            /*console.log(d.year);
            console.log(d.nodes);
            console.log("y" + y(d.nodes));*/
          return y(d.nodes);
          })
          .attr("fill", function(d) {
          //console.log(parseFloat(c(d.nodes)));
          return color_scale(d.nodes);
          //return "rgb(0, 0, " + parseFloat(256 - c(d.nodes)) + ")"; //Math.round(parseFloat(c(d.nodes))*100)
          });

          barchart.selectAll("text")
             .data(data)
             .enter()
             .append("text")
             .text(function(d) {
               /*console.log(d.year);
               console.log("scaletext" + x(d.year));*/
               return d.year;
             })
             .attr("x", function(d, i) {
               return x(d.year) + width / data.length /2 ;
             })
             .attr("y", function(d) {
               //return histHeight - y(d.nodes) - 15;
               return histHeight + 15;
             })
             .attr("font-family", "sans-serif")
             .attr("font-size", "11px")
             .attr("fill", "black")
             .attr("text-anchor", "middle");

             //adding brush to barchart svg
             var brush = d3.brush()
                            .on("brush", startBrush)
                            .on("end", endBrush);
             //brush.on("brush", setHistoValues);

              barchart.append("g")
                 .call(brush);

              function endBrush() {
         					console.log("end brush");
         			}

              function startBrush() {
         					console.log("start brush");
                  if (d3.event.selection != null) {
                    
                    var rects = barchart.selectAll("rect")

                    var brush_coords = d3.brushSelection(this);
                    console.log(brush_coords);

                    var newrects = rects.filter(function (){

                               var x = d3.select(this).attr("x"),
                                   y = d3.select(this).attr("y");

                               //console.log(isBrushed(brush_coords, x, y));
                               return isBrushed(brush_coords, x, y);
                           })
                           .attr("class", "brushed");
                    console.log(newrects);

                    //get all brushed elements
                    var d_brushed =  d3.selectAll(".brushed").data();
                  }
         			}

     /* var slider3 = d3.sliderHorizontal()
              .min(d3.min(data3))
              .max(d3.max(data3))
              .step(1000 * 60 * 60 * 24 * 365)
              .width(width + margin.left + margin.right)
              .tickFormat(d3.timeFormat('%Y'))
              .tickValues(data3)
              .on('onchange', val => {
                d3.select("p#value3").text(d3.timeFormat('%Y')(val));
              });

    slider.call(slider3);

    d3.select("p#value3").text(d3.timeFormat('%Y')(slider3.value()));
    d3.select("a#setValue3").on("click", () => slider3.value(new Date(1997, 11, 17))); */
  })
}//end function
