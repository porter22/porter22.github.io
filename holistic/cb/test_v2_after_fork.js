
treeJSON = d3.json("graph_cb.json", function(error, json) {
  var clickedElemList = [];

  var viewerWidth = $(document).width();
  var viewerHeight = $(document).height();

  console.log(error);

  var nodes = json.nodes;
  //console.log(nodes);
  var treelinks = json.links;
  var traces = json.traces;

  var globaldomains = ["A","B","C","D","E"];

  //add IDs to nodes
  for (var j = 0; j < nodes.length; j++) {
  	nodes[j].nodeid = j;
  }

  console.log("initial nodes:", nodes);

  //rewrite getTracingDictFullArray so that it shows connections only that are present in matrix + hierarchical connections for each pair



  /*var mergedTraces = mergeFileTraces();

  traces = mergeTwoArrays(traces,mergedTraces);

  console.log("traces:", traces);

  var userTraces = getTracesFromFile(); //return global array of unordered full traces

  console.log("traces:", traces);
  //dictionary, where key = nodeID, value = list of connected nodes from traces
  //var tracingDictFull = getTracingDictFullArray(userTraces, nodes);
  var tracingDictFull = getTracingDictFullArray(userTraces, nodes);
  //var tracingDictFullTwo = getTracingDictFullArrayTwo(userTraces, nodes)*/

  //var tracingDictFull = getTracingDictFullArray(userTraces, nodes);

  var pairTracelinks = getPairTracelinks(traces);
  console.log("pairTracelinks: ", pairTracelinks);

  var tracingDictFull = getNewTracingDict(pairTracelinks, nodes);
  console.log("tracingDictFull: ", tracingDictFull);


  //make sure that for each trace, there are no traces with the same domain and level
  //var uniqueDomainTDFull = getUniqueDomainTDFull();

  function getPairTracelinks (traces){
    var resultarray = [];
    for (var i = 0; i < traces.length; i++) {
      tracenodes = traces[i].nodeids.split(",");
      var tracelink = {};
      //console.log("tracenodes:", tracenodes);
      tracelink.source = tracenodes[0];
      tracelink.target = tracenodes[1];
      resultarray.push(tracelink);
    }
    return resultarray;
  }

  //takes an array of full traces,
  // returns a dict, where key = nodeID, value = list of connected nodes from traces
  function getNewTracingDict (tracelinks, nodes) {
    console.log("tracelinks:", tracelinks);
    var resultarray = [];

    for (var j = 0; j < nodes.length; j++) {
      resultarray[j] = [];
      var curnode = nodes[j];
      console.log("current node:", curnode.nodeid);
      for (var k = 0; k < tracelinks.length; k++) {
        //find traces with current node
        //0. push this node's ancestors to fullTraceArray
        //1. push both source and target to fullTraceArray
        //2. push all ancestors of both source and target to fullTraceArray
        if (curnode.nodeid == tracelinks[k].source || curnode.nodeid == tracelinks[k].target) {
          resultarray[j].push(tracelinks[k].source);
          resultarray[j].push(tracelinks[k].target);
          var nodeAncestors = getDomainRoot(curnode, []);
          var sourceAncestors = getDomainRoot(nodes[tracelinks[k].source], []);
          var targetAncestors = getDomainRoot(nodes[tracelinks[k].target], []);
          console.log("nodeAncestors:", nodeAncestors);
          console.log("sourceAncestors:", sourceAncestors);
          console.log("targetAncestors:", targetAncestors);
          nodeAncestors.forEach(function(entry) {
            resultarray[j].push(entry.nodeid.toString());
          });
          sourceAncestors.forEach(function(entry) {
            resultarray[j].push(entry.nodeid.toString());
          });
          targetAncestors.forEach(function(entry) {
            resultarray[j].push(entry.nodeid.toString());
          });

          console.log("getDomainRoot25:", getDomainRoot(nodes[25], []));
          //console.log("domroot:", domroot);
        }
      }
    }

    for (var j = 0; j < resultarray.length; j++) {
      resultarray[j] = uniq_fast(resultarray[j]);
    }
    //console.log("resultarray:", resultarray);
    return resultarray;
  }

  //remove duplicates from an array
  //https://stackoverflow.com/questions/9229645/remove-duplicate-values-from-js-array
  function uniq_fast(a) {
    var seen = {};
    var out = [];
    var len = a.length;
    var j = 0;
    for(var i = 0; i < len; i++) {
         var item = a[i];
         if(seen[item] !== 1) {
               seen[item] = 1;
               out[j++] = item;
         }
    }
    return out;
}


  //
  function getUniqueDomainTDFull() {
    //for (var i = 0; i < tracingDictFull.length; i++) {
    var i = 14;
      var nodeindex = i;
      var nodedomain = nodes[i].domain;
      var nodelevel = nodes[i].level;
      var arrayoftraces = tracingDictFull[i];
      var newarrayoftraces = [];
      for (var j = 0; j < arrayoftraces.length; j++) {
        var trace = arrayoftraces[j];
        var newtrace = [];
        console.log("trace:", j, trace);
        //remove nodes that are in the same domain and level
        for (var k = 0; k < trace.length; k++) {
          var othernode = trace[k];
          console.log("othernode:", othernode.name);

          //

          if (othernode.domain != nodedomain || othernode.level != nodedomain || othernode.nodeid == nodeindex) {
            newtrace.push(othernode);
            //continue;
          }

        }
        //here we have a newtrace without deleted nodes
        newarrayoftraces.push(newtrace);
      }
      tracingDictFull[i] = newarrayoftraces;
    //}
  }

  function findPairNodes(nodeid) {
    var resultarray = [];
    for (var i = 0; i < traces.length; i++) {
      tracenodes = traces[i].nodeids.split(",");
      //console.log("tracenodes:", tracenodes);
      var indexInTrace = tracenodes.indexOf(nodeid.toString());
      if (indexInTrace != -1) {
        if (indexInTrace == 0) { //we deal only with pairs, so check either the other element index is 0 or 1
          resultarray.push(tracenodes[1]);
        } else {
          resultarray.push(tracenodes[0]);
        }
      }
    }
    //console.log("pairnodes:", resultarray);
    return resultarray;
  }

  //merges traces within tracingDictFull
  function mergeFileTraces() {

    //for each node in findPairNodes
    //find pairnodes
    //for each pairnodelvl2
    //construct object {nodeids: "id,pairnodelvl2"}
    var resultarray = [];

    for (var n = 0; n < nodes.length; n++) {
      var id = nodes[n].nodeid;
      //var id = 14;
      var nodedomain = nodes[id].domain;
      var nodelevel = nodes[id].level;
      var pairnodes = findPairNodes(id);
      //console.log("lvl 1 pairnodes:", pairnodes);
      for (var i = 0; i < pairnodes.length; i++) {
        var lvlonepairnode = pairnodes[i];
        //console.log("  lvl 1 pairnode:", lvlonepairnode);
        var lvltwopairnodes = findPairNodes(lvlonepairnode);
        //console.log("   lvl 2 pairnodes:", lvltwopairnodes);

        for (var j = 0; j < lvltwopairnodes.length; j++) {
          //construct object {nodeids: "id,pairnodelvl2"}
          var othernode = nodes[lvltwopairnodes[j]];
          /*console.log("   othernode:", othernode);
          console.log("   othernode.domain:", othernode.domain);
          console.log("   nodedomain:", nodedomain);

          console.log("   othernodelevel:", othernodelevel);
          console.log("   nodelevel:", nodelevel);
          */
          if (othernode.domain == nodedomain && othernode.level == nodelevel) {
            //console.log("   condition holds..");
            continue;
          } else {
            var traceobj = {}
            //"{nodeids: \"" + id + "," + lvltwopairnodes[j] + "\"}";
            traceobj.nodeids = id + "," + lvltwopairnodes[j];
            //console.log(traceobj);
            resultarray.push(traceobj);
          }
        }
      }
    }
    return resultarray;
  }

  function mergeTwoArrays(array1,array2) {
    //var resultarray = [];
    for (var k = 0; k < array2.length; k++) {
      array1.push(array2[k]);
    }
    return array1;
  }

  //TODO: combine traces within tracingDictFullTwo array
  //first, sort by domains and levels
  //second, find common trace slices, add nodes in those slices to tracingDictFullTwo[j]
  /*var sortedTracingDictFullTwo = sortTracesByDomainAndLevel(tracingDictFullTwo);

  var sortedMergedTracingDictFullTwo = mergeTracesWithinTracingDictFullTwo(sortedTracingDictFullTwo);
  */
  //array of links from all traces
  //var tracelinks = getLinksFromTraces(userTraces);
  //var tracelinks = getLinksFromTraces(userTraces);
  //console.log("all tracelinks:", tracelinks);

  //console.log("all treelinks: ", treelinks);
  //we distinguish between hierarchical links and links that are generated from the traces
  //rewrite this so that it adds only links that are not present in treelinks
  //var links = treelinks.concat(tracelinks);

  //links = inverseLinks(links);
  //var links = mergeLinks(treelinks, tracelinks);

  //console.log("merged links: ", links);
  //inverse links, if their source is larger level, that target
  //and if within same domain
  function inverseLinks(links) {
  	var resultlinks = [];
  	for (var i = 0; i < links.length; i++) {
  		source = getNodeIndexByName(links[i].source);
  		target = getNodeIndexByName(links[i].target);
  		//console.log("current link:", links[i]);
  		if (nodes[source].domain == nodes[target].domain && nodes[source].level > nodes[target].level) {
  			links[i].source = nodes[target].name;
  			links[i].target = nodes[source].name;
  			//console.log("link: " + links[i] + " have changed")
  		}
  	}
  	return links;
  }

  //combine separate traces to create long traces
  function mergeTracesWithinTracingDictFullTwo(tracingDictFull) {
  //console.log("mergeTracesWithinTracingDictFullTwo...");
  //go through each item in the tracingDictFull
  	var resultDict = [];
  	for (var i = 0; i < tracingDictFull.length; i++) {
  		resultDict[i] = [];
  		var nodetrace1 = tracingDictFull[i];
  		for (var j = 0; j < tracingDictFull.length; j++) {
  			if (i==j)
  				continue;
  			var nodetrace2 = tracingDictFull[j];
  		//for each domain in nodetrace dict,
  			for (var k = 0; k < globaldomains.length; k++) {
  				var curdomain = globaldomains[k];
  				/*console.log("curdomain:", curdomain);
  				console.log("nodetrace1[curdomain]:", nodetrace1[curdomain]);
  				console.log("nodetrace2[curdomain]:", nodetrace2[curdomain]);*/
  				if (nodetrace1[curdomain] == nodetrace2[curdomain]) {
  					var merged = mergeTwoTraces(nodetrace1, nodetrace2);
  				}
  			}
  		}
  		resultDict[i].push(merged);
  	}
  	return resultDict;

  }

  function mergeTwoTraces(trace1, trace2) {
  	console.log("mergeTwoTraces...");
  	//console.log("trace1:", trace1);
  	//console.log("trace2:", trace2);
  }

  function sortTracesByDomainAndLevel(tracingDict) { //second version of sortByDomain
  	console.log("sortTracesByDomainAndLevel...");
  	var resultedarray = [];
  	//this sorts only by domains, but not by levels
  	for (var j = 0; j < tracingDict.length; j++) {
  		//console.log("traceArray[j]:",traceArray[j]);
  		var tracedomnodes = {};
  		for (var k = 0; k < globaldomains.length; k++) {
  			tracedomnodes[globaldomains[k]] = [];
  			for (var l = 0; l < tracingDict[j].length; l++) {
  				if (tracingDict[j][l].domain == globaldomains[k]) {
  					tracedomnodes[globaldomains[k]].push(tracingDict[j][l]);//array that contains nodes with one trace, belonging to one domain
  					//semiresultedarray.push(traceArray[j]);
  				}
  			}
  			tracedomnodes[globaldomains[k]].sort(compareLevels);
  		}
  		//console.log("tracedomnodes:",tracedomnodes);
  		resultedarray.push(tracedomnodes);
  	}
  	//console.log("resultedsortedarray:",resultedarray);
  	return resultedarray;
  } //end function

  //sorts nodes according to their levels
  //https://stackoverflow.com/questions/1129216/sort-array-of-objects-by-string-property-value
  //usage: objs.sort( compare );
  function compareLevels( a, b ) {
    if ( a.level < b.level ){
      return -1;
    }
    if ( a.level > b.level ){
      return 1;
    }
    return 0;
  }

  //given full trace array, sorts by domains REQS - FUNCTIONS - STRUCTURE
  function sortByDomain(traceArray) {
  	//console.log("sortByDomain..");
  	//first, fill dict where key is domain name,
  	//value is array of nodes in that domain
  	var domaintraces = {};
  	//var resultarray = [];
  	for (var j = 0; j < traceArray.length; j++) {
  			if (domaintraces[traceArray[j].domain] != null) {
  				domaintraces[traceArray[j].domain].push(traceArray[j]);
  			} else {
  				domaintraces[traceArray[j].domain] = [];
  				domaintraces[traceArray[j].domain].push(traceArray[j]);
  			}
  	}

    var resultarray = [];

    for (var j = 0; j < globaldomains.length; j++) {
      for (var k = 0; k < domaintraces.length; k++) {
        if (domaintraces[k].domain == globaldomains[j]) {
          resultarray.push(domaintraces[k]);
        }
      }
    }
  	//console.log("sorted domaintraces:", resultarray);
  	return resultarray;
  }

  //function that returns an array of source-targets from the traces
  function getLinksFromTraces(userTraces) {
  	//console.log("getLinksFromTraces ... ");
  	var tracelinks = [];
  	for (var j = 0; j < userTraces.length; j++) {
  		var fulltraceArray = userTraces[j];
  		//sort by domains, so that edges go starting from right to left
  		fulltraceArray = sortByDomain(fulltraceArray);
  		//console.log("fulltraceArray:", fulltraceArray);

  		//for each node in trace, create link from this node, to next one
  		for (var k = 0; k < fulltraceArray.length - 1; k++) {
  			var tracelink = {};
  			tracelink.source = fulltraceArray[k].name;
  			tracelink.target = fulltraceArray[k+1].name;
  			tracelinks.push(tracelink);
  		}
  	}
  	return tracelinks;
  }

  function getTracingDictFullArrayTwo (userTraces, nodes) { //second version
  	var resultarray = [];
  	for (var j = 0; j < nodes.length; j++) {
  		resultarray[j] = [];
  		//iterate all traces, find traces that contain this node
  		//extract all nodes from these traces, merge them into one array
  		//remove duplicates
  		for (var k = 0; k < userTraces.length; k++) {
  			var trace = userTraces[k];
  			var tracenodeids = getNodeIDsFromTrace(trace);
  			//console.log("fulltraceArray:", fulltraceArray);
  			if (tracenodeids.indexOf(nodes[j].nodeid) != -1) { //if node is in trace, add all tracenodes to the resultarray[j]
  				for (var l = 0; l < tracenodeids.length; l++) {
  					if (resultarray[j].indexOf(nodes[tracenodeids[l]]) == -1) {
  						resultarray[j].push(nodes[tracenodeids[l]]); //we push node that corresponds to the nodeid in the trace
  					}
  				}
  			}
  		}
  	}
  	//console.log("resultarray:", resultarray);
  	return resultarray;
  }

  //takes an array of full traces,
  // returns a dict, where key = nodeID, value = list of connected nodes from traces
  function getTracingDictFullArray (userTraces, nodes) {
  	//console.log("getTracingDictFullArray...");
  	//console.log("fulltraceArray:", fulltraceArray);
  	var resultarray = [];

  	for (var j = 0; j < nodes.length; j++) {
  		resultarray[j] = [];
  		for (var k = 0; k < userTraces.length; k++) {
  			var fulltraceArray = userTraces[k];
  			//console.log("fulltraceArray:", fulltraceArray);
  			var tracenodeids = getNodeIDsFromTrace(fulltraceArray);
  			//console.log("tracenodeids:", tracenodeids);

  			//if nodeid is in tracenodeid list, assign or push fullTraceArray
  			if (tracenodeids.indexOf(nodes[j].nodeid) != -1) {
  				//console.log("nodes[j]:", nodes[j], "is in tracenodeids", tracenodeids);
  				//console.log("resultarray[j]", resultarray[j]);
  				resultarray[j].push(fulltraceArray);
  			}
  		}
  	}
  	//console.log("resultarray:", resultarray);
  	return resultarray;
  }

  //gets a trace, returns an array of nodeids
  function getNodeIDsFromTrace(fulltrace) {
  	//console.log("getNodeIDsFromTrace...");
  	//console.log("fulltrace...", fulltrace);
  	var resultarray = [];
  	for (var j = 0; j < fulltrace.length; j++) {
  		resultarray.push(fulltrace[j].nodeid);
  	}
  	return resultarray;
  }

  //gets a trace array, returns an array of nodeids
  function getNodeIDsFromTraceArray(traceArray) {
  	//console.log("getNodeIDsFromTraceArray...");
  	var resultarray = [];
  	for (var j = 0; j < traceArray.length; j++) {
  		for (var k = 0; k < traceArray[j].length; k++) {
  			resultarray.push(traceArray[j][k].nodeid);
  		}
  	}
  	return resultarray;
  }

  //takes strings of user defined traces from the file,
  //transforms them into array of full traces
  function getTracesFromFile () {
  	var resultarray = [];
  	for (var k = 0; k < traces.length; k++) {
  			//take each trace and make it full
  			tracenodes = traces[k].nodeids.split(",");
  			//console.log("tracenodes:", tracenodes);
  			var fulltrace = getFullTraceFromShortTrace(tracenodes);
  			//console.log("fulltrace:", fulltrace);
  			resultarray.push(fulltrace);
  	}
  	return resultarray;
  }

  //takes a user defined route in the form of array of two elements,
  //translates it to full route with all nodes along the route
  function getFullTraceFromShortTrace(traceArray) {
  	//console.log("getFullTraceArray...");
  	var fullTraceArray = [];
  	//we assume that array is sorted
  	for (var j = 0; j < traceArray.length; j++) {
  		var curnode = traceArray[j];
  		//console.log("current node:", nodes[curnode]);
  		var domroot = getDomainRoot(nodes[curnode], []);
  		domroot.unshift(nodes[curnode]);
  		//console.log("domroot:", domroot);
  		//add all connected nodes within one domain to the overall tracing array
  		fullTraceArray = fullTraceArray.concat(domroot);
  	}
  	//console.log("fullTraceArray: ", fullTraceArray);
  	return fullTraceArray;
  }

  //returns an array of all the ancestors of that node within domain
  function getDomainRoot(node, resultarray) {
  	//console.log("getDomainRoot for node:", node);
  	//console.log("node:", nodes[node.nodeid]);
  	var parent = getParent(node.nodeid, nodes, treelinks);
  	//console.log("parent:", parent);
  	if (parent != null) {
  		//console.log("parent domain:", parent.domain,"node domain:", node.domain);
  		if (parent.domain == node.domain) {
  			resultarray.push(parent);
  			//console.log("resultarray after push:", resultarray);
  			resultarray = getDomainRoot(parent, resultarray);
  		}
  	}
  	return resultarray;
  }

  function getDomainArray() {
  	domarray = [];
  	domnames = [];
  	for (j = 0; j < nodes.length; j++) {
  		domindex = domnames.indexOf(nodes[j].domain);
  		if (domindex != -1) {
  			domarray[domindex].nodes.push(nodes[j]);
  	} else {
  			domnames.push(nodes[j].domain);
  			var domobj = {};
  			domobj.name = nodes[j].domain;
  			domobj.nodes = [];
  			domobj.nodes.push(nodes[j]);
  			domarray.push(domobj);
  			//console.log("domnames:", domnames);
  			//console.log("domarray:", domarray);
  		}
  	} //end for loop
  	//console.log("domarray:", domarray);
  	return domarray;
  }

  //sort domain array by levels, where each array element contains set of nodes for that level
  function sortDomainArray(domarray) {
  	//console.log("inarray", domarray);
  	var outarray = domarray;
  		for (var j = 0; j < domarray.length; j++) {
  			var domnodes = domarray[j].nodes;
  			//create array with maxlevel number of dimensions
  			var maxlvl = domarray[j].maxlevel;

  			var resultarray = createNDimArray([maxlvl,1]);
  			//console.log("resultarray:", resultarray);
  			for (var k = 0; k < domnodes.length; k++) {
  				var nodelevel =  domnodes[k].level;
  				if (resultarray[nodelevel - 1] == null) {
  					resultarray[nodelevel - 1] = [];//.push(domnodes[k]);
  				} else {
  					resultarray[nodelevel - 1].push(domnodes[k]);
  				}
  			}
  			//remove first null element
  			for (var k = 0; k < resultarray.length; k++)
  				resultarray[k].shift();//removes first null element
  			//console.log("domain:", domarray[j].name, "resultarray after", resultarray);
  			outarray[j].nodes = resultarray;
  		}
  		//console.log("outarray", outarray);
  		return outarray;
  }

  //stackoverflow.com/questions/12588618/javascript-n-dimensional-array-creation
  function createNDimArray(dimensions) {
   var ret = undefined;
   if(dimensions.length==1){
  		ret = new Array(dimensions[0]);
  		for (var i = 0; i < dimensions[0]; i++)
  				ret[i]=null; //or another value
  		return ret;
   }
   else{
  		//recursion
  		var rest = dimensions.slice(1);
  		ret = new Array(dimensions[0]);
  		for (var i = 0; i < dimensions[0]; i++)
  				ret[i]=createNDimArray(rest);
  		return ret;
   }
  }

  function getParent(nodeindex, nodes, treelinks) {
    /*console.log("treelinks:", treelinks);
    console.log("nodeindex:", nodeindex); */
  	var parent = null;
  	for (j = 0; j < treelinks.length; j++) {
  		link = treelinks[j];
  		source = getNodeIndexByName(link.source);
  		target = getNodeIndexByName(link.target);
      /*console.log("source origin:",link.source);
      console.log("target origin:",link.target);
      console.log("source:",source);
      console.log("target:",target); */
  		if (source == nodeindex) {
  			//console.log(link);
  			//console.log(nodeindex,nodes[nodeindex].name, nodes[target].name, nodes[target].level);
  			if (nodes[target].level < nodes[nodeindex].level && nodes[target].domain == nodes[nodeindex].domain)
  				//put into children list
  				parent = nodes[target];
  				//console.log("node: ", nodes[nodeindex], "target: ", nodes[target]);
  		}//if
  		if (target == nodeindex) {
  			//console.log(link);
  			//console.log(nodeindex,nodes[nodeindex].name, nodes[source].name, nodes[source].level);
  			if (nodes[source].level < nodes[nodeindex].level && nodes[source].domain == nodes[nodeindex].domain)
  				//put into children list
  				parent = nodes[source];
  				//console.log("node: ", nodes[nodeindex], "source: ", nodes[source]);
  		}//if
  	}//for loop

  	//TODO: Make sure that parent belongs to the same domain as a child
  	return parent
  }

  function getNodeIndexByName(nodename) {
  	//console.log("getNodeIndexByName function...");
  	//console.log("nodes:", nodes);
  	//console.log("nodename:", nodename);
  	for (var j = 0; j < nodes.length; j++) {
  		//console.log("domainelement.nodes[j].id:", domainelement.nodes[j].nodeid, "nodeid:", nodeid);
  		if (nodename == nodes[j].name) {
  			//iterate within that domain and count how many nodes are there at that level
  				//console.log("return nodeindex:", j);
  				return j;
  		}
  	}
  //      return null;
  }

  function getChildren(nodeindex, nodes, treelinks) {
  //Given a node index, returns a list of children for this node
  		//go through each link
  			//if link.source == nodeindex
  				//check level of nodes[link.target]
  				//- if level is lower than current node (nodes[nodeindex]), then add to the children list
  			//if link.target == nodeindex
  				//check level of nodes[link.source] - if level is lower than current node (nodes[nodeindex]), then add to the children list
  		children = [];
  		//console.log("current node", nodes[nodeindex].name);
  		//console.log("getChildren:");
  		for (var j = 0; j < treelinks.length; j++) {
  			link = treelinks[j];
  			//console.log(link);
  			source = getNodeIndexByName(link.source);
  			target = getNodeIndexByName(link.target);
  			if (nodes[target].domain == nodes[nodeindex].domain && nodes[source].domain == nodes[nodeindex].domain) {
  				if (source == nodeindex) {
  					//console.log(nodeindex,nodes[nodeindex].name, nodes[target].name, nodes[target].level);
  					if (nodes[target].level > nodes[nodeindex].level)
  						//put into children list
  						children.push(nodes[target]);
  				}//if
  				if (target == nodeindex) {
  					if (nodes[source].level > nodes[nodeindex].level)
  						//put into children list
  						children.push(nodes[source]);
  				}//if
  			}
  		}//for loop
  		//console.log("number of children", children.length);
  		return children
  }//function

  //calculates starting positions X for each domain, adds maxlevel parameter for each domain
  function calcDomainPositionsX(domarray) {
    //for each domain, find maxlevel depths
    //find sum of levels for all domains
    //find separation between levels = totalwidth/sum of levels
    sum = 0;
    //console.log("domain:", domarray);
    //for(var domain in domaindict) {
    for (var j = 0; j < domarray.length; j++) {

      var maxlevel = getMaxLevels(domarray[j]);
      //console.log("domain:", domain, "maxlevel:", maxlevel);
      domarray[j].maxlevel = maxlevel;
      //console.log("domain:", domarray[j].name, "maxlevel:", domarray[j].maxlevel);
      // do something with "key" and "value" variables
      sum = sum + maxlevel;
    }

    sepX = viewerWidth / sum;
    //console.log("viewerWidth:", viewerWidth, "sepX:", sepX, "total levels:", sum);

    //assign startX to each domain
    domarray[0].startX = 0;
    for (var j = 1; j < domarray.length; j++) {
      domarray[j].startX = domarray[j-1].startX + sepX * domarray[j-1].maxlevel;
      //console.log("j:", j, "domarray[j-1].startX:", domarray[j-1].startX);
    }

    }//end function

  //main function that determines Y positions of nodes
  //based on https://rachel53461.wordpress.com/2014/04/20/algorithm-for-drawing-trees/
  function calcNodePositionsY(domarray) {
    //nodeposY for first level = viewerHeight / nodeslength for that level and that domain
    //nodeposY for next levels = parent.spaceY / nodeslength for that level
    //where parent.spaceY - height available for that parent
    //console.log("Calculating Y positions for nodes...");

    //for (var j = 0; j < domarray.length; j++) {
    var maxRootNodeY = 0;
    var rootNodes = [];

    for (var j = 0; j < domarray.length; j++) { //CHANGE FOR 0 WHEN DONE WITH TESTING ONE DOMAIN
      var rootNode = domarray[j].nodes[0][0];

      //console.log("initial root:", rootNode);
      var prevdommaxlevel = 0; //max level of the previous domain
      if (j > 0)
        prevdommaxlevel = domarray[j-1].maxlevel

      initializeNodes(rootNode,0,j, prevdommaxlevel);

      //console.log("initialized root:", rootNode);

      // assign initial X and Mod values for nodes
      calcInitNodeY(rootNode); //firstwalk

      //console.log("Calculating Initial Positions Completed -----------------------");
      //console.log(rootNode);
      // ensure no node is being drawn off screen
      checkAllChildrenOnScreen(rootNode);

      // assign final X values to nodes
      calculateFinalPositions(rootNode, 0);

      //find max positionY for root nodes for later vertical alignment of trees
      if (rootNode.positionY > maxRootNodeY)
        maxRootNodeY = rootNode.positionY;

      rootNodes.push(rootNode);
    }

      for (var j = 0; j < rootNodes.length; j++) {
        //TODO: write function that vertically centers trees for each domain
        //console.log("root node:", rootNodes[j]);
        var domstartY = rootNodes[j].positionY;
        vertAlignRootNode(rootNodes[j], domstartY, maxRootNodeY);

      }
    //console.log("domarray after spaceY:", domarray);
  }// end function

  //vertically centers trees for each domain
  function vertAlignRootNode(node, domstartY, maxRootNodeY) {
    //take the rootnode with max positionY
    //set positionY of all the root nodes of other domains equal to max(positionY)
    node.positionY = maxRootNodeY - domstartY + node.positionY;
    var children = getChildren(node.nodeid,nodes, treelinks);
    children.forEach(function(child) {
      vertAlignRootNode(child, domstartY, maxRootNodeY);
    });
  }

  function initializeNodes(node, depth, domainindex, prevdomainmaxlevel) {
    //console.log("Initializing node ", node);
    node.positionY = -1;
    //console.log("positionY set to ", node.positionY);
    //node.positionX = depth + domainindex*distX*domainmaxlevel;
    node.positionX = depth + prevdomainmaxlevel*distX*domainindex;

    node.mod = 0;

    var children = getChildren(node.nodeid,nodes, treelinks);
    children.forEach(function(child) {
      initializeNodes(child,depth + distX,domainindex, prevdomainmaxlevel);
    });
  } //end function

  function calculateFinalPositions(node, modsum) {
    //console.log("Calculating Final Positions for node:", node);
    node.positionY += modsum;
    //console.log("positionY set to ", node.positionY);
    modsum += node.mod;

    var children = getChildren(node.nodeid,nodes, treelinks);

    children.forEach(function(child) {
      calculateFinalPositions(child, modsum);
    });

    if (children.length == 0) {
        node.width = node.positionX;
        node.height = node.positionY;
    } else {
      //node.width = children.OrderByDescending(p => p.Width).First().width;
      node.width = orderByDescendingWidth(children)[0].width;
      node.height = orderByDescendingWidth(children)[0].height;
    }

  } // end function

  //TODO: orders nodelist by width, returns ordered list
  function orderByDescendingWidth(children) {
    return children;
  }

  //https://rachel53461.wordpress.com/2014/04/20/algorithm-for-drawing-trees/
  function calcInitNodeY(node) {
    //if (node.domain == "B")
    //  console.log("Calculating Initial Positions for node:", node.name);
    //console.log("lvlnode:",node);
    var children = getChildren(node.nodeid,nodes, treelinks);
    //console.log("children:", children);
    children.forEach(function(child) {
      //console.log("child:",child);
      calcInitNodeY(child);
    });


    var prevSibling = getPrevSibling(node);
    //console.log("prevSibling:", prevSibling);

    //if no children
    if (children.length == 0) {
      //if (node.domain == "B")
        //console.log("no children for node:", node.name);
      //if there is a previous sibling
      if (prevSibling) {
        //if (node.domain == "B")
          //console.log("has prevSibling");
        node.positionY = getPrevSibling(node).positionY + distY;
      } else { //if node is the first sibling/topmost node
        //if (node.domain == "B")
        //  console.log("no prevSiblings, set posY to 0");
        node.positionY = 0;
      }
      //if (node.domain == "B")
      //  console.log("set positionY to:", node.positionY);
    } //end if no children
    else if (children.length == 1){
      //console.log("1 child code.. ");
      // if this is the first node in a set, set it's X value equal to it's child's X value

      if (!prevSibling) {
        //node.positionY = 0;
        node.positionY = children[0].positionY;
        //console.log("positionY set to ", node.positionY);
      } else {
        node.positionY = prevSibling.positionY + distY;
        //console.log("positionY set to ", node.positionY);
        //node.mod = children[0].positionY;
        node.mod = node.positionY - children[0].positionY;
        //console.log("mod changed to:", node.mod);
      }
    } //end if one child
    else { //if more than one child
      //if (node.domain == "B")
        //console.log("more than one child of node:", node.name);

      //console.log("Several children code.. ", node);
      var leftChild = getLeftMostChild(node);
      var rightChild = getRightMostChild(node);
      var mid = (leftChild.positionY + rightChild.positionY) / 2;

      /*if (node.domain == "B") {
        console.log("leftmost child: ",leftChild);
        console.log("rightmost child: ",rightChild);
        console.log("mid: ",mid);
      } */

      //console.log("prevSibling:", prevSibling);

      if (!prevSibling) { //if node is leftmost(upmost)
        //console.log("no previous siblings for node:", node.name);
        node.positionY = mid;
        //console.log("positionY set to ", node.positionY);
      } else {
        node.positionY = prevSibling.positionY + distY;
        //console.log("positionY set to ", node.positionY);
        node.mod = node.positionY - mid;
        //console.log("set positionY to:", node.positionY);
        //console.log("set mod to:", node.mod);
      }
    } //end if several children

    /*if (node.Children.Count > 0 && !node.IsLeftMost())
    {
        // Since subtrees can overlap, check for conflicts and shift tree right if needed
        CheckForConflicts(node);
    }*/
    // Since subtrees can overlap, check for conflicts and shift tree right if needed
    if (children.length > 0 && prevSibling != null)
      checkForConflicts(node);

  } //end function

  function checkForConflicts(node) {
    //console.log("Checking for conflicts ....", node);
    var minDistance = distY;
    var shiftValue = 0;

    var nodeContour = {}; //create new dictionary
    nodeContour = getLeftContour(node, 0, nodeContour);

    var sibling = getLeftMostSibling(node);
    //console.log("LeftMostSibling:", sibling);

    while (sibling != null && sibling != node) {
      var siblingContour = {};
      siblingContour = getRightContour(sibling, 0, siblingContour);

      /*console.log("nodeContour:", nodeContour);
      console.log("siblingContour:", siblingContour);*/

      var siblingkeysmax = Object.keys(siblingContour).reduce(function(a, b){ return siblingContour[a] > siblingContour[b] ? a : b });
      var nodekeysmax = Object.keys(nodeContour).reduce(function(a, b){ return nodeContour[a] > nodeContour[b] ? a : b });

      /*console.log("siblingkeysmax:", siblingkeysmax);
      console.log("nodekeysmax:", nodekeysmax);
      console.log("init level:", node.positionX + distX);*/
      //for (var level = node.positionX + distX; level <= Math.min(siblingkeysmax, nodekeysmax); level++) {
      for (var level = node.positionX + distX; level <= siblingkeysmax; level++) {
        //console.log("level:", level);
        var distance = nodeContour[level] - siblingContour[level];
        if (distance + shiftValue < minDistance)
            shiftValue = minDistance - distance;
      }

      if (shiftValue > 0) {
           node.positionY += shiftValue;
           node.mod += shiftValue;

           centerNodesBetween(node, sibling);

           shiftValue = 0;
       }

       sibling = getNextSibling(sibling);

    } //end while
  } //end function

  function centerNodesBetween(leftNode, rightNode) {
    //var leftIndex = leftNode.Parent.Children.IndexOf(rightNode);
    var leftParent = getParent(leftNode.nodeid, nodes, treelinks);
    //var rightParent = getParent(rightNode.nodeid, nodes, treelinks);
    var leftParentChildren = getChildren(leftParent.nodeid, nodes, treelinks);
    //var rightParentChildren = getChildren(rightParent.nodeid, nodes, treelinks);
    var leftIndex = leftParentChildren.indexOf(rightNode);
    var rightIndex = leftParentChildren.indexOf(leftNode);

    var numNodesBetween = (rightIndex - leftIndex) - 1;

    if (numNodesBetween > 0) {
      var distanceBetweenNodes = (leftNode.positionY - rightNode.positionY) / (numNodesBetween + 1);
      var count = 1;
      for (var i = leftIndex + 1; i < rightIndex; i++){
        var middleNode = leftParentChildren[i];

        var desiredX = rightNode.positionY + (distanceBetweenNodes * count);
        var offset = desiredX - middleNode.positionY;
        middleNode.positionY += offset;
        middleNode.mod += offset;

        count++;
      }
      checkForConflicts(leftNode);
    }
  } //end function

  function checkAllChildrenOnScreen(node) {
    //console.log("Checking all children on screen ....", node);
    var nodeContour = {}; //create new dictionary
    nodeContour = getLeftContour(node, 0, nodeContour);
    //console.log("nodeContour:", nodeContour);

    var shiftAmount = 0;

    for (var key in nodeContour) {
        if (nodeContour.hasOwnProperty(key)) {
          // do stuff
          if (nodeContour[key] + shiftAmount < 0)
            shiftAmount = (nodeContour[y] * -1);
        }
    }

    if (shiftAmount > 0) {
        node.positionY += shiftAmount;
        //console.log("positionY set to ", node.positionY);
        node.mod += shiftAmount;
    }
    /*var nodeContour = new Dictionary<int, float>();
    GetLeftContour(node, 0, ref nodeContour);
    float shiftAmount = 0;
    foreach (var y in nodeContour.Keys)
    {
        if (nodeContour[y] + shiftAmount < 0)
            shiftAmount = (nodeContour[y] * -1);
    }

    if (shiftAmount > 0)
    {
        node.X += shiftAmount;
        node.Mod += shiftAmount;
    }
    */
  }

  function getLeftMostSibling(node) {

    var parentNode = getParent (node.nodeid, nodes, treelinks);
    return getLeftMostChild(parentNode);
  }

  function getLeftContour(node, modsum, values) {

    //  console.log("getLeftContour for node:", node);
    //if values has key node.positionX
    //console.log("     values.hasOwnProperty(",node.positionX, ") = ", values.hasOwnProperty(node.positionX));
    if (!values.hasOwnProperty(node.positionX)){
      //console.log("   no key..")
      //console.log("    node.positionY:",node.positionY, " + modsum:", modsum);
      values[node.positionX] = node.positionY + modsum;
    } else {
      /*console.log("    key exists, get minimim between");
      console.log("    values[node.positionX]:",values[node.positionX]);
      console.log("    and node.positionY:",node.positionY, " + modsum:", modsum);*/
      values[node.positionX] = Math.min(values[node.positionX], node.positionY + modsum);
    }

    //console.log("values after:", values);

    modsum += node.mod;

    var children = getChildren(node.nodeid,nodes, treelinks);

    children.forEach(function(child) {
      getLeftContour(child, modsum, values);
    });
    return values;
    /*if (!values.ContainsKey(node.Y))
        values.Add(node.Y, node.X + modSum);
    else
        values[node.Y] = Math.Min(values[node.Y], node.X + modSum);

    modSum += node.Mod;

    foreach (var child in node.Children)
     {
         GetLeftContour(child, modSum, ref values);
     }
    */
  } //end function

  function getRightContour(node, modsum, values) {
    //if values has key node.positionX
    if (!values.hasOwnProperty(node.positionX)){
      values[node.positionX] = node.positionY + modsum;
    } else {
      values[node.positionX] = Math.max(values[node.positionX], node.positionY + modsum);
    }

    //console.log("values after:", values);

    modsum += node.mod;

    var children = getChildren(node.nodeid,nodes, treelinks);

    children.forEach(function(child) {
      getRightContour(child, modsum, values);
    });
    return values;
  } //end function

  function getLeftMostChild(node) {
    //console.log("getLeftMostChild for node :", node);
    var children = getChildren(node.nodeid,nodes, treelinks);
    //console.log("first(leftmost) child :", children[0]);
    return children[0];
  }

  function getRightMostChild(node) {
    var children = getChildren(node.nodeid,nodes, treelinks);
    return children[children.length-1];
  }

  //get previous sibling
  function getPrevSibling(node) {

    //console.log("getPrevSibling function for node...", node.name);
    var parentNode = getParent (node.nodeid, nodes, treelinks);
    //console.log("   parentNode:", parentNode);
    if (parentNode) {
      var siblings =  getChildren (parentNode.nodeid, nodes, treelinks);
      //console.log("siblings:", siblings);
      var nodeindex = siblings.indexOf(node);
      if (nodeindex == 0) //it means that it is the topmost sibling
        return null;
      else {
        return siblings[nodeindex - 1];
      }
    }
  }

  function getNextSibling(node) {
    var parentNode = getParent (node.nodeid, nodes, treelinks);
    //console.log("parentNode:", parentNode);
    if (parentNode) {
      var siblings =  getChildren (parentNode.nodeid, nodes, treelinks);
      //console.log("siblings:", siblings);
      var nodeindex = siblings.indexOf(node);
      if (nodeindex == siblings.length-1) //it means that it is the rightmost/lowest sibling
        return null;
      else {
        return siblings[nodeindex + 1];
      }
    }
  }

  //takes an array of nodes as an input, returns the maximum level for that array
  function getMaxLevels(domainObj) {
    //console.log("maxlevel domainnodes:", domainObj.nodes);
    var nodes = domainObj.nodes;
    maxlevel = nodes[0].level;
    for (j = 0; j < nodes.length; j++) {
      if (nodes[j].level > maxlevel)
        maxlevel = nodes[j].level;
    }
    return maxlevel;
  }
  //TODO: check tracking from Requirements to Structure - does not track till the end

  //https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
  function shuffleArray(a) {
      var j, x, i;
      for (i = a.length - 1; i > 0; i--) {
          j = Math.floor(Math.random() * (i + 1));
          x = a[i];
          a[i] = a[j];
          a[j] = x;
      }
      return a;
  }

  function getAvgPositionY(children) {
		sum = 0;
		//for each child in children
		for (j = 0; j < children.length; j++) {
			child = children[j];
			//console.log("child: ", child.name, "posY:", child.positionY);
			sum = sum + child.positionY;
		}
		avg = sum / children.length;
		//console.log("average posY: ", avg);
		return avg
	}

	function getDomainLevelSize(domain,level,domarray) {
		var result = 0;
		for (var j = 0; j < domarray.length; j++) {
			if (domain == domarray[j].name) {
				//iterate within that domain and count how many nodes are there at that level
				for (var k = 0; k < domarray[j].nodes.length; k++) {
					if (level == domarray[j].nodes[k].level) {
						result = result + 1;
					}
				}
			}
		}
		//console.log("domain:", domain, "level:", level, "number of nodes: ", result);
		return result;
	}

	function getDomainElement(domain,domarray) {
		for (var j = 0; j < domarray.length; j++) {
			if (domain == domarray[j].name) {
				//iterate within that domain and count how many nodes are there at that level
					//console.log("return:", domarray[j]);
					return domarray[j];
			}
		}
	} //end function

	//given domain element and needed nodeID, returns index for that nodeID in the domain.nodes array
	function getNodeIndex(nodeid,domainelement) {
		//console.log("domainelement.nodes:", domainelement.nodes);
		for (var j = 0; j < domainelement.nodes.length; j++) {
			//console.log("domainelement.nodes[j].id:", domainelement.nodes[j].nodeid, "nodeid:", nodeid);
			if (nodeid == domainelement.nodes[j].nodeid) {
				//iterate within that domain and count how many nodes are there at that level
					//console.log("return nodeindex:", j);
					return j;
			}
		}
	} //end function

	// define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
	var zoomListener = d3.behavior.zoom()
																.scaleExtent([0.1, 3])
																.on("zoom", zoom);

	/*//get current trial number
	var curTrialCounter = document.getElementById('tempStorage').innerHTML;

	console.log("curTrials:", curTrialCounter);*/
	// define the baseSvg, attaching a class for styling and the zoomListener
	var baseSvg = d3.select("#tree-container").append("svg")
			.attr("width", viewerWidth)
			.attr("height", viewerHeight - 50)
			.attr("class", "overlay")
      .call(zoomListener);
			//.attr("transform", "translate(" + 150 + "," + 150 + ")")


  baseSvg.on("dblclick.zoom", null);

	// Append a group which holds all nodes and which the zoom Listener can act upon.
	var svgGroup = baseSvg.append("g")
												.attr("id", "svgGroup");


	function zoom() {
			svgGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
      console.log("zoom event triggered..");
			//baseSvg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
	}

	svgGroup.attr("transform","translate(25,50)scale(.7,.7)");

  /*svgGroup.append("div")
          .attr("id", "infodiv");*/


	/*baseSvg.call(zoom.on("zoom",zoomListener))
           //.append("svg:g")
           .attr("transform","translate(100,50)scale(.5,.5)");*/

	var radius = 10;

	var distY = 30;
	var distX = 170; //separation between levels within one domain



	//MAIN FLOW STARTS HERE
	var domarray = getDomainArray();

	console.log('domainarray:', domarray);

	calcDomainPositionsX(domarray);

	//calcDomainPositionsY(domarray);

	var sortedDomarray = sortDomainArray(domarray);

	console.log("sorted domarray:", sortedDomarray);

	calcNodePositionsY(sortedDomarray);

	//requirements to data:WHY?
	//-nodes sorted by level, starting from lowest levels
	//in the file, nodes have to be sorted by ids, because id is assigned sequentially

	//DOMAIN LABELS
	var hsep = 50; //horizontal separation between levels within one domain
	const domainLabelsY = -50;
	var domainLabelElem = svgGroup.selectAll("g domainLabels")
												.data(sortedDomarray)

	var domainLabelElemEnter = domainLabelElem.enter()

	domainLabelElemEnter.append("text")
	.attr("dx", function(d, i) {
			//return viewerWidth - hsep*(maxlevel - d.level);
			var domain = d.domain;
			var level = d.level;
			var domainstartX = d.startX;
			//console.log("Label Enter D:",d);
			//console.log("maxlevel + hsep:",d.maxlevel," + ", hsep);
			//d.positionX = viewerWidth - domainstartX - hsep*(domainmaxlevel - nodelevel);
			return domainstartX + d.maxlevel * hsep;
			//console.log("domainstartX:",  domainstartX, "posX:",  d.positionX );
	})
	.attr("dy", domainLabelsY)
	.attr("class", "domainLabels")
	.text(function(d){
			//return d.name + " pos:" + d.positionY + " spaceY:" + d.spaceY})
			return d.name })
	.attr("stroke", "black")
	.attr("stroke-width", 1)
	.style("text-transform", "uppercase")
	.style("font-size", 24);
	/*.attr("id", function(d, i) {
			return d.nodeid
	})
	.attr("class", "labels")
	.text(function(d){
			//console.log(d);
			//return d.name + " pos:" + d.positionY + " spaceY:" + d.spaceY})
			return d.name })
	.attr("stroke", "black")
	.attr("stroke-width", 1);*/

	var elem = svgGroup.selectAll("g circles")
			.data(nodes)

	/*Create and place the "blocks" containing the circle and the text */
	var elemEnter = elem.enter()
			//.attr("transform", function(d){return "translate("+d.x+",80)"})



	//console.log(nodes);
	maxlevel = 5;
	var lvl1counter = 0;

  //var lastPosX = 0;
  //var lastPosY = 0;



			//http://bl.ocks.org/timpulver/d3fefb4fac2510cf81a8
		function clickcancel() {
				var event = d3.dispatch('click', 'dblclick');

				function cc(selection) {
					//console.log(selection);
					var down,
					tolerance = 5,
					last,
					wait = null;
					// euclidean distance
					function dist(a, b) {
						return Math.sqrt(Math.pow(a[0] - b[0], 2), Math.pow(a[1] - b[1], 2));
					}
					selection.on('mousedown', function() {
						down = d3.mouse(document.body);
						last = +new Date();
					});
					selection.on('mouseup', function() {
						if (dist(down, d3.mouse(document.body)) > tolerance) {
							return;
						} else {
							if (wait) {
								window.clearTimeout(wait);
								wait = null;
								event.dblclick(d3.event);
							} else {
								wait = window.setTimeout((function(e) {
									return function() {
										event.click(e);
										wait = null;
									};
								})(d3.event), 300);
							}
						}
					});
				};
				return d3.rebind(cc, event, 'on');
		}

		var cc = clickcancel();

		var circle = elemEnter.append("circle")
		.attr("class", "nodes")
		.attr("id", function(d, i) {
			return i
		})
		.attr("cx", function(d, i) {
			//DOMAINS - WORK HERE
			//console.log("posX:",viewerWidth, hsep*d.level);
			//d.positionX = viewerWidth - hsep*(maxlevel - d.level);
			nodedomain = d.domain;
			nodelevel = d.level;
			domainstartX = getDomainElement(nodedomain,domarray).startX;
			domainmaxlevel = getDomainElement(nodedomain,domarray).maxlevel;
			//d.positionX = viewerWidth - domainstartX - hsep*(domainmaxlevel - nodelevel);

			//console.log("domainstartX:",  domainstartX, "posX:",  d.positionX );
			return d.positionX;
		})
		.attr("cy", function(d, i) {
			d.children = getChildren(i, nodes, treelinks);
			d.parent = getParent(i, nodes, treelinks);
			return d.positionY;

		})
		.on("mouseover", handleMouseOver) //http://bl.ocks.org/WilliamQLiu/76ae20060e19bf42d774
		.on("mouseout", handleMouseOut)
		.call(cc)
		//.on("dbclick",handleDoubleClick)
		//.on("click", handleMouseClick)
		.attr("r", radius)
		.attr("fill", "lightsteelblue")
		.attr("stroke", "steelblue")
		.attr("stroke-width", function(d) {
			return d/2;
		})
		;

		cc.on('click', handleMouseClick); //in this case not data, but mouseevent is passed
		cc.on('dblclick', handleDoubleClick); //in this case not data, but mouseevent is passed

		//http://bl.ocks.org/WilliamQLiu/76ae20060e19bf42d774
		// Create Event Handlers for mouse
		function handleMouseClick(d, i) {
			console.log("mouse click event:", d);

      var clickedElem = d3.select(d.srcElement);
    	var clickedElemData = clickedElem.data()[0];
    	console.log("clicked object:", clickedElemData);

      var infodiv = document.getElementById("infodiv");

      /*var fs = require('fs');
      var files = fs.readdirSync('./files/structure/');*/

      //console.log(files);

      d3.selectAll(".infoimg").remove();

      var p = document.createElement('p');
      p.textContent = clickedElemData.name;
      p.setAttribute("class","infoimg");

      switch(clickedElemData.level) {
        case 3:
        var filename = "./files/" + clickedElemData.domain + "/" + clickedElemData.name + ".jpg";
        var infoimg = document.createElement('img');
        infoimg.setAttribute("class","infoimg");
        infoimg.src = filename;
        infoimg.width = 300;
        infoimg.height = 300;
        infodiv.appendChild(p);
        infodiv.appendChild(infoimg);
        break;
        case 2:
        var filename = "./files/" + clickedElemData.domain + "/" + clickedElemData.name + " ibd.png";
        var infoimg = document.createElement('img');
        infoimg.setAttribute("class","infoimg");
        infoimg.src = filename;
        infoimg.width = 300;
        infoimg.height = 300;
        infodiv.appendChild(p);
        infodiv.appendChild(infoimg);
        break;

      }

		}

		function handleMouseOver(d, i) {  // Add interactivity

					//get nodeid = i, index in the nodes list from json
					//console.log(d, "index:", i, "tracingDictFull:", tracingDictFull[i]);

					//find all nodes that share traces with the current node
					//WE USE OTHER VARIANT HERE FOR TRACINGDICTTWO
					//curtrace = getNodeIDsFromTraceArray(tracingDictFull[i], nodes);
					curtrace = tracingDictFull[i];
          console.log("tracingDictFull[i]:", tracingDictFull[i]);
					//curtracetwo = getNodeIDsFromTrace(tracingDictFullTwo[i]);
					/*console.log("curtrace:", curtrace);
					console.log("curtracetwo:", curtracetwo);
					console.log("tracingDictFull[i]:", tracingDictFull[i]);
					console.log("tracingDictFullTwo[i]:", tracingDictFullTwo[i]);
					console.log("sortedTracingDictFullTwo[i]:", sortedTracingDictFullTwo[i]);*/
					//var fulltrace = getFullTracingDict([13,47]);

					//find nodes from trace, highlight them
					svgGroup.selectAll(".nodes")
									.filter(function(d,i){
										//return d3.select(this).attr('id') > 4;
										//console.log("selected:", d);
										currentID = d3.select(this).attr('id');
										//console.log("currentID:", currentID);
										return curtrace.indexOf(currentID) != -1; //add to selection only if the id of the current node is in the tracelist for the clicked node
										})
									.attr("fill", function(d) {
											if (d3.select(this).attr('fill') == "red") {
												return "red";
											} else {
												return "orange";
											}
										});
						//r: radius * 2

					//find edges where source and target are both in tracingDict[i]
					svgGroup.selectAll(".edges")
									.filter(function(d,i){
										//console.log("filtering edges...");
										edgeSource = d3.select(this).attr('source');
										edgeTarget = d3.select(this).attr('target');
										//return (curtrace.indexOf(parseInt(edgeSource)) != -1 && curtrace.indexOf(parseInt(edgeTarget)) != -1);
										return (curtrace.indexOf(edgeSource) != -1 && curtrace.indexOf(edgeTarget) != -1);
									})
									.attr({
									stroke: "orange"
					});

					//IMPLEMENT DOMAINS, ENABLE TRACEBILITY BETWEEN DOMAINS

				}

	  function handleMouseOut(d, i) {
			// Use D3 to select element, change color back to normal
			/*d3.select(this).attr({
				fill: "lightsteelblue",
				r: radius
			});*/ //THIS IS FOR ONE, CURRENT ELEMENT ONLY
			//find nodes from trace, highlight them
			svgGroup.selectAll(".nodes")
			.attr("fill", function(d) {
					if (d3.select(this).attr('fill') == "red") {
						return "red";
					} else {
						return "lightsteelblue";
					}
				});

			svgGroup.selectAll(".edges").attr({
				stroke: "lightsteelblue"
			});

			// Select text by id and then remove
			//d3.select("#t" + d.x + "-" + d.y + "-" + i).remove();  // Remove text location
		}

	//Collapse on click
	//http://bl.ocks.org/d3noob/8375092
	//when collapse - store children before collapsing to _children field
	//when expand - bring back children from _children
	function handleDoubleClick(d, i) {
  	// THIS IS FROM THE ORIGINAL VERSION, REMOVED FOR MTURK PURPOSES
  	var ddata = d3.select(d.srcElement).data()[0];
  	console.log("clicked object:", ddata);
  	if (!ddata.collapsed)
  		collapse(ddata);
  	else
  		decollapse(ddata);

} //end function handleMouseClick

  function collapse(nodeSelection) {
  	//console.log("current nodeSelection: ", nodeSelection);
  		if (nodeSelection.children) {
  			nodeSelection._children = nodeSelection.children;
  			nodeSelection._children.forEach(collapse);
  			nodeSelection._children.forEach(hideInParent);
  			nodeSelection.children = null;
  			nodeSelection.collapsed = true;
  		}
  }

  function decollapse(nodeSelection) {
  	//console.log("decollapse");
  	//console.log("current nodeSelection: ", nodeSelection, "collapsed", nodeSelection.collapsed);
  		if (nodeSelection._children) {
  			nodeSelection.children = nodeSelection._children;
  			nodeSelection.children.forEach(decollapse);
  			nodeSelection.children.forEach(setCoordsToPrevPos);
  			nodeSelection._children = null;
  			nodeSelection.collapsed = false;
  		}
  }

  function setCoordsToPrevPos(nodeSelection) {
  	//console.log("set coordinates to previous position");

  	//bring back nodes to the last saved position
  	var currentNodeSelection =  svgGroup.selectAll(".nodes")
  					.filter(function(d,i){
  						return d.nodeid == nodeSelection.nodeid;
  					})

  	lastPosX = currentNodeSelection.attr("lastPosX");
  	lastPosY = currentNodeSelection.attr("lastPosY");

  	console.log("lastPosX:", lastPosX);
  	console.log("lastPosY:", lastPosY);

  	currentNodeSelection.attr("fill", "lightsteelblue")
  											.attr("cx", lastPosX)
  											.attr("cy", lastPosY)
  											.transition();

  	currentNodeSelection.transition()
  											.attr("visibility", "visible");

  	var labelSelection = svgGroup.selectAll(".labels")
  																				.filter(function(d,i){
  																				return d.nodeid == nodeSelection.nodeid;
  																				//console.log("currentID:", currentID, " is in children:", openChildrenIDs.indexOf(currentID.toString()) );
  																		})
  																			 .attr("visibility", "visible");

  	//hide edges - choose all paths where "target" attribute is within openChildrenIDs
  	 var edgeChildrenSelection = svgGroup.selectAll(".edges")
  																			 .filter(function(d,i){
  																					 currentTarget = d3.select(this).attr('target');
  																					 //console.log("currentTarget:", currentTarget, " is in children:", openChildrenIDs.indexOf(currentTarget.toString()) );
  																					 return currentTarget == nodeSelection.nodeid;
  																			 })
  																			 .attr("visibility", "visible");

  }

  function hideInParent(nodeSelection) {
  	//
  	//console.log("hideInParent", nodeSelection);
  	//get parent nodes coordinates
  	var parentSelection = svgGroup.selectAll(".nodes")
  					.filter(function(d,i){
  						currentID = parseInt(d3.select(this).attr('id'));
  						//console.log("currentID:", currentID, " parentID:", nodeSelection.parent.nodeid);
  						return currentID == nodeSelection.parent.nodeid;
  					});

  	//console.log("parentSelection: ",parentSelection);
  	var parentCX = parentSelection.attr("cx");
  	var parentCY = parentSelection.attr("cy");

  	//set their coordinates to parent coordinates
  	var currentNodeSelection =  svgGroup.selectAll(".nodes")
  					.filter(function(d,i){
  						return d.nodeid == nodeSelection.nodeid;
  					})

  	//console.log("currentNodeSelection: ",currentNodeSelection);

  	//save last position
  	var currentPosX = currentNodeSelection.attr("cx");
  	var currentPosY = currentNodeSelection.attr("cy");

  	console.log("currentPosX: ",currentPosX);
  	console.log("currentPosY: ",currentPosY);

  	/*currentNodeSelection.transition()
  											.attr("cx", parentCX)
  											.attr("cy", parentCY)
  											.attr("lastPosX", currentPosX)
  											.attr("lastPosY", currentPosY); */

  	currentNodeSelection.attr("lastPosX", currentPosX)
  	.attr("lastPosY", currentPosY)
  	.transition()
  	.attr("cx", parentCX)
  	.attr("cy", parentCY);


  	currentNodeSelection.transition()
  										.delay(100)
  										.attr("visibility", "hidden");
  	//                    .transition();

   //hide labels
   var labelSelection = svgGroup.selectAll(".labels")
  																			 .filter(function(d,i){
  																			 return d.nodeid == nodeSelection.nodeid;
  																			 //console.log("currentID:", currentID, " is in children:", openChildrenIDs.indexOf(currentID.toString()) );
  																	 })
  																			.attr("visibility", "hidden");

   //hide edges - choose all paths where "target" attribute is within openChildrenIDs
  	var edgeChildrenSelection = svgGroup.selectAll(".edges")
  																			.filter(function(d,i){
  																					currentTarget = d3.select(this).attr('target');
  																					//console.log("currentTarget:", currentTarget, " is in children:", openChildrenIDs.indexOf(currentTarget.toString()) );
  																					return currentTarget == nodeSelection.nodeid;
  																					//return currentTarget == 63;
  																			})
  																			.attr("visibility", "hidden");
  }

	//DRAWING EDGES
		//http://bl.ocks.org/milkbread/5902470
		treelinks.forEach(function(link){
				//console.log(link, link.source, nodes[link.source].name, nodes[link.source].positionX);
				var lineData = [ { "x": 1,   "y": 5},  { "x": 20,  "y": 20}];//arbitrary
				lineData[0].x = nodes[getNodeIndexByName(link.source)].positionX
				lineData[0].y = nodes[getNodeIndexByName(link.source)].positionY
				lineData[1].x = nodes[getNodeIndexByName(link.target)].positionX
				lineData[1].y = nodes[getNodeIndexByName(link.target)].positionY
				//console.log("lineData", lineData);

			 var diagonal = d3.svg.diagonal()
			 .projection(function(d) { return [d.y, d.x]; });

//https://github.com/d3/d3-shape/issues/27
			 function linkHorizontal(d) {
				 return "M" + d[0].x + "," + d[0].y
		+ "C" + d[0].x +  "," + (d[0].y + d[1].y) / 2
		+ " " + d[1].x + "," + (d[0].y + d[1].y) / 2
		+ " " + d[1].x + "," + d[1].y;
			}

			function linkVertical(d) {
				return "M" + d[0].x + "," + d[0].y
						+ "C" + (d[0].x + d[1].x) / 2 + "," + d[0].y
						+ " " + (d[0].x + d[1].x) / 2 + "," + d[1].y
						+ " " + d[1].x + "," + d[1].y;
			}

			 var lineGraph = elemEnter.append("path")
																	 .attr('d', linkVertical(lineData)) //THIS IS BEING TESTED
																	 //.attr("id", "source:" + link.source + "," + "target:" + link.target)
																	 .attr("source", getNodeIndexByName(link.source))
																	 .attr("target", getNodeIndexByName(link.target))
																	 .attr("class", "edges")
																	 .attr("stroke", "lightsteelblue")
																	 .attr("stroke-width", 1)
																	 .attr("fill", "none");

		}); //foreach

		//LABELS
		//https://stackoverflow.com/questions/13615381/d3-add-text-to-circle
		/* Create the text for each block */
		elemEnter.append("text")
		.attr("dx", function(d, i) {
				//console.log("Label Enter D:",d);
				//return viewerWidth - hsep*(maxlevel - d.level);
				nodedomain = d.domain;
				nodelevel = d.level;
				domainstartX = getDomainElement(nodedomain,domarray).startX;
				domainmaxlevel = getDomainElement(nodedomain,domarray).maxlevel;
				//d.positionX = viewerWidth - domainstartX - hsep*(domainmaxlevel - nodelevel);
				//console.log("domainstartX:",  domainstartX, "posX:",  d.positionX );
				return d.positionX + 5;
		})
		.attr("dy", function(d, i) {
				return d.positionY;
		})
		.attr("id", function(d, i) {
				return d.nodeid
		})
		.attr("class", "labels")
		.text(function(d){
				//console.log(d);
				//return d.name + ":" + d.nodeid})
				var returnstring = d.name;
				if (d.level == 1)
					returnstring = returnstring.toUpperCase();

				/*if (returnstring.length > 17)
					returnstring = returnstring.slice(0,17) + "\r\n" + returnstring.slice(17)
				*/
				return returnstring})
		.attr("stroke", "black")
    .attr("font-size", "20px")
		.attr("text-transform", "uppercase")
		.attr("stroke-width", 1);
});
