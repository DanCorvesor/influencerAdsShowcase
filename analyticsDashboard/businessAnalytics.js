// var carousel = document.createElement('script');
//
//         carousel.src =  "public/JS/btnCarousel.js";
//         carousel.async = true;
//         carousel.defer = true;
//         document.head.appendChild(carousel);



var num = "";
var data;
// set the dimensions and margins of the svg element for pie
var width = 300
    height = 300
    margin = 10

// set the dimensions and margins of the svg element for line
var margin1 = {top: 40, right: 30, bottom: 30, left: 30},
    width1 = 460- margin1.left - margin1.right,
    height1 = 400- margin1.top - margin1.bottom;

// set the dimensions and margins of the svg element for rolling line
var margin2 = {top: 80, right: 80, bottom: 80, left: 80},
    width2 = 960 - margin2.left - margin2.right,
    height2 = 500 - margin2.top - margin2.bottom;

//set the dimensions, margins and radius for the radial diagram
var margin3 = {top: 30, right: 30, bottom: 70, left: 60},
    width3 = 400 - margin3.left - margin3.right,
    height3 = 400 - margin3.top - margin3.bottom;
    //innerRadius3 = 90,
    //outerRadius3 = Math.min(width3, height3) / 2;   // the outerRadius goes from the middle of the SVG area to the border
//for legend
const legendRectSize  = 20
      legendSpacing = 10

// The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
var radius = Math.min(width, height) / 2 - margin;
//data parser
var parser = d3.timeParse("%b-%y");

var pie = d3.pie()
    .value(d => d.value)
    .sort(function(a, b) { return d3.ascending(a.key, b.key);} ) // This make sure that group order remains the same in the pie chart

var arc = d3.arc()
    .innerRadius(100)
    .outerRadius(radius)
    .cornerRadius(15);

//interpolator for the arcs in the pie
function arcTween(a) {
  const i = d3.interpolate(this._current, a);
  this._current = i(1);
  console.log(i(0.5));
  return (t) => arc(i(t));
  }

//interpolator for the text position in the pie chart
function tweenText(b) {
  var i = d3.interpolate(this._current, b);
  this._current =  i(1);
  return function(t) { return "translate(" + arc.centroid(i(t)) + ")"; };
}

// This allows to find the closest X index of the mouse:
var bisect = d3.bisector(function(d) { return d.x; }).left;

//formats the data for the piechart
function type(d){
  weeksactive = +d.Ad_details.weeks_active;
  weeklybudget = +d.Ad_details.ad_budget;
  return {
    Proportion_taken : +d.Paid_out/(weeksactive* weeklybudget),
    Proportion_left : 1-(+d.Paid_out/(weeksactive * weeklybudget))
  }
}

//formats the data for the linegraph
function type2(d){
  var out = [];
  for (var key in d){
    out.push({
      date : parser(key),
      value : +d[key]
    });
  }
  return out;
}

//formats the data for the tablebody
function type3(d){
  out = [];
  totals = [0,0,0,0,0,0,0,0];
  for (var i = 0; i < d.length; i ++) {
    entry = d[i].Ad_details;
    weeksactive = +entry.weeks_active;
    weeklybudget = +entry.ad_budget;
    engagementtotal = +totaller(d[i].Past_engagement);
    costperengagement = Math.round((engagementtotal/(weeksactive*weeklybudget))*100,2);
    clickstotal = +totaller(d[i].Past_clicks);
    costperclick = Math.round((clickstotal/(weeksactive*weeklybudget))*100,2);
    impressionstotal = +totaller(d[i].Past_impressions);
    costperimpression = Math.round((impressionstotal/(weeksactive*weeklybudget))*100,2);

    totals[0] = totals[0] + weeksactive;
    totals[1] = totals[1] + weeklybudget;
    totals[2] = totals[2] + impressionstotal;
    totals[3] = totals[3] + engagementtotal;
    totals[4] = totals[4] + clickstotal;
    totals[5] = totals[5] + costperimpression;
    totals[6] = totals[6] + costperengagement;
    totals[7] = totals[7] + costperclick;

    line = [d[i].Ad_name, d[i].Status, +entry.ad_budget, weeksactive, impressionstotal, engagementtotal,clickstotal,costperimpression,costperengagement,costperclick];
    out.push(line);
  }
  totalline = ["Total","N/A", totals[0],totals[1],totals[2],totals[3],totals[4],Math.round(totals[5]/d.length,2),Math.round(totals[6]/d.length,2),Math.round(totals[7]/d.length,2)];
  out.push(totalline);
  return out;
}

//formats the data for the cumalative frequency graph

