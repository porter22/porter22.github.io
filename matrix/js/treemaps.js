function drawTreemaps() {
  var graphData = d3.json('treemap-all-years.json', function(error, data){
  	// now you have your data
  //  console.log(data.children);

  	data.children.forEach(function(d,i) {

  		if (d.name>1981 && d.name<2020) { //for demo purposes
  			//dynamically create SVGs
  		svgselection =	d3.select("div#treemaps")
  			.append("svg")
  			.attr("class", "cubes col-sm-2")
  			.attr("height", "90px")
  			.attr("id", function(dd) {
  				//console.log(dd);
  				return "svg" + i; });
  		//TODO call draw function and pass svgid to it
  		//draw("#svg1", "treemap.json");
  			var arg1 = "#svg" + i;
  		//	console.log(arg1);
  			var arg2 = "treemap_" + i + ".json";
  			//	console.log(arg2);

  		//add years on top
  		/*d3.select("div#treemaps")
  		.append("text")
  		.text(d.name)
  			 .attr("x", 4)
  			 .attr("y", 4)
  			 .attr("font-family", "sans-serif")
  			 .attr("font-size", "11px")
  			 .attr("fill", "black")
  			 .attr("text-anchor", "middle");*/

  		draw(arg1,arg2,d);


  		//console.log(svgs);
  	}

  	});//end for each children
  });//end json

  function draw(selector, url, datapoints){

  //console.log(datapoints);
  	var width = 75,
  		height = 75;

  	// var svg = d3.select("svg"),
  	var svg = d3.select(selector)
  			.append("svg")
  			.attr("width", width)
  			.attr("height", height)
  			.on("click", function() {
  					updateMatrix(datapoints.name);
  			})
        ;

  	d3.select(selector).append('text')
  			.text(datapoints.name)
  			//.attr('class', 'legend')
  			.attr("x", 17)
  			.attr("y", -2)
  			.attr("font-family", "sans-serif")
  			.attr("font-size", "13px")
  			.attr("fill", "black")
  			.attr("font-weight", "600")
  			.attr("text-anchor", "middle");

   //TODO Rewrite color function, so that each color is fixed to a certain cluster

  	 var color = d3.scaleOrdinal(d3.schemeCategory20c).domain([25,0]); //TODO reduce the number of clusters to <20

  	var format = d3.format(",d");

  	var treemap = d3.treemap()
  			.tile(d3.treemapResquarify)
  			.size([width, height])
  			.round(true)
  			.paddingInner(1);

  	d3.json(url, function(error, data) {
  		if (error) throw error;

  		//console.log(data);

  		var root = d3.hierarchy(data)
  				.eachBefore(function(d) { d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.name; })
  				.sum(sumBySize)
  				.sort(function(a, b) { return b.height - a.height || b.value - a.value; });

  		treemap(root);

  		var cell = svg.selectAll("g")
  			.data(root.leaves())
  			.enter().append("g")
  				.attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; });

  		cell.append("rect")
  				.attr("id", function(d) { return d.data.id; })
  				.attr("width", function(d) { return d.x1 - d.x0; })
  				.attr("height", function(d) { return d.y1 - d.y0; })
  				//.text(function(d) { return d.data.id + "\n" + format(d.value); })
  				//.text(function(d) { return "test" })
  				.attr("fill", function(d) {
  					//extract clusterID from the treemapID
  					var tempstr = d.parent.data.id.toString();
  					var separate = tempstr.split(".");
  					/*console.log(separate[2]);//this is a clusterID
  					console.log(color(separate[2]));//this is a clusterID*/
  					return color(separate[2]); })
          .on("mouseover", function(d) {
      				//	console.log(d); //gets array of nodes
      			});


  		cell.append("title")
  				.text(function(d) { return d.data.id + "\n" + format(d.value); });

  		d3.selectAll("input")
  				.data([sumBySize, sumByCount], function(d) { return d ? d.name : this.value; })
  				.on("change", changed);

  		var timeout = d3.timeout(function() {
  			d3.select("input[value=\"sumByCount\"]")
  					.property("checked", true)
  					.dispatch("change");
  		}, 2000);

  		function changed(sum) {
  			timeout.stop();

  			treemap(root.sum(sum));

  			cell.transition()
  					.duration(750)
  					.attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; })
  				.select("rect")
  					.attr("width", function(d) { return d.x1 - d.x0; })
  					.attr("height", function(d) { return d.y1 - d.y0; });
  		}
  	});
  }

  function sumByCount(d) {
  	return d.children ? 0 : 1;
  }

  function sumBySize(d) {
  	return d.size;
  }
}
