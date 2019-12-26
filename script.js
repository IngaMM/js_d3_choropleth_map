const w = 1000;
const h = 1000;
const padding = 80;
const color_number = 6;

const svg = d3
  .select("body")
  .append("svg")
  .attr("width", w)
  .attr("height", h);

const COUNTIES =
  "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json";
const EDUCATION =
  "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json";

var path = d3.geoPath();

d3.queue()
  .defer(d3.json, COUNTIES)
  .defer(d3.json, EDUCATION)
  .await(ready);

function ready(error, us, education) {
  if (error) throw error;

  // Build up the color scheme
  let edu_min = d3.min(education.map(item => item.bachelorsOrHigher));
  let edu_max = d3.max(education.map(item => item.bachelorsOrHigher));
  let color_domain = [];

  for (let i = 0; i <= color_number; i++) {
    color_domain.push(edu_min + (i * (edu_max - edu_min)) / color_number);
  }

  let color = d3
    .scaleThreshold()
    .domain(color_domain)
    .range(d3.schemeBlues[color_number + 2]);

  // Visualize the counties incl. coloring and tooltip
  svg
    .append("g")
    .attr("transform", "translate(" + padding + "," + padding + ")")
    .attr("class", "counties")
    .selectAll("path")
    .data(topojson.feature(us, us.objects.counties).features)
    .enter()
    .append("path")
    .attr("class", "county")
    .attr("d", path)
    .attr("data-fips", d => d.id)
    .attr("data-education", function(d) {
      let result = education.filter(function(item) {
        return d.id == item.fips;
      });
      return result[0].bachelorsOrHigher;
    })
    .attr("fill", function(d) {
      let result = education.filter(function(item) {
        return d.id == item.fips;
      });
      return color(result[0].bachelorsOrHigher);
    })
    .on("mouseover", function(d) {
      // add information box
      d3.select("body")
        .append("div")
        .attr("id", "tooltip")
        .attr("data-education", function() {
          let result = education.filter(function(item) {
            return d.id == item.fips;
          });
          return result[0].bachelorsOrHigher;
        })
        .html(function() {
          let data = education.filter(function(item) {
            return d.id == item.fips;
          });
          return (
            data[0].area_name +
            ", " +
            data[0].state +
            ": " +
            data[0].bachelorsOrHigher +
            "%"
          );
        })
        .style("left", d3.event.pageX + "px")
        .style("top", d3.event.pageY - 30 + "px");
    })
    .on("mouseout", function(d) {
      d3.select("#tooltip").remove();
    });

  //Visualize the state borders
  svg
    .append("path")
    .attr("transform", "translate(" + padding + "," + padding + ")")
    .datum(
      topojson.mesh(us, us.objects.states, function(a, b) {
        return a !== b;
      })
    )
    .attr("d", path)
    .attr("class", "states-boundaries");

  // Create & append the legend
  const legend = svg
    .append("g")
    .attr("id", "legend")
    .attr("transform", "translate(500,80)")
    .attr("height", 100)
    .attr("width", 400);

  const legendScale = d3
    .scaleLinear()
    .domain([edu_min, edu_max])
    .rangeRound([0, 360]);

  const legendAxis = d3.axisBottom(legendScale);

  legend
    .selectAll("rect")
    .data(
      color.range().map(function(d) {
        d = color.invertExtent(d);
        if (d[0] == null) d[0] = legendScale.domain()[0];
        if (d[1] == null) d[1] = legendScale.domain()[1];
        return d;
      })
    )
    .enter()
    .append("rect")
    .attr("x", d => legendScale(d[0]))
    .attr("width", d => legendScale(d[1]) - legendScale(d[0]))
    .attr("height", 30)
    .style("fill", d => color(d[0]));

  svg
    .append("g")
    .attr("transform", "translate(500,110)")
    .attr("id", "legend-text")
    .call(
      legendAxis
        .tickSizeOuter(0)
        .tickValues(color_domain.slice(0, color_number))
        .tickFormat(x => Math.round(x) + "%")
    )
    .style("font-size", "15px");
}
