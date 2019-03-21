// Get JSON data from Habib and Komoto 2014
//treeJSON = d3.json("graph.json", function(error, json) {
treeJSON = d3.json("graph_beerrobot.json", function(error, json) {
    console.log("hi!");
    console.log(error);
    // size of the diagram
    var viewerWidth = $(document).width();
    var viewerHeight = $(document).height();

    // define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
    var zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3]).on("zoom", zoom);

    // define the baseSvg, attaching a class for styling and the zoomListener
    var baseSvg = d3.select("#tree-container").append("svg")
        .attr("width", viewerWidth)
        .attr("height", viewerHeight)
        .attr("class", "overlay")
        .call(zoomListener);

    // Append a group which holds all nodes and which the zoom Listener can act upon.
    var svgGroup = baseSvg.append("g");

    function zoom() {
        svgGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    var radius = 3;

    var nodes = json.nodes;
    var links = json.links;
    var traces = json.traces;

    //console.log("traces: ", traces);

    //add IDs to nodes
    for (j = 0; j < nodes.length; j++) {
      nodes[j].nodeid = j;
    }

    //console.log("nodes:", nodes);

    //returns a dictionary of domains, where dict["domain"] = nodes array for this domain
    /*function getDomainDict() {
      var domaindict = {};
      for (j = 0; j < nodes.length; j++) {
        if (nodes[j].domain in domaindict)
          domaindict[nodes[j].domain].push(nodes[j]);
        else {
          domaindict[nodes[j].domain] = [];
          domaindict[nodes[j].domain].push(nodes[j]);
        }
      } //end for loop
      //console.log("domaindict:", domaindict);
      return domaindict;
    } //end function*/

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
      console.log("inarray", domarray);
      var outarray = domarray;
        for (var j = 0; j < domarray.length; j++) {
          var domnodes = domarray[j].nodes;
          //create array with maxlevel number of dimensions
          var maxlvl = domarray[j].maxlevel;

          var resultarray = createNDimArray([maxlvl,1]);
          console.log("resultarray:", resultarray);
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

      //assign startY to level 1 nodes
      for (var j = 0; j < domarray.length; j++) {
        var level1nodes = 0;

        for (var k = 0; k < domarray[j].nodes.length; k++) {
          if (domarray[j].nodes[k].level == 1) {
            //count level 1 nodes for this domain
            level1nodes = level1nodes + 1;
          }
        }

        for (var k = 0; k < domarray[j].nodes.length; k++) {
          if (domarray[j].nodes[k].level == 1) {
            //spaceY - is a height available for each nodes descendants
            domarray[j].nodes[k].spaceY = viewerHeight / level1nodes;
          }
        }
      }

      console.log("domarray final:", domarray);
    }//end function


    function calcNodePositionsY(domarray) {
      //nodeposY for first level = viewerHeight / nodeslength for that level and that domain
      //nodeposY for next levels = parent.spaceY / nodeslength for that level
      //where parent.spaceY - height available for that parent
      console.log("Calculating Y positions for nodes...");
      for (var j = 0; j < domarray.length; j++) {
        var domainmaxlevel = domarray[j].maxlevel;
        //console.log("domain name:", domarray[j].name, "domain maxlevel:", domainmaxlevel );
        //for each level, for each node assign spaceY
        for (var level = 0; level < domainmaxlevel; level++) {
          //console.log("domarray[j]", domarray[j], "j:", j);
          var lvlnodes = domarray[j].nodes[level];
          var siblingsLength = lvlnodes.length;
          //console.log("level:", level, "lvlnodes", lvlnodes);
          for (var k = 0; k < lvlnodes.length; k++) {
            var parentNode = getParent(lvlnodes[k].nodeid, nodes, links);
            console.log("node:", lvlnodes[k]);
            console.log("parent:", parentNode);
            if (parentNode) {
              var siblings = getChildren(parentNode.nodeid, nodes, links);
              var nodeindex = siblings.indexOf(lvlnodes[k]);
              lvlnodes[k].spaceY = parentNode.spaceY / siblings.length;
              lvlnodes[k].positionY = parentNode.positionY + nodeindex * lvlnodes[k].spaceY / 2;
            } else { //if first level
              //console.log("first level...");
              lvlnodes[k].spaceY = viewerHeight / lvlnodes.length;
              lvlnodes[k].positionY = k * lvlnodes[k].spaceY;
            }
            //lvlnodes[k].spaceY = localHeight / lvlnodes.length;
            //get siblins - children of a parent
            console.log("node:",lvlnodes[k], "lvlnodes[k].positionY:", lvlnodes[k].positionY);
          }
        }
      }
      console.log("domarray after spaceY:", domarray)
    }// end function

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

    var domarray = getDomainArray();

    calcDomainPositionsX(domarray);

    var sortedDomarray = sortDomainArray(domarray);

    console.log("sorted domarray:", sortedDomarray);

    calcNodePositionsY(sortedDomarray);

    //console.log("domarray after calcdomposit: ", domarray);
    var tracingDict = getTracingDict();

    //TRACING
    function getTracingDict () { //create a dict, where key = nodeID, value = list of connected nodes from traces
    resultlist = [];
      for (j = 0; j < nodes.length; j++) {
        node = nodes[j];
        resultlist[j] = "";
        for (k = 0; k < traces.length; k++) {
          tracenodes = traces[k].nodeids.split(",");
          //if tracenodes contain nodeid (index j), then add all other nodeids to the list of nodes for this nodeid
          if (tracenodes.indexOf(j.toString()) != -1) {
            currentitem = resultlist[j];
            //console.log(currentitem);
            //merge lists, unique values
            merged = tracenodes.concat(currentitem);
            unique = merged.filter((v, i, a) => a.indexOf(v) === i); //https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
            resultlist[j] = unique;
            //console.log("j: ", j, " - trace:", tracenodes, " - list:", resultlist[j]);
          }
        }
      }
      //console.log("resultlist: ", resultlist);
      return resultlist;
    }
    //requirements to data:WHY?
    //-nodes sorted by level, starting from lowest levels
    //in the file, nodes have to be sorted by ids, because id is assigned sequentially


    var elem = svgGroup.selectAll("g circles")
        .data(nodes)

    /*Create and place the "blocks" containing the circle and the text */
    var elemEnter = elem.enter()
        //.attr("transform", function(d){return "translate("+d.x+",80)"})

    function getChildren(nodeindex, nodes, links) {
    //Given a node index, returns a list of children for this node
        //go through each link
          //if link.source == nodeindex
            //check level of nodes[link.target]
            //- if level is lower than current node (nodes[nodeindex]), then add to the children list
          //if link.target == nodeindex
            //check level of nodes[link.source] - if level is lower than current node (nodes[nodeindex]), then add to the children list
        children = [];
        //console.log("current node", nodes[nodeindex].name);
        for (var j = 0; j < links.length; j++) {
          link = links[j];
          //console.log(link);
          source = link.source;
          target = link.target;
          if (nodes[target].domain == nodes[nodeindex].domain && nodes[source].domain == nodes[nodeindex].domain) {
            if (source == nodeindex) {
              //console.log(nodeindex,nodes[nodeindex].name, nodes[target].name, nodes[target].level);
              if (nodes[target].level > nodes[nodeindex].level)
                //put into children list
                children.push(nodes[target]);
            }//if
            if (target == nodeindex) {
              /*console.log("nodeindex:",nodeindex);
              console.log("nodes:",nodes);
              console.log("nodes[nodeindex].name",nodes[nodeindex].name);
              console.log("nodes[source].name",nodes[source].name);
              console.log(nodeindex,nodes[nodeindex].name, nodes[source].name, nodes[source].level);
              */
              if (nodes[source].level > nodes[nodeindex].level)
                //put into children list
                children.push(nodes[source]);
            }//if
          }
        }//for loop
        //console.log("number of children", children.length);
        return children
    }//function

    function getParent(nodeindex, nodes, links) {
      //console.log("nodes:", nodes);
      var parent = null;
      for (j = 0; j < links.length; j++) {
        link = links[j];
        source = link.source;
        target = link.target;
        if (source == nodeindex) {
          //console.log(link);
          //console.log(nodeindex,nodes[nodeindex].name, nodes[target].name, nodes[target].level);
          if (nodes[target].level < nodes[nodeindex].level)
            //put into children list
            parent = nodes[target];
            //console.log("node: ", nodes[nodeindex], "target: ", nodes[target]);
        }//if
        if (target == nodeindex) {
          //console.log(link);
          //console.log(nodeindex,nodes[nodeindex].name, nodes[source].name, nodes[source].level);
          if (nodes[source].level < nodes[nodeindex].level)
            //put into children list
            parent = nodes[source];
            //console.log("node: ", nodes[nodeindex], "source: ", nodes[source]);
        }//if
      }//for loop

      return parent
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

    //console.log(nodes);
    maxlevel = 5;
    var lvl1counter = 0;
    var hsep = 200; //horizontal separation between levels within one domain
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
                                      d.positionX = viewerWidth - domainstartX - hsep*(domainmaxlevel - nodelevel);
                                      //console.log("domainstartX:",  domainstartX, "posX:",  d.positionX );
                                      return d.positionX;
                          })
                          .attr("cy", function(d, i) {
                            d.children = getChildren(i, nodes, links);
                            d.parent = getParent(i, nodes, links);
                            //console.log("nodes: ", nodes);
                            /*nodedomain = d.domain;
                            //domaindex =
                            nodelevel = d.level;
                            var children = getChildren(i, nodes, links);
                            //if lowest level, calculate sepY = viewerHeight / number of nodes
                            //OLD algorithm - has problems when lower level nodes are not ordered
                            d.positionY = d.spaceY * lvl1counter + 25;
                              lvl1counter++;
                            }*/

                            /*if (children.length > 0) {
                              console.log("has children:", children);
                              positionY = getAvgPositionY(children);
                              console.log("positionY:", positionY);
                            } else {
                              //console.log("no children:");
                              domainlevelsize = getDomainLevelSize(nodedomain, nodelevel, domarray);
                              sepY = viewerHeight / domainlevelsize;
                              //replace i below with index of that node in that level
                              domainelement = getDomainElement(nodedomain,domarray);
                              nodeindex = getNodeIndex(d.nodeid, domainelement);
                              positionY = (nodeindex * sepY) + 25
                            }*/
                            //console.log("d:", d, "children:", children, "positionY", d.positionY);
                            return d.positionY;

                          })
                          .on("mouseover", handleMouseOver) //http://bl.ocks.org/WilliamQLiu/76ae20060e19bf42d774
                          .on("mouseout", handleMouseOut)
                          .on("click", handleMouseClick)
                          .attr("r", radius)
                          .attr("fill", "lightsteelblue")
                          .attr("stroke", "steelblue")
                          .attr("stroke-width", function(d) {
                            return d/2;
                          });

      //http://bl.ocks.org/WilliamQLiu/76ae20060e19bf42d774
      // Create Event Handlers for mouse
      function handleMouseOver(d, i) {  // Add interactivity

            //get nodeid = i, index in the nodes list from json
            console.log(d, "index:", i, "trace:", tracingDict[i]);

            curtrace = tracingDict[i];

            //find nodes from trace, highlight them
            svgGroup.selectAll(".nodes")
                    .filter(function(d,i){
                      //return d3.select(this).attr('id') > 4;
                      //console.log("selected:", d);
                      currentID = d3.select(this).attr('id');
                      return curtrace.indexOf(currentID) != -1; //add to selection only if the id of the current node is in the tracelist for the clicked node
                      })
                    .attr({
              fill: "orange"
              //r: radius * 2
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
        svgGroup.selectAll(".nodes").attr({
          fill: "lightsteelblue",
          r: radius
        });

        // Select text by id and then remove
        //d3.select("#t" + d.x + "-" + d.y + "-" + i).remove();  // Remove text location
      }

    //Collapse on click
    //http://bl.ocks.org/d3noob/8375092
    //when collapse - store children before collapsing to _children field
    //when expand - bring back children from _children
    function handleMouseClick(d, i) {
      //console.log("test mouse click: ", d);
      /*if (d.children) {
        	d._children = d.children;
        	d.children = null;}
    else {
        	d.children = d._children;
        	d._children = null;
          }
    update(d);*/
    //collapseNode(d);
    if (!d.collapsed)
      collapse(d);
    else
      decollapse(d);

    /*

    //for each child:
      //find child node, set X to parent.X, set Y to parent.Y, hide label, hide edges
      //from all nodes, find child nodes of the clicked node
    var childrenSelection = svgGroup.selectAll(".nodes")
            .filter(function(d,i){
            currentID = d3.select(this).attr('id');
            console.log("currentID:", currentID, " is in children:", clickedChildrenIDs.indexOf(currentID.toString()) );
            return clickedChildrenIDs.indexOf(currentID) != -1;
    });

    //get parent nodes coordinates
    var parentSelection = d3.select(this);
    parentCX = parentSelection.attr("cx");
    parentCY = parentSelection.attr("cy");

    //now that we have the selection of children for the clicked node,
    //set their coordinates to parent coordinates
    childrenSelection.attr("fill", "green")
                     .transition()
                     .attr("cx", parentCX)
                     .attr("cy", parentCY);

    //hide labels
    var labelChildrenSelection = svgGroup.selectAll(".labels")
                                          .filter(function(d,i){
                                          currentID = d3.select(this).attr('id');
                                          console.log("currentID:", currentID, " is in children:", clickedChildrenIDs.indexOf(currentID.toString()) );
                                          return clickedChildrenIDs.indexOf(currentID) != -1;
                                      })
                                         .attr("visibility", "hidden");
    //hide edges - choose all paths where "target" attribute is within clickedChildrenIDs
     var edgeChildrenSelection = svgGroup.selectAll(".edges")
                                         .filter(function(d,i){
                                             currentTarget = d3.select(this).attr('target');
                                             console.log("currentTarget:", currentTarget, " is in children:", clickedChildrenIDs.indexOf(currentTarget.toString()) );
                                             return clickedChildrenIDs.indexOf(currentTarget) != -1;
                                         })
                                         .attr("visibility", "hidden");

    //var parentSelection = d3.select(this);

    //NOW IMPLEMENT DECOLLAPSING

    */
  } //end function handleMouseClick

  function collapse(nodeSelection) {
    console.log("current nodeSelection: ", nodeSelection);
      if (nodeSelection.children) {
        nodeSelection._children = nodeSelection.children;
        nodeSelection._children.forEach(collapse);
        nodeSelection._children.forEach(hideInParent);
        nodeSelection.children = null;
        nodeSelection.collapsed = true;
      }
  }

  function decollapse(nodeSelection) {
    console.log("decollapse");
    console.log("current nodeSelection: ", nodeSelection, "collapsed", nodeSelection.collapsed);
      if (nodeSelection._children) {
        nodeSelection.children = nodeSelection._children;
        nodeSelection.children.forEach(decollapse);
        nodeSelection.children.forEach(gotoPrevPos);
        nodeSelection._children = null;
        nodeSelection.collapsed = false;
      }
  }

  function gotoPrevPos(nodeSelection) {
    console.log("go to previous position");

    //bring back nodes to the last saved position
    var currentNodeSelection =  svgGroup.selectAll(".nodes")
            .filter(function(d,i){
              return d.nodeid == nodeSelection.nodeid;
            })

    lastPosX = currentNodeSelection.attr("lastPosX");
    lastPosY = currentNodeSelection.attr("lastPosY");

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
    console.log("hideInParent", nodeSelection);
    //get parent nodes coordinates
    var parentSelection = svgGroup.selectAll(".nodes")
            .filter(function(d,i){
              currentID = parseInt(d3.select(this).attr('id'));
              //console.log("currentID:", currentID, " parentID:", nodeSelection.parent.nodeid);
              return currentID == nodeSelection.parent.nodeid;
            });

    //console.log("parentSelection: ",parentSelection);
    parentCX = parentSelection.attr("cx");
    parentCY = parentSelection.attr("cy");

    //set their coordinates to parent coordinates
    var currentNodeSelection =  svgGroup.selectAll(".nodes")
            .filter(function(d,i){
              return d.nodeid == nodeSelection.nodeid;
            })

    //save last position
    currentPosX = currentNodeSelection.attr("cx");
    currentPosY = currentNodeSelection.attr("cy");

    currentNodeSelection.transition()
                        .attr("cx", parentCX)
                        .attr("cy", parentCY)
                        .attr("lastPosX", currentPosX)
                        .attr("lastPosY", currentPosY);


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
                                        })
                                        .attr("visibility", "hidden");
  }

    //DRAWING EDGES
      //http://bl.ocks.org/milkbread/5902470
      links.forEach(function(link){
          //console.log(link, link.source, nodes[link.source].name, nodes[link.source].positionX);
          var lineData = [ { "x": 1,   "y": 5},  { "x": 20,  "y": 20}];//arbitrary
          lineData[0].x = nodes[link.source].positionX
          lineData[0].y = nodes[link.source].positionY
          lineData[1].x = nodes[link.target].positionX
          lineData[1].y = nodes[link.target].positionY
          //console.log("lineData", lineData);

          /*var lineFunction = d3.svg.line.radial()
                                        //.interpolate("bundle")
                                        .angle(Math.PI/4)
                                        .radius(function(d) { return Math.sqrt(d.x * d.x + d.y * d.y); });
                                   /*.x(function(d) { return d.x; })
                                   .y(function(d) { return d.y; })
                                   .radius(function(d) { return Math.sqrt(d.x * d.x + d.y * d.y); })
                                   .interpolate("bundle");*/

      /*    function lineFunction(d) {
           var dx = d[1].x - d[0].x,
               dy = d[1].y - d[0].y,
               dr = Math.sqrt(dx * dx + dy * dy);
           return "M" + d[0].x + "," + d[0].y + "A" + dr + "," + dr + " 0 0,1 " + d[1].x + "," + d[1].y;
         }
         */

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
                                     .attr("source", link.source)
                                     .attr("target", link.target)
                                     .attr("class", "edges")
                                     .attr("stroke", "blue")
                                     .attr("stroke-width", 2)
                                     .attr("fill", "none");

      }); //foreach

//LABELS
 //https://stackoverflow.com/questions/13615381/d3-add-text-to-circle
      /* Create the text for each block */
      elemEnter.append("text")
      .attr("dx", function(d, i) {
          //console.log("posX:",viewerWidth, hsep*d.level);
          //return viewerWidth - hsep*(maxlevel - d.level);
          nodedomain = d.domain;
          nodelevel = d.level;
          domainstartX = getDomainElement(nodedomain,domarray).startX;
          domainmaxlevel = getDomainElement(nodedomain,domarray).maxlevel;
          d.positionX = viewerWidth - domainstartX - hsep*(domainmaxlevel - nodelevel);
          console.log("domainstartX:",  domainstartX, "posX:",  d.positionX );
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
          //return d.name + " pos:" + d.positionY + " spaceY:" + d.spaceY})
          return d.name })
      .attr("stroke", "black")
      .attr("font-size", 10)
      .attr("stroke-width", 0.5);
});
