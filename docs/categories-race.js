d3.json('../../data/categories_2019.json').then(data2019 => {
    d3.json('../../data/categories_2022.json').then(data2022 => {
        d3.json('../../data/categories_2025.json').then(data2025 => {
        
        const frames = [
            { year: 2019, data: data2019 },
            { year: 2022, data: data2022 },
            { year: 2025, data: data2025 }
        ];

        const svg = d3.select("#category-race")
            .append("svg")
            .attr("width", 800)
            .attr("height", 600);

        const margin = { top: 50, right: 40, bottom: 40, left: 150 },
                width = 800 - margin.left - margin.right,
                height = 600 - margin.top - margin.bottom;

        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear().range([0, width]);
        const y = d3.scaleBand().range([0, height]).padding(0.1);

        const yearLabel = svg.append("text")
            .attr("x", width / 2 + margin.left)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .style("font-size", "24px");

        let frameIndex = 0;

        function update(frame) {
            const year = frame.year;
            const data = Object.entries(frame.data)
            .map(([category, v]) => ({
                category,
                value: v.contribution
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10); // top 10

            x.domain([0, d3.max(data, d => d.value)]);
            y.domain(data.map(d => d.category));
            yearLabel.text(year);

            const bars = chart.selectAll("rect").data(data, d => d.category);

            bars.enter()
            .append("rect")
            .attr("x", 0)
            .attr("y", d => y(d.category))
            .attr("height", y.bandwidth())
            .attr("width", 0)
            .attr("fill", (d, i) => d3.schemeCategory10[i % 10])
            .merge(bars)
            .transition().duration(1000)
            .attr("y", d => y(d.category))
            .attr("height", y.bandwidth())
            .attr("width", d => x(d.value));

            bars.exit()
            .transition().duration(500)
            .attr("width", 0)
            .remove();

            const labels = chart.selectAll("text.label").data(data, d => d.category);

            labels.enter()
            .append("text")
            .attr("class", "label")
            .attr("x", 5)
            .attr("y", d => y(d.category) + y.bandwidth() / 2 + 5)
            .attr("fill", "white")
            .text(d => d.category)
            .merge(labels)
            .transition().duration(1000)
            .attr("y", d => y(d.category) + y.bandwidth() / 2 + 5);

            labels.exit().remove();
        }

        function animate() {
            update(frames[frameIndex]);
            frameIndex = (frameIndex + 1) % frames.length;
            setTimeout(animate, 2000);
        }

        animate();

        });
    });
});