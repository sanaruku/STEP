
const map = L.map('map', {
    doubleClickZoom: false
}).setView([0, 0], 2);

let userMaker;

map.locate({setView: true, maxZoom: 16});

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


// Define a triangle (just an example, not based on an actual icosahedron vertex)
const triangleCoords = [
    [10, -10],  // Point 1: Latitude 10, Longitude -10
    [0, 20],    // Point 2: Latitude 0, Longitude 20
    [-10, -10]  // Point 3: Latitude -10, Longitude -10
];


// Create a polygon (triangle) and add it to the map
const triangle = L.polygon(triangleCoords, { color: 'white', fillColor: 'white', fillOpacity: 0 }).addTo(map);


// Listen for click events on the triangle
let currentOpacity = 0.1;
let clickCount = 0;
// Listen for click events on the triangle
triangle.on('click', function () {
    clickCount++;
    // Use the global currentOpacity variable
    if (clickCount < 11) {
        const currentOpacity = this.options.fillOpacity;
        if(currentOpacity < 1){
            this.setStyle({ fillOpacity: currentOpacity + 0.1 });
        }
        
    } else {
        const latlngs = this.getLatLngs()[0]; // Get the current triangle’s vertices
        const [A, B, C] = latlngs;

        // Calculate midpoints
        const AB_mid = L.latLng((A.lat + B.lat) / 2, (A.lng + B.lng) / 2);
        const BC_mid = L.latLng((B.lat + C.lat) / 2, (B.lng + C.lng) / 2);
        const CA_mid = L.latLng((C.lat + A.lat) / 2, (C.lng + A.lng) / 2);

        // Create four new triangles
        const triangle1 = L.polygon([A, AB_mid, CA_mid], { color: 'white', fillColor: 'white', fillOpacity: 0 }).addTo(map);
        const triangle2 = L.polygon([B, AB_mid, BC_mid], { color: 'white', fillColor: 'white', fillOpacity: 0 }).addTo(map);
        const triangle3 = L.polygon([C, BC_mid, CA_mid], { color: 'white', fillColor: 'white', fillOpacity: 0 }).addTo(map);
        const triangle4 = L.polygon([AB_mid, BC_mid, CA_mid], { color: 'white', fillColor: 'white', fillOpacity: 0 }).addTo(map);

        // Remove the original triangle from the map
        map.removeLayer(this);
    }
});

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
            } else {
                // At max level, change triangle to red and prevent further divisions
                this.setStyle({ fillColor: 'red', fillOpacity: 1 });
            }
        }
    });
}

// When you create a new triangle, start with level 1
addTriangleClickListeners(triangle, 1);
