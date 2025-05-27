function drawBumpChart() {

    d3.json(`../../data/categories_2019.json?nocache=${Date.now()}`).then(data2019 => {
        d3.json(`../../data/categories_2022.json?nocache=${Date.now()}`).then(data2022 => {
            d3.json(`../../data/categories_2025.json?nocache=${Date.now()}`).then(data2025 => {

                const years = [2019, 2022, 2025];
                const raw = [data2019, data2022, data2025];
                const categories = Array.from(new Set(raw.flatMap(d => Object.keys(d))));

                const ranks = raw.map(data =>
                    Object.entries(data)
                        .sort((a, b) => b[1].proportion - a[1].proportion)
                        .map(([cat], i) => ({ category: cat, rank: i + 1 }))
                );

                const bumpData = categories.map(cat => ({
                    category: cat,
                    values: years.map((year, i) => {
                        const rankObj = ranks[i].find(r => r.category === cat);
                        return {
                            year,
                            rank: rankObj ? rankObj.rank : categories.length + 1,
                            proportion: raw[i][cat]?.proportion ?? null
                        };
                    })
                }));

                const margin = { top: 10, right: 150, bottom: 50, left: 150 };

                const container = document.getElementById("category-race");
                const containerWidth = container.getBoundingClientRect().width;
                const width = containerWidth - margin.left - margin.right;
                const height = 600 - margin.top - margin.bottom;

                const svg = d3.select("#category-race")
                .append("svg")
                .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
                .attr("preserveAspectRatio", "xMidYMin meet")
                .style("width", "100%")
                .style("max-width", "1200px")
                .style("height", "auto")
                .style("display", "block")
                .style("margin", "0 auto");

                const chart = svg.append("g")
                    .attr("transform", `translate(${margin.left},${margin.top})`);

                const x = d3.scalePoint()
                    .domain(years)
                    .range([0, width]);

                const y = d3.scaleLinear()
                    .domain([1, categories.length])
                    .range([0, height]);
                
                const xAxis = d3.axisBottom(x)
                .tickSize(0)
                .tickPadding(10);

                chart.append("g")
                .attr("class", "x-axis")
                .attr("transform", `translate(0, ${height + 30})`)
                .call(xAxis)
                .selectAll("text")
                .style("font-size", "14px")
                .style("fill", "#fff");

                const customPalette = [
                "#d62828",
                "#e63946",
                "#f08080",
                "#ff6b6b",

                "#f77f00",
                "#ff8c00",
                "#ffb347",
                "#ffc074",

                "#fcbf49",
                "#ffe066",
                "#fff275",
                "#fff799",
                "#fffac2"
                ];

                const color = d3.scaleOrdinal()
                .domain(categories)
                .range(customPalette);

                const line = d3.line()
                    .x(d => x(d.year))
                    .y(d => y(d.rank))
                    .curve(d3.curveMonotoneX);

                const group = chart.selectAll(".line-group")
                    .data(bumpData)
                    .enter()
                    .append("g")
                    .attr("class", "line-group")
                    .on("mouseover", function () {
                        d3.selectAll(".bump-line")
                            .style("opacity", 0.1)
                            .style("stroke-width", 7);
                        d3.select(this).select(".bump-line")
                            .style("opacity", 1)
                            .style("stroke-width", 10);
                        d3.select(this).raise();
                    })
                    .on("mouseout", function () {
                        d3.selectAll(".bump-line")
                            .style("opacity", 0.7)
                            .style("stroke-width", 10);
                    });

                group.append("path")
                    .attr("class", "bump-line")
                    .attr("d", d => line(d.values))
                    .attr("fill", "none")
                    .attr("stroke", d => color(d.category))
                    .attr("stroke-width", 9)
                    .style("opacity", 0.7)
                    .each(function () {
                        const path = d3.select(this);
                        const length = this.getTotalLength();
                        path
                            .attr("stroke-dasharray", length)
                            .attr("stroke-dashoffset", length)
                            .transition()
                            .duration(1200)
                            .ease(d3.easeCubic)
                            .attr("stroke-dashoffset", 0)
                            .on("end", function () {
                                d3.select(this)
                                    .attr("stroke-dasharray", null)
                                    .attr("stroke-dashoffset", null);
                            });
                    });

                const tooltip = d3.select("#tooltip-categ");

                const dots = group.selectAll(".bump-dot")
                    .data(d => d.values.map(v => ({
                        ...v,
                        category: d.category
                    })))
                    .enter()
                    .append("circle")
                    .attr("class", "bump-dot")
                    .attr("cx", d => x(d.year))
                    .attr("cy", d => y(d.rank))
                    .attr("r", 8)
                    .attr("fill", d => color(d.category))
                    .on("mouseover", function (event, d) {
                        tooltip.style("display", "block")
                            .html(`
                                <strong>${d.category} (${d.year})</strong><br>
                                Rank: ${d.rank}<br>
                                Proportion: ${(d.proportion*100)?.toFixed(2)}%
                            `);
                    })
                    .on("mousemove", function (event) {
                        tooltip.style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    })
                    .on("mouseout", function () {
                        tooltip.style("display", "none");
                    });

                group.append("text")
                    .attr("x", x(years[0]) - 10)
                    .attr("y", d => y(d.values[0].rank))
                    .attr("text-anchor", "end")
                    .text(d => `#${d.values[0].rank} ${d.category}`)
                    .style("font-size", "15px")
                    .style("fill", d => color(d.category))
                    .attr("alignment-baseline", "middle");

                group.append("text")
                    .attr("x", x(years[2]) + 10)
                    .attr("y", d => y(d.values[2].rank))
                    .attr("text-anchor", "start")
                    .text(d => `#${d.values[2].rank} ${d.category}`)
                    .style("font-size", "15px")
                    .style("fill", d => color(d.category))
                    .attr("alignment-baseline", "middle");

                /*svg.append("text")
                    .attr("x", width / 2 + margin.left)
                    .attr("y", 20)
                    .attr("text-anchor", "middle")
                    .attr("fill", "#fff")
                    .style("font-size", "20px")
                    .text("Category Ranking Bump Chart (2019–2025)");*/
            });
        });
    });
}

window.addEventListener("load", drawBumpChart);