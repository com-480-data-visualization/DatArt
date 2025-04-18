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

  const flyToCountry = ({ lon, lat, country, game, complexity, reviews }) => {
    new mapboxgl.Marker({ color: "#d62828" }) 
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

  fetch("data.json")
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
