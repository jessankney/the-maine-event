// ============================================================
// THE MAINE EVENT
// MAIN APPLICATION
// ============================================================

const map = L.map('map').setView([41.5, -75.8], 6);

L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: '&copy; OpenStreetMap contributors'
    }
).addTo(map);


// ============================================================
// TIMELINE
// ============================================================

const timelineStart = tripStart;
const timelineEnd = tripTimelineEnd;

const slider = document.getElementById('slider');
const timeDisplay = document.getElementById('time-display');
const timelineEventsElement = document.getElementById('timeline-events');
const playButton = document.getElementById('play-button');


// ============================================================
// STATUS PANEL
// ============================================================

const statusList = document.getElementById('status-list');
const statusProgress = document.getElementById('status-progress');
const statusFooter = document.getElementById('status-footer');


// ============================================================
// PLAYBACK
// ============================================================

let isPlaying = false;
let animationFrame = null;
const PLAY_DURATION = 18000;


// ============================================================
// MAP ICONS
// ============================================================

function createEmojiIcon(emoji, size = 28) {
    return L.divIcon({
        html: `
            <div style="
                font-size:${size}px;
                width:${size + 7}px;
                height:${size + 7}px;
                line-height:${size + 7}px;
                text-align:center;
            ">
                ${emoji}
            </div>
        `,
        className: '',
        iconSize: [size + 7, size + 7],
        iconAnchor: [(size + 7) / 2, (size + 7) / 2]
    });
}

const carIcon = L.divIcon({
    html: `
        <div style="
            font-size:28px;
            width:35px;
            height:35px;
            line-height:35px;
            text-align:center;
            transform:scaleX(-1);
        ">
            🚗
        </div>
    `,
    className: '',
    iconSize: [35, 35],
    iconAnchor: [17, 17]
});

const planeIcon = createEmojiIcon('✈️', 28);
const lobsterIcon = createEmojiIcon('🦞', 29);


// ============================================================
// HOME / START MARKERS
// ============================================================

const homeMarkers = {};

function makeHomeMarker(name, position, locationText) {
    const marker = L.marker(
        position,
        {
            icon: createEmojiIcon('🧍', 27)
        }
    )
    .addTo(map)
    .bindPopup(
        `<strong>🧍 ${name}</strong><br>${locationText}`
    );

    homeMarkers[name] = marker;
}

makeHomeMarker('Jess', tripLocations.jessHome, 'Blacksburg, VA');
makeHomeMarker('Sam', tripLocations.samHome, 'Buena Vista, VA');
makeHomeMarker('Olivia', tripLocations.oliviaHome, 'Virginia Beach, VA');
makeHomeMarker('Megan', tripLocations.meganHome, 'Virginia Beach, VA');
makeHomeMarker('Brennen', tripLocations.groupHome, 'Chesapeake / Virginia Beach');
makeHomeMarker('Mary', tripLocations.groupHome, 'Chesapeake / Virginia Beach');
makeHomeMarker('Marshall', tripLocations.marshallHome, 'Virginia Beach, VA');


// ============================================================
// DESTINATION
// ============================================================

L.marker(
    tripLocations.bethel,
    {
        icon: createEmojiIcon('🦞', 31)
    }
)
.addTo(map)
.bindPopup(
    '<strong>🦞 Bethel, Maine</strong><br>The Maine Event'
);


// ============================================================
// MOVING MARKERS
// ============================================================

const markers = {
    jessGroup: L.marker(
        tripLocations.jessHome,
        { icon: carIcon }
    ).addTo(map),

    megan: L.marker(
        tripLocations.meganHome,
        { icon: createEmojiIcon('🧍') }
    ).addTo(map),

    brennenMary: L.marker(
        tripLocations.groupHome,
        { icon: carIcon }
    ).addTo(map)
};


// ============================================================
// ROUTES
// ============================================================

const routes = {
    jessToSam: null,
    samToOlivia: null,
    oliviaToBethel: null,

    meganToAirport: null,
    providenceToBethel: null,

    groupToAirport: null,
    providenceToBethelGroup: null
};

const routeDistances = {
    jessToSam: null,
    samToOlivia: null,
    oliviaToBethel: null,

    meganToAirport: null,
    providenceToBethel: null,

    groupToAirport: null,
    providenceToBethelGroup: null
};


// ============================================================
// FLIGHT CURVES
// ============================================================

let meganFlightCurve = [];
let groupFlightCurve = [];

let meganFlightDistanceData = null;
let groupFlightDistanceData = null;


// ============================================================
// CURVED FLIGHT PATH
// ============================================================

function createFlightCurve(start, end, bend = 0.18, points = 80) {
    const startLat = start[0];
    const startLng = start[1];
    const endLat = end[0];
    const endLng = end[1];

    const midLat = (startLat + endLat) / 2;
    const midLng = (startLng + endLng) / 2;

    const deltaLat = endLat - startLat;
    const deltaLng = endLng - startLng;

    const distance = Math.sqrt(
        deltaLat * deltaLat +
        deltaLng * deltaLng
    );

    const perpendicularLat = -deltaLng / distance;
    const perpendicularLng = deltaLat / distance;

    const controlLat =
        midLat +
        perpendicularLat * distance * bend;

    const controlLng =
        midLng +
        perpendicularLng * distance * bend;

    const curve = [];

    for (let i = 0; i <= points; i++) {
        const t = i / points;
        const inverse = 1 - t;

        const latitude =
            inverse * inverse * startLat +
            2 * inverse * t * controlLat +
            t * t * endLat;

        const longitude =
            inverse * inverse * startLng +
            2 * inverse * t * controlLng +
            t * t * endLng;

        curve.push([latitude, longitude]);
    }

    return curve;
}

