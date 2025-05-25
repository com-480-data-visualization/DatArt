mapboxgl.accessToken =
  "pk.eyJ1IjoibGluYXlhaHlhIiwiYSI6ImNtOWluNjVlNDAwZTgya3NkdGtwcjI0NjgifQ.rXrXQE6gIL7aVFG1m4V5ww";

document.addEventListener("DOMContentLoaded", () => {
  const infoPanel = document.getElementById("country-info");
  const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v11",
    center: [0, 20],
    zoom: 1.5,
    projection: "globe",
    pitch: 60,
    bearing: 0,
    antialias: true,
  });

  const colorScale = d3
    .scaleSequential()
    .domain([1, 5])
    .interpolator(d3.interpolateOranges);

  const flyToCountry = ({
    lon,
    lat,
    country,
    top_games,
    complexity,
    reviews,
  }) => {
    new mapboxgl.Marker({ color: "#d62828" }).setLngLat([lon, lat]).addTo(map);

    map.flyTo({
      center: [Number(lon), Number(lat)],
      zoom: 4,
      speed: 0.8,
      essential: true,
    });

    infoPanel.innerHTML = `
        <h3>${country}</h3>
        <p><strong>Top Games:</strong> ${top_games.join(", ")}</p>
        <p><strong>Complexity:</strong> ${complexity}</p>
        <p><strong>Reviews:</strong> ${reviews}</p>
      `;
    infoPanel.style.display = "block";
  };

  fetch("./data/top_game_by_country.json")
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
      map.on("load", () => {
        map.addSource("countries", {
          type: "vector",
          url: "mapbox://mapbox.country-boundaries-v1",
        });

        map.addLayer({
          id: "country-fills",
          type: "fill",
          source: "countries",
          "source-layer": "country_boundaries",
          paint: {
            "fill-color": [
              "case",
              [
                "has",
                ["get", "iso_3166_1_alpha_2"],
                ["literal", data.map((d) => d.code)],
              ],
              [
                "match",
                ["get", "iso_3166_1_alpha_2"],
                ...data.flatMap((d) => [d.code, colorScale(d.complexity)]),
                "#ccc",
              ],
              "#ccc",
            ],
            "fill-opacity": 0.7,
          },
        });

        map.on("click", "country-fills", (e) => {
          const isoCode = e.features[0].properties.iso_3166_1_alpha_2;
          const countryData = dataMap[isoCode];
          if (countryData) {
            new mapboxgl.Popup()
              .setLngLat(e.lngLat)
              .setHTML(
                `
                  <h3>${countryData.country}</h3>
                  <p><strong>Top Game:</strong> ${countryData.game}</p>
                  <p><strong>Complexity:</strong> ${countryData.complexity}</p>
                  <p><strong>Reviews:</strong> ${countryData.reviews}</p>
                `
              )
              .addTo(map);
          }
        });
      });

      let index = 0;
      function startWorldTour() {
        if (index >= data.length) return;
        flyToCountry(data[index]);
        index++;
        setTimeout(startWorldTour, 4000);
      }

      startWorldTour();
    })
    .catch((err) => console.log(err));
});

// world heatmap

const featureLabels = {
  trading: "Trading",
  averageweight: "Average Complexity",
  minplaytime: "Min Playtime",
  minplayers: "Min Players",
};

