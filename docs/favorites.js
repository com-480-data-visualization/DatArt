document.addEventListener("DOMContentLoaded", () => {
    const yearSelector = document.getElementById("yearSelector");
    yearSelector.addEventListener("change", () => loadFavorites(yearSelector.value));
    loadFavorites("2019");
});

function loadFavorites(year) {
    const filePath = `data/games${year}_top3.json`;
    d3.json(filePath).then(games => {
    const container = document.getElementById("favoritesContainer");
    container.innerHTML = "";

    games.forEach((game, index) => {
        const rank = index + 1;
        const rankClass = rank === 1 ? "gold-rank" : rank === 2 ? "silver-rank" : "bronze-rank";

        const card = document.createElement("div");
        card.className = `card-box ${rankClass}`;

        card.innerHTML = `
            <div class="card-inner">
            <div class="card-front">
                <img src="assets/${rankClass.replace('-rank', '')}.png" alt="${rankClass}" class="front-image">
            </div>
            <div class="card-back">
                <img src="${game.image}" alt="${game.name}">
                <h3 class="card-title">${game.name}</h3>
                <div class="card-details">
                <p>⭐ ${game.bayesaverage}</p>
                <p>🎲 ${game.averageweight}</p>
                <p>👥 ${game.minplayers}–${game.maxplayers}</p>
                <p>📅 ${game.yearpublished}</p>
                </div>
            </div>
            </div>
        `;

        card.addEventListener("click", () => {
            card.classList.toggle("flipped");
        });

        document.getElementById("favoritesContainer").appendChild(card);
        });


  }).catch(error => {
    console.error("Error loading JSON data:", error);
    document.getElementById("favoritesContainer").innerHTML = `<p class="error">Could not load data for ${year}.</p>`;
  });
}
