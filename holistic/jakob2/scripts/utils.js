function moveNodeVertically(svgGroup, nodeSelection, ydistance) {

  var currentNodeSelection =  svgGroup.selectAll(".nodes")
          .filter(function(d,i){
            return d.nodeid == nodeSelection.nodeid;
          })

  currentNodeSelection.attr("cy", ydistance)
                      .transition();
}
