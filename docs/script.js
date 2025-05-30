mapboxgl.accessToken =
  "pk.eyJ1IjoibGluYXlhaHlhIiwiYSI6ImNtOWluNjVlNDAwZTgya3NkdGtwcjI0NjgifQ.rXrXQE6gIL7aVFG1m4V5ww";

const startButton = document.querySelector(".play-button");
const targetSection = document.querySelector("#about");

if (startButton && targetSection) {
  startButton.addEventListener("click", () => {
    const targetY = targetSection.getBoundingClientRect().top + window.scrollY;
    const startY = window.scrollY;
    const distance = targetY - startY;
    const duration = 2000;
    const startTime = performance.now();

    function step(currentTime) {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const ease =
        progress < 0.5
          ? 2 * progress * progress
          : -1 + (4 - 2 * progress) * progress;
      window.scrollTo(0, startY + distance * ease);
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  });
} else {
  console.warn("Scroll not working");
}

document.addEventListener("DOMContentLoaded", () => {
  const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v12",
    center: [0, 20],
    zoom: 1.5,
    projection: "globe",
    pitch: 0,
    bearing: 0,
    antialias: true,
  });

  map.on("style.load", () => {
    map.setFog({
      color: "#f77f00",
      "horizon-blend": 0,
      "star-intensity": 0.1,
      "space-color": "#003049",
    });
  });

  fetch("data/top_game_by_country.json")
    .then((res) => res.json())
    .then((data) => {
      // Add markers to map
      data.forEach((country) => {
        new mapboxgl.Marker({
          color: "orange",
          draggable: true,
        })
          .setLngLat([country.lon, country.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 10 }).setHTML(`
              <h3>${country.country}</h3>
              <p><strong>Top Games:</strong> ${country.top_games.join(", ")}</p>
              <p><strong>Complexity:</strong> ${country.complexity}</p>
              <p><strong>Reviews:</strong> ${country.reviews}</p>
              `)
          )
          .addTo(map);
      });
    })
    .catch((err) => console.error("Error loading data:", err));
});

/////////////// world heatmap ///////////////

