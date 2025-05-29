document.addEventListener("DOMContentLoaded", function () {
    const margin = { top: 20, right: 40, bottom: 60, left: 90 };
    const width = 1200 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const tooltip = d3.select("#tooltip");

    const svgWidth = width + margin.left + margin.right;
    const svgHeight = height + margin.top + margin.bottom;

    const baseSvg = d3.select("#line-chart-container svg")
    .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

    const svg = baseSvg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const labels = {
    "Average Weight": "Average Complexity",
    "Average Minimum Players": "Minimum Players",
    "Solo Playable (%)": "Solo Playability (%)",
    "Average Minimum Age": "Minimum Age"
    };

    d3.csv("../../data/board_game_properties_over_time.csv").then(data => {
    data.forEach(d => {
        d.Year = +d.Year;
        d["Average Weight"] = +d["Average Weight"];
        d["Average Minimum Players"] = +d["Average Minimum Players"];
        d["Solo Playable (%)"] = +d["Solo Playable (%)"];
        d["Average Minimum Age"] = +d["Average Minimum Age"];
    });

        data.sort((a, b) => a.Year - b.Year);

        const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.Year))
        .range([0, width]);

        const y = d3.scaleLinear().range([height, 0]);

        const xAxis = d3.axisBottom(x).tickValues([2019, 2022, 2025]).tickFormat(d3.format("d"));
        const yAxisGroup = svg.append("g").attr("class", "y-axis");

        svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .attr("class", "x-axis")
        .call(xAxis);

        const path = svg.append("path")
        .attr("fill", "none")
        .attr("stroke", getComputedStyle(document.documentElement).getPropertyValue("--orange"))
        .attr("stroke-width", 3);

        const circlesGroup = svg.append("g");

        const yLabel = svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -55)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px");

        const xLabel = svg.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + 50)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .text("Year");

        function updateChart(property) {
        const values = data.map(d => d[property]);
        y.domain([d3.min(values) * 0.95, d3.max(values) * 1.05]);

        yAxisGroup.transition()
            .duration(800)
            .ease(d3.easeCubicInOut)
            .call(d3.axisLeft(y).ticks(7));

        const line = d3.line()
            .x(d => x(d.Year))
            .y(d => y(d[property]));
        
        const area = d3.area()
            .x(d => x(d.Year))
            .y0(height)
            .y1(d => y(d[property]));

        let areaPath = svg.select(".area-path");

        if (areaPath.empty()) {
        areaPath = svg.append("path")
            .attr("class", "area-path")
            .attr("fill", getComputedStyle(document.documentElement).getPropertyValue("--yellow"))
            .attr("opacity", 0.1);
        }

        areaPath.datum(data)
        .transition()
        .duration(1000)
        .ease(d3.easeCubicInOut)
        .attr("d", area);
        
        path.datum(data)
            .transition()
            .duration(1000)
            .ease(d3.easeCubicInOut)
            .attr("d", line);

        const circles = circlesGroup.selectAll("circle").data(data);

        circles.enter()
            .append("circle")
            .merge(circles)
            .attr("r", 6)
            .attr("stroke", "#f77f00")
            .attr("stroke-width", 2.5)
            .attr("fill", getComputedStyle(document.documentElement).getPropertyValue("--yellow"))
            .on("mouseover", (event, d) => {
            tooltip.style("display", "block")
                .html(`<strong>${d.Year}</strong><br>${labels[property]}: ${d[property].toFixed(2)}`);
            })
            .on("mousemove", (event) => {
            tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", () => tooltip.style("display", "none"))
            .transition()
            .duration(1000)
            .ease(d3.easeCubicInOut)
            .attr("cx", d => x(d.Year))
            .attr("cy", d => y(d[property]));

        circles.exit().remove();

        yLabel.text(labels[property]);
        }

        updateChart("Average Weight");

        document.getElementById("propertySelector").addEventListener("change", function () {
        updateChart(this.value);
        });
    }).catch(error => {
        console.error("CSV load error:", error);
    });
});