function calculateLatLngDistance(coordinates) {
    const distances = [0];
    let totalDistance = 0;

    for (let i = 1; i < coordinates.length; i++) {
        const previous = L.latLng(
            coordinates[i - 1][0],
            coordinates[i - 1][1]
        );

        const current = L.latLng(
            coordinates[i][0],
            coordinates[i][1]
        );

        totalDistance += previous.distanceTo(current);
        distances.push(totalDistance);
    }

    return {
        distances,
        totalDistance
    };
}

function positionAlongCurve(coordinates, distanceData, percentage) {
    if (!coordinates || !coordinates.length) {
        return tripLocations.bethel;
    }

    if (percentage <= 0) {
        return coordinates[0];
    }

    if (percentage >= 1) {
        return coordinates[coordinates.length - 1];
    }

    const targetDistance =
        distanceData.totalDistance * percentage;

    let index = 1;

    while (
        index < distanceData.distances.length &&
        distanceData.distances[index] < targetDistance
    ) {
        index++;
    }

    const previousDistance = distanceData.distances[index - 1];
    const currentDistance = distanceData.distances[index];

    const segmentProgress =
        (targetDistance - previousDistance) /
        (currentDistance - previousDistance);

    const previous = coordinates[index - 1];
    const current = coordinates[index];

    return [
        previous[0] +
        (current[0] - previous[0]) * segmentProgress,

        previous[1] +
        (current[1] - previous[1]) * segmentProgress
    ];
}

function getCurvePortion(coordinates, distanceData, percentage) {
    if (!coordinates || !coordinates.length || percentage <= 0) {
        return [];
    }

    if (percentage >= 1) {
        return coordinates;
    }

    const targetDistance =
        distanceData.totalDistance * percentage;

    const result = [];

    for (let i = 0; i < coordinates.length; i++) {
        const coordinate = coordinates[i];
        const distance = distanceData.distances[i];

        if (distance <= targetDistance) {
            result.push(coordinate);
            continue;
        }

        const previous = coordinates[i - 1];
        const previousDistance = distanceData.distances[i - 1];

        const segmentProgress =
            (targetDistance - previousDistance) /
            (distance - previousDistance);

        result.push([
            previous[0] +
            (coordinate[0] - previous[0]) * segmentProgress,

            previous[1] +
            (coordinate[1] - previous[1]) * segmentProgress
        ]);

        break;
    }

    return result;
}


// ============================================================
// ROUTE LAYERS
// ============================================================

const visibleRoutes = {
    jessToSam: L.polyline([], { weight: 5, opacity: 0.9 }).addTo(map),
    samToOlivia: L.polyline([], { weight: 5, opacity: 0.9 }).addTo(map),
    oliviaToBethel: L.polyline([], { weight: 5, opacity: 0.9 }).addTo(map),

    meganToAirport: L.polyline([], { weight: 4, opacity: 0.9 }).addTo(map),
    meganFlight: L.polyline([], {
        weight: 3,
        opacity: 0.9,
        dashArray: '6 8'
    }).addTo(map),
    meganToBethel: L.polyline([], { weight: 4, opacity: 0.9 }).addTo(map),

    groupToAirport: L.polyline([], { weight: 4, opacity: 0.9 }).addTo(map),
    groupFlight: L.polyline([], {
        weight: 3,
        opacity: 0.9,
        dashArray: '6 8'
    }).addTo(map),
    groupToBethel: L.polyline([], { weight: 4, opacity: 0.9 }).addTo(map)
};

const futureRoutes = {};


// ============================================================
// OSRM
// ============================================================