const generateComplexityHeatMapChart = async () => {
  const width = 928;
  const marginTop = 46;
  const height = width / 2 + marginTop;

  const world = await d3.json(
    "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
  );
  const countries = topojson.feature(world, world.objects.countries);
  const countrymesh = topojson.mesh(
    world,
    world.objects.countries,
    (a, b) => a !== b
  );

  const projection = d3.geoEqualEarth().fitExtent(
    [
      [2, marginTop + 2],
      [width - 2, height],
    ],
    { type: "Sphere" }
  );
  const path = d3.geoPath(projection);

  const complexityData = await d3.json("data/complexity_by_country.json");
  const valuemap = new Map(
    Object.entries(complexityData).map(([country, value]) => [
      country,
      value.average,
    ])
  );

  const values = Array.from(valuemap.values());
  const min = Math.min(...values);
  const max = Math.max(...values);

  const color = d3
    .scaleLinear()
    .domain([min, min + (max - min) * 0.4, max])
    .range(["#f7ecdc", "#fcbf49", "#f77f00"]);

  const svg = d3
    .create("svg")
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height]);

  svg
    .append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "var(--navy)");

  svg
    .append("g")
    .selectAll("path")
    .data(countries.features.filter((d) => d.properties.name !== "Antarctica"))
    .join("path")
    .attr("fill", (d) => {
      const val = valuemap.get(d.properties.name);
      return val != null ? color(val) : "#f7ecdc";
    })
    .attr("d", path);

  const tooltip = d3.select("#tooltip");

  // Draw countries with tooltip handlers
  svg
    .append("g")
    .selectAll("path")
    .data(countries.features.filter((d) => d.properties.name !== "Antarctica"))
    .join("path")
    .attr("fill", (d) => {
      const val = valuemap.get(d.properties.name);
      return val != null ? color(val) : "#f7ecdc";
    })
    .attr("d", path)
    .on("mouseover", (event, d) => {
      const val = valuemap.get(d.properties.name);
      tooltip
        .style("display", "block")
        .html(
          `<strong>${d.properties.name}</strong><br>Average Complexity: ${
            val != null ? val.toFixed(2) : "No data"
          }`
        );
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", () => tooltip.style("display", "none"));

  svg
    .append("path")
    .datum(countrymesh)
    .attr("fill", "none")
    .attr("stroke", "#fcbf49")
    .attr("stroke-width", 0.5)
    .attr("d", path);

  const legendWidth = 300;
  const legendHeight = 5;

  const defs = svg.append("defs");
  const linearGradient = defs
    .append("linearGradient")
    .attr("id", "legend-gradient");

  linearGradient
    .selectAll("stop")
    .data(d3.range(0, 1.01, 0.1))
    .join("stop")
    .attr("offset", (d) => `${d * 100}%`)
    .attr("stop-color", (d) => color(min + d * (max - min)));

  svg
    .append("rect")
    .attr("x", 30)
    .attr("y", height - 20)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .attr("rx", 6)
    .attr("fill", "url(#legend-gradient)")
    .attr("stroke", "#fcbf49")
    .attr("stroke-width", 1);

  const legendScale = d3
    .scaleLinear()
    .domain([min, max])
    .range([0, legendWidth]);

  const legendAxis = d3
    .axisBottom(legendScale)
    .ticks(6)
    .tickFormat(d3.format(".2f"));

  svg
    .append("g")
    .attr("transform", `translate(30, ${height - 20})`)
    .call(legendAxis)
    .call((g) => g.selectAll("text").style("fill", "#f7ecdc"))
    .call((g) => g.selectAll("path, line").style("stroke", "#f7ecdc"));

  svg
    .append("text")
    .attr("x", 30)
    .attr("y", height - 30)
    .attr("fill", "#fcbf49")
    .attr("font-weight", "bold")
    .text("Average Game Complexity (2019, 2022, 2025)");

  return svg.node();
};

generateComplexityHeatMapChart().then((svg) => {
  document.getElementById("world_heat_map").appendChild(svg);
});

////////////// correlations ////////////////
const featureLabels = {
  trading: "Trading",
  averageweight: "Average Complexity",
  minplaytime: "Min Playtime",
  minplayers: "Min Players",
};

const generateCorrelation = async () => {
  const margin = { top: 40, right: 30, bottom: 80, left: 50 };
  const width = 928 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const svg = d3
    .create("svg")
    .attr("height", height + margin.top + margin.bottom)
    .attr("viewBox", [
      0,
      0,
      width + margin.left + margin.right,
      height + margin.top + margin.bottom,
    ]);

  // Background
  svg
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("fill", "var(--navy)")
    .lower();

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const tooltip = d3.select("#tooltip");

  const data = await d3.json("data/correlations.json");
  data.forEach((d) => {
    d.correlation = +d.correlation;
    d.label = featureLabels[d.feature] || d.feature;
  });

  const x = d3
    .scaleBand()
    .domain(data.map((d) => d.label))
    .range([0, width])
    .padding(0.4);

  const y = d3.scaleLinear().domain([-1, 1]).range([height, 0]);

  // Axis generators
  const xAxis = (g) => {
    g.call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-40)")
      .style("text-anchor", "end")
      .style("fill", "#fff");

    g.selectAll("line").attr("stroke", "#fff");
    g.selectAll("path").attr("stroke", "#fff");
  };

  const yAxis = (g) => {
    g.call(d3.axisLeft(y)).selectAll("text").style("fill", "#fff");
    g.selectAll("line").attr("stroke", "#fff");
    g.selectAll("path").attr("stroke", "#fff");
  };

  // Draw x-axis and y-axis
  g.append("g").attr("transform", `translate(0, ${height})`).call(xAxis);
  g.append("g").call(yAxis);

  // Zero line
  g.append("line")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", y(0))
    .attr("y2", y(0))
    .attr("stroke", "#999")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "3,2");

  // Stems
  g.selectAll("line.stem")
    .data(data)
    .enter()
    .append("line")
    .attr("class", "stem")
    .attr("x1", (d) => x(d.label) + x.bandwidth() / 2)
    .attr("x2", (d) => x(d.label) + x.bandwidth() / 2)
    .attr("y1", y(0))
    .attr("y2", (d) => y(d.correlation))
    .attr("stroke", "var(--orange)")
    .attr("stroke-width", 2);

  // Circles
  g.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", (d) => x(d.label) + x.bandwidth() / 2)
    .attr("cy", (d) => y(d.correlation))
    .attr("r", 5)
    .attr("fill", "var(--cream)")
    .attr("stroke", "var(--orange)")
    .attr("stroke-width", 2)
    .on("mouseover", (event, d) => {
      tooltip
        .style("display", "block")
        .html(
          `<strong>${d.label}</strong><br>Correlation: ${d.correlation.toFixed(
            2
          )}`
        );
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 20 + "px");
    })
    .on("mouseout", () => tooltip.style("display", "none"));

  // Y-axis label
  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2 - margin.top)
    .attr("y", 15)
    .attr("text-anchor", "middle")
    .attr("class", "axis-label")
    .attr("fill", "var(--text-light)")
    .text("correlation");

  return svg.node();
};

document.addEventListener("DOMContentLoaded", () => {
  generateCorrelation().then((svg) => {
    document.getElementById("game_correlation").appendChild(svg);
  });
});