function type4(d,category){
  out = [];
  out1 = [];
  total = 0;
  firsttime = true;
  var catname = category.toString();
  for (var ads in d){
    datalist = d[ads][`${catname}`];
    if (firsttime == true){
      for (var key in datalist){
        holder = +datalist[key];
        total = total + holder;
          out.push({
          date : parser(key),
          value : +total
        });
        out1.push({
          date : parser(key),
          value : +total
        });
      }
      firsttime = false;
    }
    else{
      idx = 0;
      total = 0
      for (var key in datalist){
        holder = +datalist[key];
        total = total + holder
        out[idx].value += total;
        idx = idx +1;

      }

    }
}
return out;
}


//function that formats the data for the stacked bar chart
function type5(d) {

  gender = d.gender;
  ages = d.ages;
  total_in_ages = totaller(ages);
  out = [];
  male = {
    "Gender": "Male"
  };
  female = {
    "Gender": "Female"
  };
  for(var key in ages){

    male[key] = +gender.male*+(ages[key]/total_in_ages);
    female[key] = +gender.female*+(ages[key]/total_in_ages);

  }
  out.push(male);
  out.push(female);
  return out;
}

//function that totals all of the engagements/clicks per month
function totaller(d){
  total = 0;
  for (var key in d){
    holder = +d[key];
    total = total + holder;
  }
  return total
}


// svg object for pie
var svg = d3.select("#my_pie")
  .append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    svg.append("g")
  	.attr("class", "labels");
//svg object for line
var svggraph = d3.select("#my_linegraph")
  .append("svg")
  .attr("width", width1 + margin1.left + margin1.right)
  .attr("height", height1 + margin1.top + margin1.bottom)
  .append("g")
    // .attr("transform", "translate("+ -margin1.left + ",0)");

//svgobject for rolling line

var svgrolling = d3.select("#my_rolling_line")
    .append("svg")
    .attr("width", width2 + margin2.left + margin2.right)
    .attr("height", height2 + margin2.top + margin2.bottom)
  .append("g")
    .attr("transform", "translate(" + margin2.left + "," + margin2.right + ")")

    // append the svg object
var svgbar = d3.select("#my_bar")
  .append("svg")
    .attr("width", width3 + margin3.left + margin3.right)
    .attr("height", height3 + margin3.top + margin3.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin3.left + "," + margin3.top + ")");

//not sure what this does at the moment but it's needed
  // svgrolling.append("clipPath")
  //   .attr("id", "clip")
  //   .append("rect")
  //   .attr("width", width2)
  //   .attr("height", height2);

//all the scales and axis
  //initialise x axis and scale for normal line
  var x = d3.scaleTime()
    .range([0,width1]);
  var xaxis = d3.axisBottom().
    scale(x);
  svggraph.append("g")
    .attr("transform", "translate(" + margin1.left  + "," + height1 + ")")
    .attr("class","myXaxis")

  //initialise y axis and scale for normal line
  var y = d3.scaleLinear()
    .range([ height1, 0 ]);
  var yaxis = d3.axisLeft().scale(y);
  svggraph.append("g")
    .attr("transform", "translate(" + margin1.left + ",0)")
    .attr("class","myYaxis");


  //initialise x axis for rolling line
  var x1 = d3.scaleTime()
    .range([0, width2]);
  var xaxis1 = d3.axisBottom()
    .scale(x1)
    // .tickSize(-height2)
    //.tickSubdivide(true);
  svgrolling.append("g")
    .attr("transform", "translate(" + margin2.left + ",0)")
    .attr("transform", "translate(0," + height2 + ")")
    .attr("class","myXaxisR")

  //initialise x axis for rolling linear
  var y1 = d3.scaleLinear()
    .range([height2, 0]),
  yaxis1 = d3.axisRight()
    .scale(y1)
    .ticks(4);
  svgrolling.append("g")
    .attr("transform", "translate(" + width2 + ",0)")
    .attr("class","myYaxisR");

    //x and y initialisation for the radial diagram
    var xradial = d3.scaleBand()
      .range([0, 2 * Math.PI])    // X axis goes from 0 to 2pi = all around the circle. If I stop at 1Pi, it will be around a half circle
      .align(0)                  // This does nothing

    //var yradial = d3.scaleLinear()
      //.range([innerRadius3, outerRadius3])
       // Domain will be define later.

   // Add X axis for bar chart
  var xbar = d3.scaleBand()
      .range([0, width3])
      .padding([0.2])
  var xbaxis = svgbar.append("g")
    .attr("transform", "translate(0," + height3 + ")")

  // Add Y axis for bar chart1`````
  var ybar = d3.scaleLinear()
    .range([ height3, 0 ]);
  var ybaxis = svgbar.append("g")
    .attr("class", "myYaxis")

    // Create the circle that travels along the curve of chart
  var focus = svggraph.append('g')
    .append('circle')
    .style("fill", "none")
    .attr("stroke", "black")
    .attr('r', 8.5)
    .style("opacity", 0)

    // Create the text that travels along the curve of chart
    var focusText = svggraph.append('g')
    .append('text')
    .style("opacity", 0)
    .attr("text-anchor", "left")
    .attr("alignment-baseline", "middle")

    // This allows to find the closest X index of the mouse:
    var bisect = d3.bisector(function(d) { return d.date; }).left;
    var monthNameFormat = d3.timeFormat("%B %Y");

