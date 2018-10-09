function drawMatrix(yearName) {
  var margin = {top: 80, right: 40, bottom: 40, left: 80},
  		width = 770,
  		height = 770;

  //TODO matrix labels - color like clusters

  /*var x = d3.scale.ordinal().rangeBands([0, width]),
  		z = d3.scale.linear().domain([0, 4]).clamp(true),
  		c = d3.scale.category10().domain(d3.range(10));*/

  		var x = d3.scaleBand().range([0, width]).paddingOuter(0.25),
  		    z = d3.scaleLinear().domain([0, 4]).clamp(true),
  		    c = d3.scaleOrdinal(d3.schemeCategory20c).domain([25,0]); //TODO bind color range limit to actual data

  var svg = d3.select("div#matrix").append("svg")
  		.attr("width", width + margin.left + margin.right)
  		.attr("height", height + margin.top + margin.bottom)
      .attr("class", "matrix")
  		.style("margin-left", -margin.left + "px")
  	   .append("g")
  		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // d3.json("miserables_matrix.json", function(miserables) {
  //var filename = "./clusteredByYears/clustered_" + yearName + ".json"

//TODO https://usabilityetc.com/2016/08/how-to-perform-multiple-asynchronous-tasks-with-d3/
  /*queue()
	  .defer(d3.json, 'clustered_2006.json')
	  .defer(d3.json, 'clustered_2007.json')
	.await(loadjsons);*/

  var queue = d3.queue();

  var filenames = ['clustered_2007.json','clustered_2008.json'];

  filenames.forEach(function(filename) {
    console.log(filename);
    queue.defer(d3.json, filename);
  });

  queue.awaitAll(loadJsons)

  //var filename = "clustered_2006.json"
  //d3.json(filename, function(miserables) {
  function loadJsons(error, miserables) {

    //console.log(miserables);
    //TODO we have now an array of jsons, now aggregate nodes and links
    //console.log(miserables2);

    var nodes = [];
    var links = [];
    var matrix = [];

    miserables.forEach(function(miserable) {
      //console.log(miserable);
      miserable.nodes.forEach(function(node) {
        nodes.push(node);
      })
      miserable.links.forEach(function(link) {
        links.push(link);
      })

    });

    l = links.length;
    n = nodes.length;

  	// Compute index per node.
  	nodes.forEach(function(node, i) {
  		node.index = i;
  		node.count = 0;
  		matrix[i] = d3.range(n).map(function(j) { return {x: j, y: i, z: 0}; });
  	});
    //console.log(matrix);

    var nodeByName = d3.map(nodes, function(d) {
      return d.name;
    });

    console.log(n,l);
    console.log(nodes);

    //console.log(nodeByName.get("butanol").index);

    //transform textual node names to numeric nodeIDs
    links.forEach(function(d, index) {
      /*  console.log("index: " + index);
        console.log("d.source: " + d.source);
        //console.log("nodeByName.get(d.source): " + nodeByName.get(d.source));
        console.log("nodeByName.get(d.source).index: " + nodeByName.get(d.source).index);
        console.log("d.target: " + d.target);
        //console.log("nodeByName.get(d.source): " + nodeByName.get(d.source));
        console.log("nodeByName.get(d.target).index: " + nodeByName.get(d.target).index);*/
        d.source = nodeByName.get(d.source).index;
        d.target = nodeByName.get(d.target).index;
    });

    //console.log(miserables.links);

  	// Convert links to matrix; count node occurrences.
  	links.forEach(function(link) {
      /*console.log("link.source - " + link.source);
  		console.log("link.target - " + link.target);
  		console.log(matrix[link.source][link.target]);
  		//console.log(link.value);*/
  		matrix[link.source][link.target].z += link.value;
  		matrix[link.target][link.source].z += link.value;
  		matrix[link.source][link.source].z += link.value;
  		matrix[link.target][link.target].z += link.value;
  		nodes[link.source].count += link.value;
  		nodes[link.target].count += link.value;
  	});

  	// Precompute the orders.
  	var orders = {
  		name: d3.range(n).sort(function(a, b) { return d3.ascending(nodes[a].name, nodes[b].name); }),
  		count: d3.range(n).sort(function(a, b) { return nodes[b].count - nodes[a].count; }),
  		group: d3.range(n).sort(function(a, b) { return nodes[b].group - nodes[a].group; })
  	};

  	// The default sort order.
  	x.domain(orders.name);

  	svg.append("rect")
  			.attr("class", "background")
  			.attr("width", width)
  			.attr("height", height);

  	var row = svg.selectAll(".row")
  			.data(matrix)
  		.enter().append("g")
  			.attr("class", "row")
  			.attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
  			.each(row);

  	row.append("line")
  			.attr("x2", width);

  	row.append("text")
  			.attr("x", -6)
  			.attr("y", x.bandwidth() / 2)
  			.attr("dy", ".32em")
  			.attr("text-anchor", "end")
  			.style("font-size", "8px")
  			.text(function(d, i) { return nodes[i].name; });

  	var column = svg.selectAll(".column")
  			.data(matrix)
  		.enter().append("g")
  			.attr("class", "column")
  			.attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

  	column.append("line")
  			.attr("x1", -width);

  	column.append("text")
  			.attr("x", 6)
  			.attr("y", x.bandwidth() / 2)
  			.attr("dy", ".32em")
  			.attr("text-anchor", "start")
  			.style("font-size", "8px")
  			.text(function(d, i) { return nodes[i].name; });

    row.exit().remove()
    column.exit().remove()

  	function row(row) {
  		var cell = d3.select(this).selectAll(".cell")
  				.data(row.filter(function(d) { return d.z; }))
  			.enter().append("rect")
  				.attr("class", "cell")
  				.attr("x", function(d) { return x(d.x); })
  				.attr("width", x.bandwidth())
  				.attr("height", x.bandwidth())
  				.style("fill-opacity", function(d) { return z(d.z); })
  				.style("fill", function(d) { return nodes[d.x].group == nodes[d.y].group ? c(nodes[d.x].group) : null; })
  				.on("mouseover", mouseover)
  				.on("mouseout", mouseout);
  	}

  	function mouseover(p) {
  		d3.selectAll(".row text").classed("active", function(d, i) { return i == p.y; });
  		d3.selectAll(".column text").classed("active", function(d, i) { return i == p.x; });
  	}

  	function mouseout() {
  		d3.selectAll("text").classed("active", false);
  	}

  	d3.select("#order").on("change", function() {
  		clearTimeout(timeout);
  		order(this.value);
  	});

  	function order(value) {
  		x.domain(orders[value]);

  		var t = svg.transition().duration(2500);

  		t.selectAll(".row")
  				.delay(function(d, i) { return x(i) * 4; })
  				.attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
  			.selectAll(".cell")
  				.delay(function(d) { return x(d.x) * 4; })
  				.attr("x", function(d) { return x(d.x); });

  		t.selectAll(".column")
  				.delay(function(d, i) { return x(i) * 4; })
  				.attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });
  	}

  	var timeout = setTimeout(function() {
  		order("group");
  		d3.select("#order").property("selectedIndex", 2).node().focus();
  	}, 5000);
  }
} //end drawMatrix

//takes a year as an input and redraws the matrix for that year
function updateMatrix(year) {
  console.log(year);
  d3.select(".matrix").remove();
  drawMatrix(year);
}
