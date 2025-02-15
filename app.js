const map = L.map('map', {
    doubleClickZoom: false
}).setView([0, 0], 2);

let userMaker;

map.locate({ setView: true, maxZoom: 16 });

map.on('locationfound', (e) => {
    if (userMaker) {
        map.removeLayer(userMaker);
    }
    userMaker = L.marker(e.latlng).addTo(map).bindPopup('You are here').openPopup();
});

map.on('locationerror', function () {
    alert("Location access denied or unavailable.");
});

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=YOUR_ACCESS_TOKEN', {
    attribution: 'Map data © OpenStreetMap contributors, Imagery © Mapbox',
    maxZoom: 20,
}).addTo(map);

// Function to create a triangle with click behavior
function createTriangle(coords, level = 1) {
    const triangle = L.polygon(coords, { color: 'white', fillColor: 'white', fillOpacity: 0 }).addTo(map);

    let clickCount = 0;
    const maxLevel = 19;

    triangle.on('click', function () {
        clickCount++;
        if (clickCount < 11) {
            const currentOpacity = this.options.fillOpacity;
            if (currentOpacity < 1) {
                this.setStyle({ fillOpacity: currentOpacity + 0.1 });
            }
        } else {
            if (level < maxLevel) {
                const latlngs = this.getLatLngs()[0]; // Get the current triangle’s vertices
                const [A, B, C] = latlngs;

                // Calculate midpoints
                const AB_mid = L.latLng((A.lat + B.lat) / 2, (A.lng + B.lng) / 2);
                const BC_mid = L.latLng((B.lat + C.lat) / 2, (B.lng + C.lng) / 2);
                const CA_mid = L.latLng((C.lat + A.lat) / 2, (C.lng + A.lng) / 2);

                // Create four new triangles at the next level
                createTriangle([A, AB_mid, CA_mid], level + 1);
                createTriangle([B, AB_mid, BC_mid], level + 1);
                createTriangle([C, BC_mid, CA_mid], level + 1);
                createTriangle([AB_mid, BC_mid, CA_mid], level + 1);

                // Remove the original triangle after splitting
                map.removeLayer(this);
            } else {
                // At max level, change triangle to red and prevent further divisions
                this.setStyle({ fillColor: 'red', fillOpacity: 1 });
            }
        }
    });
}

// Define the vertices of an icosahedron (approximated for a spherical Earth)
const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
const vertices = [
    [0, 1, phi], [0, -1, phi], [0, 1, -phi], [0, -1, -phi],
    [1, phi, 0], [-1, phi, 0], [1, -phi, 0], [-1, -phi, 0],
    [phi, 0, 1], [-phi, 0, 1], [phi, 0, -1], [-phi, 0, -1]
];

// Convert 3D vertices to latitude and longitude
function toLatLng([x, y, z]) {
    const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * (180 / Math.PI);
    const lng = Math.atan2(y, x) * (180 / Math.PI);
    return [lat, lng];
}

// Define the 20 triangles of the icosahedron
const triangles = [
    [vertices[0], vertices[1], vertices[8]],
    [vertices[0], vertices[8], vertices[4]],
    [vertices[0], vertices[4], vertices[5]],
    [vertices[0], vertices[5], vertices[9]],
    [vertices[0], vertices[9], vertices[1]],
    [vertices[1], vertices[9], vertices[10]],
    [vertices[1], vertices[10], vertices[6]],
    [vertices[1], vertices[6], vertices[8]],
    [vertices[8], vertices[6], vertices[2]],
    [vertices[8], vertices[2], vertices[4]],
    [vertices[4], vertices[2], vertices[7]],
    [vertices[4], vertices[7], vertices[5]],
    [vertices[5], vertices[7], vertices[3]],
    [vertices[5], vertices[3], vertices[9]],
    [vertices[9], vertices[3], vertices[10]],
    [vertices[10], vertices[3], vertices[11]],
    [vertices[10], vertices[11], vertices[6]],
    [vertices[6], vertices[11], vertices[2]],
    [vertices[2], vertices[11], vertices[7]],
    [vertices[7], vertices[11], vertices[3]]
];

// Create the 20 triangles on the map
triangles.forEach(triangle => {
    const coords = triangle.map(vertex => toLatLng(vertex));
    createTriangle(coords);
});