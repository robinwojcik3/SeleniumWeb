// Le script est chargé après le corps du HTML, l'élément #map est donc garanti d'exister.

// 1. Initialisation de la carte Leaflet
// La vue est centrée sur Grenoble ([latitude, longitude], niveau de zoom).
const map = L.map('map').setView([45.1885, 5.7245], 13);

// 2. Ajout d'un fond de carte (Tile Layer)
// Utilisation d'OpenTopoMap pour un rendu topographique.
L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
}).addTo(map);

// 3. Gestion de la sélection de points sur la carte
let selectedMarker = null; // Variable pour stocker le marqueur actuel

// Ajout d'un écouteur d'événement pour le clic sur la carte
map.on('click', function(e) {
    // Si un marqueur existe déjà, il est supprimé de la carte.
    if (selectedMarker) {
        map.removeLayer(selectedMarker);
    }

    // Création d'un nouveau marqueur aux coordonnées du clic.
    selectedMarker = L.marker(e.latlng).addTo(map);

    // Ajout d'une popup au marqueur avec les coordonnées formatées.
    selectedMarker.bindPopup(`<b>Coordonnées du point</b><br>Latitude: ${e.latlng.lat.toFixed(5)}<br>Longitude: ${e.latlng.lng.toFixed(5)}`).openPopup();

    // Affiche les coordonnées dans la console du navigateur pour le débogage.
    console.log(`Point sélectionné - Latitude: ${e.latlng.lat}, Longitude: ${e.latlng.lng}`);

    // Les coordonnées (e.latlng) sont maintenant disponibles pour être envoyées
    // à l'extension Chrome via un protocole de communication à définir.
});
