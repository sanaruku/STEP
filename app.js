const map = L.map('map', {
    doubleClickZoom: false
}).setView([0, 0], 2);

let userMarker;

map.locate({ setView: true, maxZoom: 16 });

map.on('locationfound', (e) => {
    if (userMarker) {
        map.removeLayer(userMarker);
    }
    userMarker = L.marker(e.latlng).addTo(map).bindPopup('You are here').openPopup();

    // Adjust the triangle such that the user's location is the centroid
    adjustTriangleToUserLocation(e.latlng);
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

// Example triangle definition (just for initial placement)
const triangleCoords = [
    [10, -10],  // Point 1: Latitude 10, Longitude -10
    [0, 20],    // Point 2: Latitude 0, Longitude 20
    [-10, -10]  // Point 3: Latitude -10, Longitude -10
];

// Create a polygon (triangle) and add it to the map
let triangle = L.polygon(triangleCoords, { color: 'white', fillColor: 'white', fillOpacity: 0 }).addTo(map);

// Function to adjust triangle position such that the user's location is the centroid
function adjustTriangleToUserLocation(userLatLng) {
    // Triangle centroid formula: (A + B + C) / 3
    const centroid = L.latLng(userLatLng.lat, userLatLng.lng); // User's location is the centroid

    // Calculate the difference between the original centroid and the new centroid
    const originalCentroid = L.latLng(
        (triangleCoords[0][0] + triangleCoords[1][0] + triangleCoords[2][0]) / 3,
        (triangleCoords[0][1] + triangleCoords[1][1] + triangleCoords[2][1]) / 3
    );

    const offsetLat = centroid.lat - originalCentroid.lat;
    const offsetLng = centroid.lng - originalCentroid.lng;

    // Adjust the triangle's vertices by the calculated offset
    const adjustedCoords = triangleCoords.map(coord => {
        return [coord[0] + offsetLat, coord[1] + offsetLng];
    });

    // Update the triangle's position
    triangle.setLatLngs(adjustedCoords);
}

function addTriangleClickListeners(triangle, currentLevel) {
    let triangleClickCount = 0;
    const maxLevel = 19;

    triangle.on('click', function () {
        triangleClickCount++;
        if (triangleClickCount < 11) {
            const currentOpacity = this.options.fillOpacity;
            if (currentOpacity < 1) {
                this.setStyle({ fillOpacity: currentOpacity + 0.1 });
            }
        } else {
            if (currentLevel < maxLevel) {
                const latlngs = this.getLatLngs()[0]; // Get the current triangle’s vertices
                const [A, B, C] = latlngs;

                // Calculate midpoints
                const AB_mid = L.latLng((A.lat + B.lat) / 2, (A.lng + B.lng) / 2);
                const BC_mid = L.latLng((B.lat + C.lat) / 2, (B.lng + C.lng) / 2);
                const CA_mid = L.latLng((C.lat + A.lat) / 2, (C.lng + A.lng) / 2);

                // Create four new triangles at the next level
                const triangle1 = L.polygon([A, AB_mid, CA_mid], { color: 'white', fillColor: 'white', fillOpacity: 0 }).addTo(map);
                addTriangleClickListeners(triangle1, currentLevel + 1);

                const triangle2 = L.polygon([B, AB_mid, BC_mid], { color: 'white', fillColor: 'white', fillOpacity: 0 }).addTo(map);
                addTriangleClickListeners(triangle2, currentLevel + 1);

                const triangle3 = L.polygon([C, BC_mid, CA_mid], { color: 'white', fillColor: 'white', fillOpacity: 0 }).addTo(map);
                addTriangleClickListeners(triangle3, currentLevel + 1);

                const triangle4 = L.polygon([AB_mid, BC_mid, CA_mid], { color: 'white', fillColor: 'white', fillOpacity: 0 }).addTo(map);
                addTriangleClickListeners(triangle4, currentLevel + 1);

                // Remove the original triangle after splitting
                map.removeLayer(this);

                // Update the current level in the DOM
                document.getElementById('current-level').textContent = currentLevel + 1;
            } else {
                // At max level, change triangle to red and prevent further divisions
                this.setStyle({ fillColor: 'red', fillOpacity: 1 });
            }
        }
    });
}


// When you create a new triangle, start with level 1
addTriangleClickListeners(triangle, 1);

// Define the latitudes for slicing
const northLatitude = 80; // 80° North
const southLatitude = -80; // 80° South

// Define the number of divisions (e.g., 12 divisions for 24 triangles)
const divisions = 12;
const longitudeStep = 360 / divisions; // 30° per division

// Create triangles in the Northern Hemisphere
for (let i = 0; i < divisions; i++) {
    const startLng = -180 + i * longitudeStep;
    const endLng = startLng + longitudeStep;

    // Define the vertices of the triangle (base on the north side)
    const triangleCoords = [
        [northLatitude, startLng], // Top-left vertex
        [northLatitude, endLng],   // Top-right vertex
        [0, (startLng + endLng) / 2] // Bottom vertex (midpoint)
    ];

    // Create the triangle
    createTriangle(triangleCoords);
}

// Create triangles in the Southern Hemisphere
for (let i = 0; i < divisions; i++) {
    const startLng = -180 + i * longitudeStep;
    const endLng = startLng + longitudeStep;

    // Define the vertices of the triangle (base on the south side)
    const triangleCoords = [
        [southLatitude, startLng], // Bottom-left vertex
        [southLatitude, endLng],   // Bottom-right vertex
        [0, (startLng + endLng) / 2] // Top vertex (midpoint)
    ];

    // Create the triangle
    createTriangle(triangleCoords);
}

// Add a central boundary line for visualization
const centralVerticalLine = L.polyline(
    [
        [90, 0], // North Pole
        [-90, 0] // South Pole
    ],
    { color: 'red', weight: 2 }
).addTo(map);

// Add a central horizontal line at the equator
const centralHorizontalLine = L.polyline(
    [
        [0, -180],  // Leftmost longitude at the equator
        [0, 180]    // Rightmost longitude at the equator
    ],
    { color: 'blue', weight: 2 }
).addTo(map);