// set the colur scale
var colour = d3.scaleOrdinal(d3.schemePastel1);

function keychange(d){
  if (d == "Proportion_taken"){
    return "Percentage taken"
  }
  else {
  return "Percentage remaining"
  }
}

d3.json("public/JS/ad_data.json")
  .then(function(data, error){

    $('#company_name').html(data.company_name + "'s Dashboard");
    $('#company_name').css('text-align','center');
    data = data.ad_list;
    //Loop through all of the ads and add button to update in html
     for (var i = 0; i < data.length; i++){
       addButton(`${data[i].Ad_name}`,"line_select",`${i}-select`);
     // document.getElementById('campaign_buttons').innerHTML += `
     //   <button class = 'button btn-default active pie-select' type="button" id = '${i}-pie'>${data[i].Ad_name}</button>
     // `
    }
    //Loop through all of the ads and add button to update in html
    //  for (var i = 0; i < data.length; i++){
    //    var name = i.toString();
    //  document.getElementById('campaign_buttons2').innerHTML += `
    //    <button class = 'button btn-default active line-select' type="button" id = '${i}-line'>${data[i].Ad_name}</button>
    //  `
    // }


   //  for (var i = 0; i < data.length; i++){
   //    var name = i.toString();
   //  document.getElementById('campaign_buttons3').innerHTML += `
   //    <button class = 'button btn-default active rline-select' type="button" id = '${i}-rline'>${data[i].Ad_name}</button>
   //  `
   // }
    d3.selectAll(".Default")
            .on("click",pieupdate)

    $("#myCarousel").on('slide.bs.carousel', function () {
      index = $('#myCarousel .active').attr('id').split("-")[0];
      console.log(index.split("-")[0]);
        lineupdate(data[index]);
        pieupdate(data[index]);
        barupdate(data[index]);
          //this.id.split("-")[0]]
    });

    d3.selectAll(".line-select")
            .on("click", function(){
              lineupdate(data[this.id.split("-")[0]]);
              pieupdate(data[this.id.split("-")[0]]);
              console.log(this.id);
            });

    function pieupdate(val) {
            // Join new data
            const path = svg.selectAll("path")
                .data(pie(d3.entries(type(val))));

            const text = svg.selectAll("text")
              .data(pie(d3.entries(type(val))));

           // Enter new arcs
            path.enter().append("path")
                .attr("fill", (d, i) => colour(i))
                .attr("d", arc)
                .attr("stroke", "#FFE5CC")
                .attr("stroke-width", "2px")
                .each(function(d) { this._current = d; })
            // Update existing arcs
            path.transition().delay(200).duration(500).attrTween("d", arcTween);

            text.enter().append("text")
                .text(function(d) {return (keychange(d.data.key)) + " : " + Math.round(d.data.value * 100,2) + "%"})
                .attr("transform", function(d) {
                  return "translate(" + arc.centroid(d) + ")";
                })
                .style("text-anchor", "middle")
                .style("font-size", 12)
                .style("stroke", "light-grey")


            text.transition().delay(200).duration(500).attrTween("transform",tweenText).text(function(d) {return (keychange(d.data.key)) + " : " + Math.round(d.data.value * 100,2) + "%"});
            text.exit()
                .remove()
          }
          function lineupdate(val) {
            val = type2(val.Past_engagement);

            //add x axis
            x.domain(d3.extent(val, function(d) { return d.date; }))
            svggraph.selectAll(".myXaxis")
              .transition()
              .duration(3000)
              .call(xaxis);

              svggraph.append("text")
              .attr("transform","translate(" + (width1/2 + margin1.left) + " ," + (height1 + margin1.top + 20) + ")")
              .style("text-anchor", "middle")
              .text("Month");

            // Add y axis
            y.domain([0, d3.max(val, function(d) { return d.value; })])
            svggraph.selectAll(".myYaxis")
              .transition()
              .duration(3000)
              .call(yaxis);

            // svggraph.append("text")
            //         .attr("transform", "rotate(-90)")
            //         .attr("y", 0)
            //         .attr("x",0 - (height1 / 2))
            //         .attr("dy", "1em")
            //         .style("text-anchor", "middle")
            //         .text("Number of engagements");

            var path1 = svggraph.selectAll(".lineTest")
            .data([val]);

          // Add the line
          path1
            .enter()
            .append("path")
            .merge(path1)
            .attr("class","lineTest")
            .transition()
            .duration(3000)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
              .x(function(d) { return x(d.date) + margin1.left })
              .y(function(d) { return y(d.value) })
            )

              // Create a rect on top of the svg area: this rectangle recovers mouse position
          svggraph.append('rect')
            .style("fill", "none")
            .style("pointer-events", "all")
            .attr('width', width)
            .attr('height', height)
            .on('mouseover', mouseover)
            .on('mousemove', mousemove)
            .on('mouseout', mouseout);

            // What happens when the mouse move -> show the annotations at the right positions.
            function mouseover() {
              focus.style("opacity", 1)
              focusText.style("opacity",1)
            }

            function mousemove() {
              // recover coordinate we need
              var x0 = x.invert(d3.mouse(this)[0]-margin1.left);
              var i = bisect(val, x0, 1);
              selectedData = val[i];
              focus
                .attr("cx", x(selectedData.date)+margin1.left)
                .attr("cy", y(selectedData.value))
              focusText
                .html(monthNameFormat(selectedData.date) + "  -  " + selectedData.value)
                .attr("x", x(selectedData.date)+15)
                .attr("y", y(selectedData.value)+15)
              }
            function mouseout() {
              focus.style("opacity", 0)
              focusText.style("opacity", 0)
            }
          }

          function rlineupdate(val = data){
            //so can use same colours for the legend
            colourvec = [];

            clicks = type4(val,'Past_clicks');
            engagement  = type4(val,'Past_engagement');
            impressions = type4(val, 'Past_impressions')

            //data for x axis
            x1.domain(d3.extent(engagement, function(d) { return d.date; }))

            svgrolling.selectAll(".myXaxisR")
              .transition()
              .duration(3000)
              .call(xaxis1);

              svgrolling.append("text")
              .attr("transform","translate(" + width2/2 + " ," + (height2+30) + ")")
              .style("text-anchor", "middle")
              .text("Month");
              // data for y axis
              y1.domain([0, d3.max(engagement, function(d) { return d.value; })])
              svgrolling.selectAll(".myYaxisR")
                .transition()
                .duration(3000)
                .call(yaxis1);

              svgrolling.append("text")
                      .attr("transform", "rotate(-90)")
                      .attr("y", width2 +35)
                      .attr("x",0 - (height2  / 2))
                      .attr("dy", "1em")
                      .style("text-anchor", "middle")
                      .text("Number of engagements")

              var path2 = svgrolling.selectAll(".lineRolling")
              .data([engagement, clicks,impressions]);
              path2
                .enter()
                .append("path")
                .merge(path2)
                .attr("class","lineRolling")
                .attr('stroke', function(d,i) {
                    colourvec.push(Math.random()*50);
                    return colour(colourvec[i])
                  })
                .attr('fill','none')
                .attr("stroke-width", 1.5)
                .attr('clip-path', 'url(#clip)')
                .attr("d", d3.line()
                  .x(function(d) {return x1(d.date)})
                  .y(function(d) { return y1(d.value) })
                  )
                //.attr("data-legend",function(d) { return d.name})

              // var guideline = svg.append('line')
              //     .attr('stroke', '#333')
              //     .attr('stroke-width', 0)
              //     .attr('class', 'guide')
              //     .attr('x1', 1)
              //     .attr('y1', 1)
              //     .attr('x2', 1)
              //     .attr('y2', height2)

              svgrolling .selectAll("mydots")
                .data([engagement,clicks,impressions])
                .enter()
                .append("circle")
                .attr("cx", 50)
                .attr("cy", function(d,i){ return 50 + i*25}) // 100 is where the first dot appears. 25 is the distance between dots
                .attr("r", 7)
                .style("fill", function(d,i){ return colour(colourvec[i])})

                svgrolling.selectAll("mylabels")
                .data(['Total number of engagements','Total number of clicks','Total number of impressions'])
                .enter()
                .append("text")
                .attr("x", 70)
                .attr("y", function(d,i){ return 50 + i*25}) // 100 is where the first dot appears. 25 is the distance between dots
                .style("fill", function(d){ Math.random() * 50})
                .text(function(d){ return d})
                .attr("text-anchor", "left")
                .style("alignment-baseline", "middle")


              var curtain = svgrolling.append('rect')
                .attr('x', -1 * width2)
                .attr('y', -1 * height2)
                .attr('height', height2)
                .attr('width', width2)
                .attr('class', 'curtain')
                .attr('transform', 'rotate(180)')
                .style('fill', '#ffffff')

              var t = svgrolling
                .transition()
                .delay(750)
                .duration(6000)
                //.ease('linear')

              t.select('rect.curtain')
                .attr('width', 0);


          };

          function radDiagram (data){
            xradial.domain()
            yradial.domain()


          }

          function barupdate(data){
            subgroups = ["18-25","26-35","36-45","46-55","56-65","65+"];
            groups = ["Male","Female"];
            test = type5(data.Ad_stats);
            test1 = d3.map(test);
            stackeddata = d3.stack()
              .keys(subgroups)
              (test)
            console.log(stackeddata);
            val = data.Ad_stats.gender;

           // Update the X axis
           console.log(d3.map(val));
           var a = d3.map(val).keys();
           var b = d3.map(val).values();
           xbar.domain(groups);
           xbaxis.call(d3.axisBottom(xbar))

           // Update the Y axis
           ybar.domain([0,d3.max(b)]);
           ybaxis
            .transition()
            .duration(1000)
            .call(d3.axisLeft(ybar));

           // Create the u variable
          var u = svgbar.append("g")
            .selectAll("g")
            .data(stackeddata);

            console.log(d3.entries(val))

            u.exit()
            .remove();


          u.enter()
            .append("g") // Add a new rect for each new elements
            //.merge(u) // get the already existing elements as well
            //.transition() // and apply changes to all of them
            //.duration(1000)
            .attr("fill", function(d) { return colour(d.key); })
            .selectAll("rect")
            // enter a second time = loop subgroup per subgroup to add all rectangles
            .data(function(d) { return d; })
            .enter().append("rect")
            .merge(u)
            .transition()
            .duration(1000)
              .attr("x", function(d) { return 42 + xbar(d.data.Gender); })
              .attr("y", function(d) { return ybar(d[1]); })
              .attr("height", function(d) { return ybar(d[0]) - ybar(d[1]); })
              .attr("width",30)
            // .attr("x", function(d) { return 51 +xbar(d.key); })
            // .attr("y", function(d) { return ybar(d.value); })
            // .attr("width", 30)
            // .attr("height", function(d) {return height3 - ybar(d.value); })
            // .attr("fill", "#69b3a2")

            svgbar.selectAll("rect")
            .exit()
            .remove();

            svgbar.selectAll("mydots")
              .data(stackeddata)
              .enter()
              .append("circle")
              .attr("cx", 275)
              .attr("cy", function(d,i){ return 30 + i*25}) // 100 is where the first dot appears. 25 is the distance between dots
              .attr("r", 7)
              .style("fill", function(d){ return colour(d.key);})

              svgbar.selectAll("mylabels")
              .data(subgroups)
              .enter()
              .append("text")
              .attr("x", 295)
              .attr("y", function(d,i){ return 30 + i*25}) // 100 is where the first dot appears. 25 is the distance between dots
              .style("fill", function(d){ Math.random() * 50})
              .text(function(d){ return d})
              .attr("text-anchor", "left")
              .style("alignment-baseline", "middle")

          }
          function loadtable(data){
            var table = d3.select('#table').append("table").attr('class', 'rwd-table');
            var headers = table.append("thead").append("tr");
            headers
              .selectAll("tr")
              .data(["Campaign","Status","Weeks Active", "Daily Budget (£)","Total Impressions","Total Engagements", "Total Clicks", "Cost per Impression (p)", "Cost per Engagement (p)","Cost per Click (p)"])
              .enter()
              .append("th")
              .text(function(d){return d;});

            tabledata = type3(data);

            var tablebody = table.append("tbody");
            rows = tablebody.selectAll("tr")
            .data(type3(data))
            .enter()
            .append("tr")
            .style("opacity",function(d){
              if(d[1] == 'Paused'){
                return 0.2; //makes it be less opaque if not active
              }
              else{
                return 1
              }
            });

            cells = rows.selectAll("td")
                        .data(function(d){return d})
                        .enter()
                        .append("td")
                        .text(function(d){return d})


          }
        pieupdate(data[0]);
        lineupdate(data[0]);
        rlineupdate(data);
        loadtable(data);
        barupdate(data[0]);
})
  .catch(function(error){
    console.log(error);
  });
