document.addEventListener('DOMContentLoaded', () => {
    // Initialisation de la carte avec une vue centrée sur Grenoble (exemple)
    const map = L.map('map').setView([45.1885, 5.7245], 13); // Coordonnées de Grenoble

    // Ajout du fond de carte OpenTopoMap
    L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 17,
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    }).addTo(map);

    let selectedMarker = null;

    // Gestionnaire d'événements pour le clic sur la carte
    map.on('click', function(e) {
        if (selectedMarker) {
            map.removeLayer(selectedMarker); // Supprime l'ancien marqueur si existant
        }

        // Ajoute un nouveau marqueur à l'emplacement du clic
        selectedMarker = L.marker(e.latlng).addTo(map)
            .bindPopup(`Point sélectionné : ${e.latlng.lat}, ${e.latlng.lng}`)
            .openPopup();

        console.log("Coordonnées sélectionnées :", e.latlng.lat, e.latlng.lng);
        // Ici, les coordonnées (e.latlng.lat, e.latlng.lng) peuvent être utilisées pour lancer des analyses.
    });
});
