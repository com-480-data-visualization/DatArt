mapboxgl.accessToken =
  "pk.eyJ1IjoibGluYXlhaHlhIiwiYSI6ImNtOWluNjVlNDAwZTgya3NkdGtwcjI0NjgifQ.rXrXQE6gIL7aVFG1m4V5ww";

document.addEventListener("DOMContentLoaded", () => {
  const infoPanel = document.getElementById("country-info");
  const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v11",
    center: [0, 20], // longitude, latitude
    zoom: 1.5,
    projection: "globe", // Set projection to 'globe'
    pitch: 60, // Give the map a slight tilt for better 3D effect
    bearing: 0, // Set map rotation to a default position
    antialias: true, // Improve rendering performance
  });

  const colorScale = d3
    .scaleSequential()
    .domain([1, 5]) // min and max complexity
    .interpolator(d3.interpolateOranges);

  const flyToCountry = ({ lon, lat, country, game, complexity, reviews }) => {
    new mapboxgl.Marker({ color: "#d62828" }) // or use a custom icon
      .setLngLat([lon, lat])
      .addTo(map);

    map.flyTo({
      center: [Number(lon), Number(lat)],
      zoom: 4,
      speed: 0.8,
      essential: true,
    });

    infoPanel.innerHTML = `
        <h3>${country}</h3>
        <p><strong>Top Game:</strong> ${game}</p>
        <p><strong>Complexity:</strong> ${complexity}</p>
        <p><strong>Reviews:</strong> ${reviews}</p>
      `;
    infoPanel.style.display = "block";
    //   .addTo(map);
  };

  // Load your data (can be replaced with d3.json or d3.csv)
  fetch("data.json")
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
      // You can now use this `data` to create popups, color fills, etc.
      // For example, attach info to countries:
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
                "#ccc", // fallback
              ],
              "#ccc",
            ],
            "fill-opacity": 0.7,
          },
        });

        // Add popups with game info
        map.on("click", "country-fills", (e) => {
          const isoCode = e.features[0].properties.iso_3166_1_alpha_2;
          const countryData = dataMap[isoCode]; // <-- super clean now!
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
        setTimeout(startWorldTour, 4000); // next country in 4s
      }

      startWorldTour();
    })
    .catch((err) => console.log(err));
});