async function getRoute(start, end) {
    const startPoint = `${start[1]},${start[0]}`;
    const endPoint = `${end[1]},${end[0]}`;

    const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${startPoint};${endPoint}` +
        `?overview=full&geometries=geojson`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `OSRM routing failed: ${response.status}`
        );
    }

    const data = await response.json();

    if (!data.routes || !data.routes.length) {
        throw new Error('OSRM returned no route.');
    }

    return data.routes[0];
}

function calculateRouteDistances(coordinates) {
    const distances = [0];
    let totalDistance = 0;

    for (let i = 1; i < coordinates.length; i++) {
        const previous = L.latLng(
            coordinates[i - 1][1],
            coordinates[i - 1][0]
        );

        const current = L.latLng(
            coordinates[i][1],
            coordinates[i][0]
        );

        totalDistance += previous.distanceTo(current);
        distances.push(totalDistance);
    }

    return {
        distances,
        totalDistance
    };
}

function positionAlongRoute(
    coordinates,
    distanceData,
    percentage
) {
    if (!coordinates || !coordinates.length) {
        return tripLocations.bethel;
    }

    if (percentage <= 0) {
        return [coordinates[0][1], coordinates[0][0]];
    }

    if (percentage >= 1) {
        const last = coordinates[coordinates.length - 1];
        return [last[1], last[0]];
    }

    const targetDistance =
        distanceData.totalDistance * percentage;

    const distances = distanceData.distances;

    let index = 1;

    while (
        index < distances.length &&
        distances[index] < targetDistance
    ) {
        index++;
    }

    const previousDistance = distances[index - 1];
    const currentDistance = distances[index];

    const segmentProgress =
        (targetDistance - previousDistance) /
        (currentDistance - previousDistance);

    const previous = coordinates[index - 1];
    const current = coordinates[index];

    return [
        previous[1] +
        (current[1] - previous[1]) * segmentProgress,

        previous[0] +
        (current[0] - previous[0]) * segmentProgress
    ];
}

function getRoutePortion(
    coordinates,
    distanceData,
    percentage
) {
    if (!coordinates || !coordinates.length || percentage <= 0) {
        return [];
    }

    if (percentage >= 1) {
        return coordinates.map(
            coordinate => [coordinate[1], coordinate[0]]
        );
    }

    const targetDistance =
        distanceData.totalDistance * percentage;

    const result = [];

    for (let i = 0; i < coordinates.length; i++) {
        const coordinate = coordinates[i];
        const distance = distanceData.distances[i];

        if (distance <= targetDistance) {
            result.push([coordinate[1], coordinate[0]]);
            continue;
        }

        const previous = coordinates[i - 1];
        const previousDistance = distanceData.distances[i - 1];

        const segmentProgress =
            (targetDistance - previousDistance) /
            (distance - previousDistance);

        result.push([
            previous[1] +
            (coordinate[1] - previous[1]) * segmentProgress,

            previous[0] +
            (coordinate[0] - previous[0]) * segmentProgress
        ]);

        break;
    }

    return result;
}


// ============================================================
// TIME HELPERS
// ============================================================

function routeProgress(currentTime, departure, arrival) {
    if (currentTime <= departure) {
        return 0;
    }

    if (currentTime >= arrival) {
        return 1;
    }

    return (
        (currentTime - departure) /
        (arrival - departure)
    );
}

function getCurrentTime() {
    const percentage = Number(slider.value);

    return new Date(
        timelineStart.getTime() +
        (
            timelineEnd.getTime() -
            timelineStart.getTime()
        ) *
        percentage
    );
}

function addMinutes(date, minutes) {
    return new Date(
        date.getTime() +
        minutes * 60 * 1000
    );
}

function addSeconds(date, seconds) {
    return new Date(
        date.getTime() +
        seconds * 1000
    );
}


// ============================================================
// MARKER HELPERS
// ============================================================

function showPerson(name, position) {
    const marker = homeMarkers[name];

    if (!marker) {
        return;
    }

    marker.setLatLng(position);

    if (!map.hasLayer(marker)) {
        marker.addTo(map);
    }
}

function hidePerson(name) {
    const marker = homeMarkers[name];

    if (marker && map.hasLayer(marker)) {
        map.removeLayer(marker);
    }
}

function hideMovingMarker(marker) {
    if (marker && map.hasLayer(marker)) {
        map.removeLayer(marker);
    }
}

function showMovingMarker(marker) {
    if (marker && !map.hasLayer(marker)) {
        marker.addTo(map);
    }
}


// ============================================================
// TIME DISPLAY
// ============================================================

function updateTimeDisplay(currentTime) {
    timeDisplay.textContent =
        currentTime.toLocaleString(
            'en-US',
            {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            }
        );
}


// ============================================================
// JESS + SAM + OLIVIA
// ============================================================

function getJessTimes() {
    const departure = new Date(jessTrip.departure);

    const samArrival = addSeconds(
        departure,
        routes.jessToSam.duration
    );

    const samLeave = addMinutes(
        samArrival,
        jessTrip.samStopMinutes
    );

    const virginiaBeachArrival = addMinutes(
        addSeconds(
            samLeave,
            routes.samToOlivia.duration
        ),
        jessTrip.virginiaBeachStopMinutes
    );

    const virginiaBeachLeave = addMinutes(
        virginiaBeachArrival,
        jessTrip.virginiaBeachStayMinutes
    );

    const maineArrival = addMinutes(
        addSeconds(
            virginiaBeachLeave,
            routes.oliviaToBethel.duration
        ),
        jessTrip.maineStopMinutes
    );

    return {
        departure,
        samArrival,
        samLeave,
        virginiaBeachArrival,
        virginiaBeachLeave,
        maineArrival
    };
}

function updateJess(currentTime) {
    const times = getJessTimes();

    // Before leaving Blacksburg.
    if (currentTime < times.departure) {
        showPerson('Jess', tripLocations.jessHome);
        showPerson('Sam', tripLocations.samHome);
        showPerson('Olivia', tripLocations.oliviaHome);

        showMovingMarker(markers.jessGroup);

        markers.jessGroup.setLatLng(
            tripLocations.jessHome
        );
        markers.jessGroup.setIcon(carIcon);

        visibleRoutes.jessToSam.setLatLngs([]);
        visibleRoutes.samToOlivia.setLatLngs([]);
        visibleRoutes.oliviaToBethel.setLatLngs([]);

        return;
    }

    hidePerson('Jess');
    hidePerson('Sam');
    hidePerson('Olivia');

    // Blacksburg -> Buena Vista.
    if (currentTime < times.samArrival) {
        const progress = routeProgress(
            currentTime,
            times.departure,
            times.samArrival
        );

        markers.jessGroup.setIcon(carIcon);
        markers.jessGroup.setLatLng(
            positionAlongRoute(
                routes.jessToSam.geometry.coordinates,
                routeDistances.jessToSam,
                progress
            )
        );

        visibleRoutes.jessToSam.setLatLngs(
            getRoutePortion(
                routes.jessToSam.geometry.coordinates,
                routeDistances.jessToSam,
                progress
            )
        );

        visibleRoutes.samToOlivia.setLatLngs([]);
        visibleRoutes.oliviaToBethel.setLatLngs([]);

        return;
    }

    // 20-minute Buena Vista pickup.
    if (currentTime < times.samLeave) {
        markers.jessGroup.setLatLng(
            tripLocations.samHome
        );

        visibleRoutes.jessToSam.setLatLngs(
            getRoutePortion(
                routes.jessToSam.geometry.coordinates,
                routeDistances.jessToSam,
                1
            )
        );

        visibleRoutes.samToOlivia.setLatLngs([]);
        visibleRoutes.oliviaToBethel.setLatLngs([]);

        return;
    }

    // Buena Vista -> Virginia Beach.
    const vbDriveEnd = addSeconds(
        times.samLeave,
        routes.samToOlivia.duration
    );

    if (currentTime < vbDriveEnd) {
        const progress = routeProgress(
            currentTime,
            times.samLeave,
            vbDriveEnd
        );

        markers.jessGroup.setIcon(carIcon);
        markers.jessGroup.setLatLng(
            positionAlongRoute(
                routes.samToOlivia.geometry.coordinates,
                routeDistances.samToOlivia,
                progress
            )
        );

        visibleRoutes.jessToSam.setLatLngs(
            getRoutePortion(
                routes.jessToSam.geometry.coordinates,
                routeDistances.jessToSam,
                1
            )
        );

        visibleRoutes.samToOlivia.setLatLngs(
            getRoutePortion(
                routes.samToOlivia.geometry.coordinates,
                routeDistances.samToOlivia,
                progress
            )
        );

        visibleRoutes.oliviaToBethel.setLatLngs([]);

        return;
    }

    // 20-minute gas/stop buffer in the Virginia Beach arrival window.
    if (currentTime < times.virginiaBeachArrival) {
        markers.jessGroup.setLatLng(
            tripLocations.oliviaHome
        );

        visibleRoutes.jessToSam.setLatLngs(
            getRoutePortion(
                routes.jessToSam.geometry.coordinates,
                routeDistances.jessToSam,
                1
            )
        );

        visibleRoutes.samToOlivia.setLatLngs(
            getRoutePortion(
                routes.samToOlivia.geometry.coordinates,
                routeDistances.samToOlivia,
                1
            )
        );

        return;
    }

    // 2-hour window in VB before leaving around 4 AM.
    if (currentTime < times.virginiaBeachLeave) {
        markers.jessGroup.setLatLng(
            tripLocations.oliviaHome
        );

        visibleRoutes.jessToSam.setLatLngs(
            getRoutePortion(
                routes.jessToSam.geometry.coordinates,
                routeDistances.jessToSam,
                1
            )
        );

        visibleRoutes.samToOlivia.setLatLngs(
            getRoutePortion(
                routes.samToOlivia.geometry.coordinates,
                routeDistances.samToOlivia,
                1
            )
        );

        visibleRoutes.oliviaToBethel.setLatLngs([]);

        return;
    }

    // Virginia Beach -> Bethel.
    const maineDriveEnd = addSeconds(
        times.virginiaBeachLeave,
        routes.oliviaToBethel.duration
    );

    if (currentTime < maineDriveEnd) {
        const progress = routeProgress(
            currentTime,
            times.virginiaBeachLeave,
            maineDriveEnd
        );

        markers.jessGroup.setIcon(carIcon);
        markers.jessGroup.setLatLng(
            positionAlongRoute(
                routes.oliviaToBethel.geometry.coordinates,
                routeDistances.oliviaToBethel,
                progress
            )
        );

        visibleRoutes.jessToSam.setLatLngs(
            getRoutePortion(
                routes.jessToSam.geometry.coordinates,
                routeDistances.jessToSam,
                1
            )
        );

        visibleRoutes.samToOlivia.setLatLngs(
            getRoutePortion(
                routes.samToOlivia.geometry.coordinates,
                routeDistances.samToOlivia,
                1
            )
        );

        visibleRoutes.oliviaToBethel.setLatLngs(
            getRoutePortion(
                routes.oliviaToBethel.geometry.coordinates,
                routeDistances.oliviaToBethel,
                progress
            )
        );

        return;
    }

    // Planned stops on the Maine drive are represented as a short pause
    // before the final lobster arrival.
    if (currentTime < times.maineArrival) {
        markers.jessGroup.setLatLng(
            tripLocations.bethel
        );

        visibleRoutes.oliviaToBethel.setLatLngs(
            getRoutePortion(
                routes.oliviaToBethel.geometry.coordinates,
                routeDistances.oliviaToBethel,
                1
            )
        );

        return;
    }

    markers.jessGroup.setLatLng(tripLocations.bethel);
    markers.jessGroup.setIcon(lobsterIcon);

    visibleRoutes.jessToSam.setLatLngs(
        getRoutePortion(
            routes.jessToSam.geometry.coordinates,
            routeDistances.jessToSam,
            1
        )
    );

    visibleRoutes.samToOlivia.setLatLngs(
        getRoutePortion(
            routes.samToOlivia.geometry.coordinates,
            routeDistances.samToOlivia,
            1
        )
    );

    visibleRoutes.oliviaToBethel.setLatLngs(
        getRoutePortion(
            routes.oliviaToBethel.geometry.coordinates,
            routeDistances.oliviaToBethel,
            1
        )
    );
}


// ============================================================
// MEGAN
// ============================================================

function getMeganTimes() {
    const flightDeparture = new Date(meganTrip.flightDeparture);
    const airportArrival = new Date(meganTrip.airportArrival);
    const flightArrival = new Date(meganTrip.flightArrival);
    const providenceDeparture = new Date(meganTrip.providenceDeparture);

    const airportDeparture = addSeconds(
        airportArrival,
        -routes.meganToAirport.duration
    );

    const maineArrival = addSeconds(
        providenceDeparture,
        routes.providenceToBethel.duration
    );

    return {
        airportDeparture,
        airportArrival,
        flightDeparture,
        flightArrival,
        providenceDeparture,
        maineArrival
    };
}

function updateMegan(currentTime) {
    const times = getMeganTimes();

    hideMovingMarker(markers.megan);

    if (currentTime < times.airportDeparture) {
        showPerson('Megan', tripLocations.meganHome);
        markers.megan.setIcon(createEmojiIcon('🧍'));
        markers.megan.setLatLng(tripLocations.meganHome);

        visibleRoutes.meganToAirport.setLatLngs([]);
        visibleRoutes.meganFlight.setLatLngs([]);
        visibleRoutes.meganToBethel.setLatLngs([]);

        return;
    }

    hidePerson('Megan');
    showMovingMarker(markers.megan);

    if (currentTime < times.airportArrival) {
        const progress = routeProgress(
            currentTime,
            times.airportDeparture,
            times.airportArrival
        );

        markers.megan.setIcon(carIcon);
        markers.megan.setLatLng(
            positionAlongRoute(
                routes.meganToAirport.geometry.coordinates,
                routeDistances.meganToAirport,
                progress
            )
        );

        visibleRoutes.meganToAirport.setLatLngs(
            getRoutePortion(
                routes.meganToAirport.geometry.coordinates,
                routeDistances.meganToAirport,
                progress
            )
        );

        visibleRoutes.meganFlight.setLatLngs([]);
        visibleRoutes.meganToBethel.setLatLngs([]);

        return;
    }

    if (currentTime < times.flightDeparture) {
        markers.megan.setLatLng(
            tripLocations.norfolkAirport
        );
        markers.megan.setIcon(createEmojiIcon('🧍'));

        visibleRoutes.meganToAirport.setLatLngs(
            getRoutePortion(
                routes.meganToAirport.geometry.coordinates,
                routeDistances.meganToAirport,
                1
            )
        );

        visibleRoutes.meganFlight.setLatLngs([]);
        visibleRoutes.meganToBethel.setLatLngs([]);

        return;
    }

    if (currentTime < times.flightArrival) {
        const progress = routeProgress(
            currentTime,
            times.flightDeparture,
            times.flightArrival
        );

        markers.megan.setIcon(planeIcon);
        markers.megan.setLatLng(
            positionAlongCurve(
                meganFlightCurve,
                meganFlightDistanceData,
                progress
            )
        );

        visibleRoutes.meganFlight.setLatLngs(
            getCurvePortion(
                meganFlightCurve,
                meganFlightDistanceData,
                progress
            )
        );

        visibleRoutes.meganToBethel.setLatLngs([]);

        return;
    }

    if (currentTime < times.providenceDeparture) {
        markers.megan.setLatLng(
            tripLocations.providence
        );
        markers.megan.setIcon(createEmojiIcon('🧍'));

        visibleRoutes.meganFlight.setLatLngs(
            meganFlightCurve
        );
        visibleRoutes.meganToBethel.setLatLngs([]);

        return;
    }

    if (currentTime < times.maineArrival) {
        const progress = routeProgress(
            currentTime,
            times.providenceDeparture,
            times.maineArrival
        );

        markers.megan.setIcon(carIcon);
        markers.megan.setLatLng(
            positionAlongRoute(
                routes.providenceToBethel.geometry.coordinates,
                routeDistances.providenceToBethel,
                progress
            )
        );

        visibleRoutes.meganFlight.setLatLngs(
            meganFlightCurve
        );

        visibleRoutes.meganToBethel.setLatLngs(
            getRoutePortion(
                routes.providenceToBethel.geometry.coordinates,
                routeDistances.providenceToBethel,
                progress
            )
        );

        return;
    }

    markers.megan.setLatLng(tripLocations.bethel);
    markers.megan.setIcon(createEmojiIcon('🦞', 27));

    visibleRoutes.meganFlight.setLatLngs(meganFlightCurve);

    visibleRoutes.meganToBethel.setLatLngs(
        getRoutePortion(
            routes.providenceToBethel.geometry.coordinates,
            routeDistances.providenceToBethel,
            1
        )
    );
}


// ============================================================
// BRENNEN + MARY
// ============================================================

function getGroupTimes() {
    const flightDeparture = new Date(groupTrip.flightDeparture);
    const airportArrival = new Date(groupTrip.airportArrival);
    const flightArrival = new Date(groupTrip.flightArrival);
    const providenceDeparture = new Date(groupTrip.providenceDeparture);

    const airportDeparture = addSeconds(
        airportArrival,
        -routes.groupToAirport.duration
    );

    const maineArrival = addSeconds(
        providenceDeparture,
        routes.providenceToBethelGroup.duration
    );

    return {
        airportDeparture,
        airportArrival,
        flightDeparture,
        flightArrival,
        providenceDeparture,
        maineArrival
    };
}

function updateGroup(currentTime) {
    const times = getGroupTimes();

    hideMovingMarker(markers.brennenMary);

    if (currentTime < times.airportDeparture) {
        showPerson('Brennen', tripLocations.groupHome);
        showPerson('Mary', tripLocations.groupHome);

        markers.brennenMary.setIcon(carIcon);
        markers.brennenMary.setLatLng(tripLocations.groupHome);

        visibleRoutes.groupToAirport.setLatLngs([]);
        visibleRoutes.groupFlight.setLatLngs([]);
        visibleRoutes.groupToBethel.setLatLngs([]);

        return;
    }

    hidePerson('Brennen');
    hidePerson('Mary');
    showMovingMarker(markers.brennenMary);

    if (currentTime < times.airportArrival) {
        const progress = routeProgress(
            currentTime,
            times.airportDeparture,
            times.airportArrival
        );

        markers.brennenMary.setIcon(carIcon);
        markers.brennenMary.setLatLng(
            positionAlongRoute(
                routes.groupToAirport.geometry.coordinates,
                routeDistances.groupToAirport,
                progress
            )
        );

        visibleRoutes.groupToAirport.setLatLngs(
            getRoutePortion(
                routes.groupToAirport.geometry.coordinates,
                routeDistances.groupToAirport,
                progress
            )
        );

        visibleRoutes.groupFlight.setLatLngs([]);
        visibleRoutes.groupToBethel.setLatLngs([]);

        return;
    }

    if (currentTime < times.flightDeparture) {
        markers.brennenMary.setLatLng(
            tripLocations.norfolkAirport
        );
        markers.brennenMary.setIcon(
            createEmojiIcon('🧍')
        );

        visibleRoutes.groupToAirport.setLatLngs(
            getRoutePortion(
                routes.groupToAirport.geometry.coordinates,
                routeDistances.groupToAirport,
                1
            )
        );

        visibleRoutes.groupFlight.setLatLngs([]);
        visibleRoutes.groupToBethel.setLatLngs([]);

        return;
    }

    if (currentTime < times.flightArrival) {
        const progress = routeProgress(
            currentTime,
            times.flightDeparture,
            times.flightArrival
        );

        markers.brennenMary.setIcon(planeIcon);
        markers.brennenMary.setLatLng(
            positionAlongCurve(
                groupFlightCurve,
                groupFlightDistanceData,
                progress
            )
        );

        visibleRoutes.groupFlight.setLatLngs(
            getCurvePortion(
                groupFlightCurve,
                groupFlightDistanceData,
                progress
            )
        );

        visibleRoutes.groupToBethel.setLatLngs([]);

        return;
    }

    if (currentTime < times.providenceDeparture) {
        markers.brennenMary.setLatLng(
            tripLocations.providence
        );
        markers.brennenMary.setIcon(createEmojiIcon('🧍'));

        visibleRoutes.groupFlight.setLatLngs(
            groupFlightCurve
        );
        visibleRoutes.groupToBethel.setLatLngs([]);

        return;
    }

    if (currentTime < times.maineArrival) {
        const progress = routeProgress(
            currentTime,
            times.providenceDeparture,
            times.maineArrival
        );

        markers.brennenMary.setIcon(carIcon);
        markers.brennenMary.setLatLng(
            positionAlongRoute(
                routes.providenceToBethelGroup.geometry.coordinates,
                routeDistances.providenceToBethelGroup,
                progress
            )
        );

        visibleRoutes.groupFlight.setLatLngs(
            groupFlightCurve
        );

        visibleRoutes.groupToBethel.setLatLngs(
            getRoutePortion(
                routes.providenceToBethelGroup.geometry.coordinates,
                routeDistances.providenceToBethelGroup,
                progress
            )
        );

        return;
    }

    markers.brennenMary.setLatLng(tripLocations.bethel);
    markers.brennenMary.setIcon(createEmojiIcon('🦞', 28));

    visibleRoutes.groupFlight.setLatLngs(groupFlightCurve);

    visibleRoutes.groupToBethel.setLatLngs(
        getRoutePortion(
            routes.providenceToBethelGroup.geometry.coordinates,
            routeDistances.providenceToBethelGroup,
            1
        )
    );
}


// ============================================================
// STATUS PANEL
// ============================================================

function getStatus(currentTime) {
    const statuses = [];

    const jessTimes = getJessTimes();

    if (currentTime < jessTimes.departure) {
        statuses.push(['🧍', 'Jess', 'Home']);
    } else if (currentTime < jessTimes.samArrival) {
        statuses.push(['🚗', 'Jess', 'Driving to Sam']);
    } else if (currentTime < jessTimes.samLeave) {
        statuses.push(['👋', 'Jess', 'Picking up Sam']);
    } else if (currentTime < jessTimes.virginiaBeachLeave) {
        statuses.push(['🚗', 'Jess', 'With Sam / Olivia']);
    } else if (currentTime < jessTimes.maineArrival) {
        statuses.push(['🚗', 'Jess', 'Driving to Maine']);
    } else {
        statuses.push(['🦞', 'Jess', 'In Bethel']);
    }

    if (currentTime < jessTimes.samArrival) {
        statuses.push(['🧍', 'Sam', 'Waiting in Buena Vista']);
    } else if (currentTime < jessTimes.virginiaBeachLeave) {
        statuses.push(['🚗', 'Sam', 'Traveling with Jess']);
    } else if (currentTime < jessTimes.maineArrival) {
        statuses.push(['🚗', 'Sam', 'Driving to Maine']);
    } else {
        statuses.push(['🦞', 'Sam', 'In Bethel']);
    }

    if (currentTime < jessTimes.virginiaBeachArrival) {
        statuses.push(['🏠', 'Olivia', 'Home']);
    } else if (currentTime < jessTimes.virginiaBeachLeave) {
        statuses.push(['🚗', 'Olivia', 'Getting ready to leave']);
    } else if (currentTime < jessTimes.maineArrival) {
        statuses.push(['🚗', 'Olivia', 'Driving to Maine']);
    } else {
        statuses.push(['🦞', 'Olivia', 'In Bethel']);
    }

    const meganTimes = getMeganTimes();

    if (currentTime < meganTimes.airportDeparture) {
        statuses.push(['🧍', 'Megan', 'Home']);
    } else if (currentTime < meganTimes.airportArrival) {
        statuses.push(['🚗', 'Megan', 'Getting to ORF']);
    } else if (currentTime < meganTimes.flightDeparture) {
        statuses.push(['🧍', 'Megan', 'At ORF']);
    } else if (currentTime < meganTimes.flightArrival) {
        statuses.push(['✈️', 'Megan', 'Flying to PVD']);
    } else if (currentTime < meganTimes.providenceDeparture) {
        statuses.push(['📍', 'Megan', 'In Providence']);
    } else if (currentTime < meganTimes.maineArrival) {
        statuses.push(['🚗', 'Megan', 'Driving to Bethel']);
    } else {
        statuses.push(['🦞', 'Megan', 'In Bethel']);
    }

    const groupTimes = getGroupTimes();

    if (currentTime < groupTimes.airportDeparture) {
        statuses.push(['🏠', 'Brennen', 'Home']);
        statuses.push(['🏠', 'Mary', 'Home']);
    } else if (currentTime < groupTimes.airportArrival) {
        statuses.push(['🚗', 'Brennen', 'Getting to ORF']);
        statuses.push(['🚗', 'Mary', 'Getting to ORF']);
    } else if (currentTime < groupTimes.flightDeparture) {
        statuses.push(['🧍', 'Brennen', 'At ORF']);
        statuses.push(['🧍', 'Mary', 'At ORF']);
    } else if (currentTime < groupTimes.flightArrival) {
        statuses.push(['✈️', 'Brennen', 'Flying to PVD']);
        statuses.push(['✈️', 'Mary', 'Flying to PVD']);
    } else if (currentTime < groupTimes.providenceDeparture) {
        statuses.push(['📍', 'Brennen', 'In Providence']);
        statuses.push(['📍', 'Mary', 'In Providence']);
    } else if (currentTime < groupTimes.maineArrival) {
        statuses.push(['🚗', 'Brennen', 'Driving to Bethel']);
        statuses.push(['🚗', 'Mary', 'Driving to Bethel']);
    } else {
        statuses.push(['🦞', 'Brennen', 'In Bethel']);
        statuses.push(['🦞', 'Mary', 'In Bethel']);
    }

    const marshallDeparture = new Date(
        marshallTrip.travelTBD
    );

    if (currentTime < marshallDeparture) {
        statuses.push(['🕐', 'Marshall', 'Travel plans TBD']);
    } else {
        statuses.push(['🕐', 'Marshall', 'Travel plans TBD']);
    }

    return statuses;
}

function updateStatusPanel(currentTime) {
    const statuses = getStatus(currentTime);

    statusList.innerHTML =
        statuses.map(status => `
            <div class="status-row">
                <div class="status-icon">${status[0]}</div>
                <div class="status-name">${status[1]}</div>
                <div class="status-state">${status[2]}</div>
            </div>
        `).join('');

    const total = timelineEnd - timelineStart;
    const elapsed = currentTime - timelineStart;

    const percent = Math.max(
        0,
        Math.min(
            100,
            Math.round(elapsed / total * 100)
        )
    );

    statusProgress.textContent = `${percent}%`;

    const travelersHere = statuses.filter(
        status =>
            ['Jess', 'Sam', 'Olivia', 'Megan', 'Brennen', 'Mary']
                .includes(status[1])
    );

    const everyoneConfirmedThere =
        travelersHere.length === 6 &&
        travelersHere.every(status => status[0] === '🦞');

    if (everyoneConfirmedThere) {
        statusFooter.textContent =
            '🦞 EVERYONE WITH A PLAN IS HERE';
    } else if (currentTime >= tripCheckIn) {
        statusFooter.textContent =
            '🏡 Check-in time has arrived';
    } else {
        statusFooter.textContent =
            'Everybody is making their way north...';
    }
}


// ============================================================
// TIMELINE EVENTS
// ============================================================

function createTimelineEvents() {
    timelineEventsElement.innerHTML = '';

    timelineEvents.forEach(event => {
        const eventTime = new Date(event.time);

        const percentage =
            (eventTime - timelineStart) /
            (timelineEnd - timelineStart);

        if (percentage < 0 || percentage > 1) {
            return;
        }

        const element = document.createElement('div');
        element.className = 'timeline-event';
        element.style.left = `${percentage * 100}%`;

        const readableTime =
            eventTime.toLocaleString(
                'en-US',
                {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                }
            );

        element.innerHTML = `
            <div class="timeline-event-dot"></div>

            <div class="timeline-event-tooltip">
                <span class="timeline-event-tooltip-emoji">
                    ${event.emoji}
                </span>

                ${event.label}

                <span class="timeline-event-tooltip-time">
                    ${readableTime}
                </span>
            </div>
        `;

        element.addEventListener('click', () => {
            pauseTimeline();
            slider.value = percentage;
            updateMap();
        });

        timelineEventsElement.appendChild(element);
    });
}


// ============================================================
// UPDATE EVERYTHING
// ============================================================

function updateMap() {
    const currentTime = getCurrentTime();

    updateTimeDisplay(currentTime);
    updateJess(currentTime);
    updateMegan(currentTime);
    updateGroup(currentTime);
    updateStatusPanel(currentTime);
}


// ============================================================
// SLIDER
// ============================================================

slider.addEventListener('input', () => {
    pauseTimeline();
    updateMap();
});


// ============================================================
// PLAYBACK
// ============================================================

function playTimeline() {
    if (isPlaying) {
        return;
    }

    isPlaying = true;
    playButton.textContent = '⏸ Pause';

    const startValue = Number(slider.value);
    const startTime = performance.now();

    function animate(now) {
        if (!isPlaying) {
            return;
        }

        const elapsed = now - startTime;

        const progress = Math.min(
            elapsed / PLAY_DURATION,
            1
        );

        const newValue =
            startValue +
            (1 - startValue) * progress;

        slider.value = newValue;
        updateMap();

        if (progress < 1) {
            animationFrame =
                requestAnimationFrame(animate);
        } else {
            isPlaying = false;
            animationFrame = null;
            playButton.textContent = '▶ Play';
        }
    }

    animationFrame =
        requestAnimationFrame(animate);
}

function pauseTimeline() {
    isPlaying = false;

    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }

    playButton.textContent = '▶ Play';
}

playButton.addEventListener('click', () => {
    if (isPlaying) {
        pauseTimeline();
        return;
    }

    if (Number(slider.value) >= 0.9999) {
        slider.value = 0;
    }

    playTimeline();
});


// ============================================================
// INITIALIZATION
// ============================================================

async function initialize() {
    try {
        timeDisplay.textContent = 'Loading map...';

        // Jess + Sam + Olivia
        routes.jessToSam =
            await getRoute(
                tripLocations.jessHome,
                tripLocations.samHome
            );

        routes.samToOlivia =
            await getRoute(
                tripLocations.samHome,
                tripLocations.oliviaHome
            );

        routes.oliviaToBethel =
            await getRoute(
                tripLocations.oliviaHome,
                tripLocations.bethel
            );

        // Megan
        routes.meganToAirport =
            await getRoute(
                tripLocations.meganHome,
                tripLocations.norfolkAirport
            );

        routes.providenceToBethel =
            await getRoute(
                tripLocations.providence,
                tripLocations.bethel
            );

        // Brennen + Mary
        routes.groupToAirport =
            await getRoute(
                tripLocations.groupHome,
                tripLocations.norfolkAirport
            );

        routes.providenceToBethelGroup =
            routes.providenceToBethel;

        // Distances
        routeDistances.jessToSam =
            calculateRouteDistances(
                routes.jessToSam.geometry.coordinates
            );

        routeDistances.samToOlivia =
            calculateRouteDistances(
                routes.samToOlivia.geometry.coordinates
            );

        routeDistances.oliviaToBethel =
            calculateRouteDistances(
                routes.oliviaToBethel.geometry.coordinates
            );

        routeDistances.meganToAirport =
            calculateRouteDistances(
                routes.meganToAirport.geometry.coordinates
            );

        routeDistances.providenceToBethel =
            calculateRouteDistances(
                routes.providenceToBethel.geometry.coordinates
            );

        routeDistances.groupToAirport =
            calculateRouteDistances(
                routes.groupToAirport.geometry.coordinates
            );

        routeDistances.providenceToBethelGroup =
            routeDistances.providenceToBethel;

        // Flights: ORF -> PVD
        meganFlightCurve =
            createFlightCurve(
                tripLocations.norfolkAirport,
                tripLocations.providenceAirport,
                0.20,
                100
            );

        groupFlightCurve =
            createFlightCurve(
                tripLocations.norfolkAirport,
                tripLocations.providenceAirport,
                -0.20,
                100
            );

        meganFlightDistanceData =
            calculateLatLngDistance(
                meganFlightCurve
            );

        groupFlightDistanceData =
            calculateLatLngDistance(
                groupFlightCurve
            );

        // Future routes
        futureRoutes.jessToSam = L.polyline(
            routes.jessToSam.geometry.coordinates.map(
                c => [c[1], c[0]]
            ),
            { weight: 4, opacity: 0.12 }
        ).addTo(map);

        futureRoutes.samToOlivia = L.polyline(
            routes.samToOlivia.geometry.coordinates.map(
                c => [c[1], c[0]]
            ),
            { weight: 4, opacity: 0.12 }
        ).addTo(map);

        futureRoutes.oliviaToBethel = L.polyline(
            routes.oliviaToBethel.geometry.coordinates.map(
                c => [c[1], c[0]]
            ),
            { weight: 4, opacity: 0.12 }
        ).addTo(map);

        futureRoutes.meganToAirport = L.polyline(
            routes.meganToAirport.geometry.coordinates.map(
                c => [c[1], c[0]]
            ),
            { weight: 4, opacity: 0.12 }
        ).addTo(map);

        futureRoutes.meganFlight = L.polyline(
            meganFlightCurve,
            {
                weight: 3,
                opacity: 0.12,
                dashArray: '6 8'
            }
        ).addTo(map);

        futureRoutes.meganToBethel = L.polyline(
            routes.providenceToBethel.geometry.coordinates.map(
                c => [c[1], c[0]]
            ),
            { weight: 4, opacity: 0.12 }
        ).addTo(map);

        futureRoutes.groupToAirport = L.polyline(
            routes.groupToAirport.geometry.coordinates.map(
                c => [c[1], c[0]]
            ),
            { weight: 4, opacity: 0.12 }
        ).addTo(map);

        futureRoutes.groupFlight = L.polyline(
            groupFlightCurve,
            {
                weight: 3,
                opacity: 0.12,
                dashArray: '6 8'
            }
        ).addTo(map);

        futureRoutes.groupToBethel = L.polyline(
            routes.providenceToBethel.geometry.coordinates.map(
                c => [c[1], c[0]]
            ),
            { weight: 4, opacity: 0.12 }
        ).addTo(map);

        const allRoutes = L.featureGroup([
            futureRoutes.jessToSam,
            futureRoutes.samToOlivia,
            futureRoutes.oliviaToBethel,
            futureRoutes.meganToAirport,
            futureRoutes.meganFlight,
            futureRoutes.meganToBethel,
            futureRoutes.groupToAirport,
            futureRoutes.groupFlight,
            futureRoutes.groupToBethel
        ]);

        map.fitBounds(
            allRoutes.getBounds(),
            {
                padding: [50, 50]
            }
        );

        createTimelineEvents();

        slider.value = 0;
        updateMap();

        console.log(
            'The Maine Event initialized successfully.'
        );

    } catch (error) {
        console.error(
            'The Maine Event could not initialize:',
            error
        );

        timeDisplay.textContent =
            'Map failed to load';

        statusList.innerHTML = `
            <div class="status-row">
                <div class="status-icon">⚠️</div>
                <div class="status-name">Map error</div>
                <div class="status-state">Check console</div>
            </div>
        `;

        statusFooter.textContent =
            'Something went wrong loading the routes.';
    }
}

initialize();