const chart = async () => {
  const width = 928;
  const marginTop = 46;
  const height = width / 2 + marginTop;

  // Load the world map
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

  // Load complexity data
  const complexityData = await d3.json("./data/complexity_by_country.json");

  const valuemap = new Map(
    Object.entries(complexityData).map(([country, value]) => [
      country,
      value["2019"],
    ])
  );

  // Create color scale
  const color = d3.scaleSequential(
    d3.extent(Array.from(valuemap.values())),
    d3.interpolateYlGnBu
  );

  // Create SVG
  const svg = d3
    .create("svg")
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "width: 100%; height: auto; display: block; margin: auto;");

  // Background
  svg
    .append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "var(--cream)");

  // Countries
  svg
    .append("g")
    .selectAll("path")
    .data(countries.features.filter((d) => d.properties.name !== "Antarctica"))
    .join("path")
    .attr("fill", (d) => {
      const val = valuemap.get(d.properties.name);
      return val != null ? color(val) : "#ccc"; // Gray if no data
    })
    .attr("d", path)
    .append("title")
    .text((d) => {
      const val = valuemap.get(d.properties.name);
      return `${d.properties.name}\n${
        val != null ? val.toFixed(2) : "No data"
      }`;
    });

  // Country borders
  svg
    .append("path")
    .datum(countrymesh)
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("d", path);

  // Add legend
  const legendWidth = 300;
  const legendHeight = 10;

  const defs = svg.append("defs");

  const linearGradient = defs
    .append("linearGradient")
    .attr("id", "legend-gradient");

  linearGradient
    .selectAll("stop")
    .data(d3.ticks(0, 1, 10))
    .join("stop")
    .attr("offset", (d) => `${d * 100}%`)
    .attr("stop-color", (d) =>
      color(d3.interpolateNumber(...color.domain())(d))
    );

  svg
    .append("rect")
    .attr("x", 30)
    .attr("y", height - 40)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient)");

  // Add scale labels
  const legendScale = d3
    .scaleLinear()
    .domain(color.domain())
    .range([0, legendWidth]);

  const legendAxis = d3
    .axisBottom(legendScale)
    .ticks(5)
    .tickFormat(d3.format(".2f"));

  svg
    .append("g")
    .attr("transform", `translate(30, ${height - 30})`)
    .call(legendAxis);

  svg
    .append("text")
    .attr("x", 30)
    .attr("y", height - 50)
    .attr("fill", "black")
    .attr("font-weight", "bold")
    .text("Average Game Complexity (2019)");

  return svg.node();
};

// Add to page
chart().then((svg) => {
  document.getElementById("world_heat_map").appendChild(svg);
});

// correlations

const generate_correlation = async () => {
  const margin = { top: 40, right: 30, bottom: 80, left: 50 };
  const width = 928 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const svg = d3
    .create("svg")
    .attr("height", height + margin.top + margin.bottom)
    .attr("style", "width: 100%; height: auto; display: block; margin: auto;")
    .attr("viewBox", [
      0,
      0,
      width + margin.left + margin.right,
      height + margin.top + margin.bottom,
    ]);

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Add cream background
  svg
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("fill", "var(--cream)")
    .lower();

  d3.json("./data/correlations.json").then((data) => {
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
    g.append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", y(0))
      .attr("y2", y(0))
      .attr("stroke", "#999")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,2"); // Optional: dashed line

    // Axes
    g.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-40)")
      .style("text-anchor", "end");

    g.append("g").call(d3.axisLeft(y));

    // Lollipop lines
    g.selectAll("line.stem")
      .data(data)
      .enter()
      .append("line")
      .attr("class", "stem")
      .attr("x1", (d) => x(d.label) + x.bandwidth() / 2)
      .attr("x2", (d) => x(d.label) + x.bandwidth() / 2)
      .attr("y1", y(0))
      .attr("y2", (d) => y(d.correlation))
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2);

    // Lollipop circles
    g.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.label) + x.bandwidth() / 2)
      .attr("cy", (d) => y(d.correlation))
      .attr("r", 5)
      .attr("fill", "white")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2);

    // Title
    svg
      .append("text")
      .attr("x", margin.left)
      .attr("y", 20)
      .text("Feature Correlation with Bayes Average Rating")
      .attr("font-weight", "bold");

    // Y-axis label
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2 - margin.top)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .attr("class", "axis-label")
      .text("correlation");
  });
  return svg.node();
};

document.addEventListener("DOMContentLoaded", () => {
  generate_correlation().then((svg) => {
    document.getElementById("game_correlation").appendChild(svg);
  });
});
