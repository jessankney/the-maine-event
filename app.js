// ============================================================
// THE MAINE EVENT
// MAIN APPLICATION
// ============================================================


// ============================================================
// MAP
// ============================================================

const map = L.map('map').setView(
    [41.5, -76.5],
    6
);


L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution:
            '&copy; OpenStreetMap contributors'
    }
).addTo(map);


// ============================================================
// TIMELINE
// ============================================================

const timelineStart =
    tripStart;

const timelineEnd =
    tripTimelineEnd;


const slider =
    document.getElementById('slider');

const timeDisplay =
    document.getElementById('time-display');

const timelineEventsElement =
    document.getElementById('timeline-events');

const playButton =
    document.getElementById('play-button');


// ============================================================
// STATUS PANEL
// ============================================================

const statusList =
    document.getElementById('status-list');

const statusProgress =
    document.getElementById('status-progress');

const statusFooter =
    document.getElementById('status-footer');


// ============================================================
// PLAYBACK
// ============================================================

let isPlaying = false;

let animationFrame = null;

const PLAY_DURATION = 18000;


// ============================================================
// MAP ICONS
// ============================================================

function createEmojiIcon(
    emoji,
    size = 28
) {

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

        iconSize: [
            size + 7,
            size + 7
        ],

        iconAnchor: [
            (size + 7) / 2,
            (size + 7) / 2
        ]

    });

}


const carIcon =
    L.divIcon({

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

        iconSize: [
            35,
            35
        ],

        iconAnchor: [
            17,
            17
        ]

    });


const planeIcon =
    createEmojiIcon(
        '✈️',
        28
    );


// ============================================================
// HOME MARKERS
// ============================================================

const homeMarkers = {};


function makeHomeMarker(
    name,
    position,
    locationText
) {

    const marker =
        L.marker(
            position,
            {
                icon:
                    createEmojiIcon(
                        '🧍',
                        27
                    )
            }
        )
        .addTo(map)
        .bindPopup(
            `<strong>🧍 ${name}</strong><br>${locationText}`
        );

    homeMarkers[name] =
        marker;

}


// Jess
makeHomeMarker(
    'Jess',
    tripLocations.jessHome,
    'Blacksburg, VA'
);


// Sam
makeHomeMarker(
    'Sam',
    tripLocations.samHome,
    'Buena Vista, VA'
);


// Megan
makeHomeMarker(
    'Megan',
    tripLocations.meganHome,
    'Virginia Beach, VA'
);


// Group
groupTrip.names.forEach(
    name => {

        makeHomeMarker(
            name,
            tripLocations.groupHome,
            'Chesapeake / Virginia Beach'
        );

    }
);


// ============================================================
// DESTINATION
// ============================================================

const bethelMarker =
    L.marker(
        tripLocations.bethel,
        {
            icon:
                createEmojiIcon(
                    '🦞',
                    31
                )
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

    jess:
        L.marker(
            tripLocations.jessHome,
            {
                icon: carIcon
            }
        ).addTo(map),

    megan:
        L.marker(
            tripLocations.meganHome,
            {
                icon:
                    createEmojiIcon(
                        '🧍'
                    )
            }
        ).addTo(map),

    group:
        L.marker(
            tripLocations.groupHome,
            {
                icon:
                    carIcon
            }
        ).addTo(map)

};


// ============================================================
// ROUTE DATA
// ============================================================

let routes = {

    jessToSam: null,

    samToBethel: null,

    meganToAirport: null,

    meganBostonToBethel: null,

    groupToAirport: null,

    groupBostonToBethel: null

};


let routeDistances = {

    jessToSam: null,

    samToBethel: null,

    meganToAirport: null,

    meganBostonToBethel: null,

    groupToAirport: null,

    groupBostonToBethel: null

};


// ============================================================
// FLIGHT CURVES
// ============================================================
//
// These are generated after the map locations are loaded.
// Megan and the group intentionally use opposite curves
// so their flight paths do not overlap.
//
// ============================================================

let meganFlightCurve = [];

let groupFlightCurve = [];

let meganFlightDistanceData = null;

let groupFlightDistanceData = null;


// ============================================================
// CREATE CURVED FLIGHT PATH
// ============================================================
//
// Uses a quadratic Bezier curve between two geographic
// points. "bend" controls which direction the arc bows.
//
// Positive bend = one side
// Negative bend = the other side
//
// ============================================================

function createFlightCurve(
    start,
    end,
    bend = 0.18,
    points = 80
) {

    const startLat =
        start[0];

    const startLng =
        start[1];

    const endLat =
        end[0];

    const endLng =
        end[1];


    const midLat =
        (
            startLat +
            endLat
        ) / 2;


    const midLng =
        (
            startLng +
            endLng
        ) / 2;


    const deltaLat =
        endLat -
        startLat;

    const deltaLng =
        endLng -
        startLng;


    const distance =
        Math.sqrt(
            deltaLat * deltaLat +
            deltaLng * deltaLng
        );


    // Perpendicular vector.
    //
    // This determines which direction
    // the curve bends.

    const perpendicularLat =
        -deltaLng /
        distance;

    const perpendicularLng =
        deltaLat /
        distance;


    const controlLat =
        midLat +
        perpendicularLat *
        distance *
        bend;


    const controlLng =
        midLng +
        perpendicularLng *
        distance *
        bend;


    const curve = [];


    for (
        let i = 0;
        i <= points;
        i++
    ) {

        const t =
            i / points;

        const inverse =
            1 - t;


        const latitude =
            inverse * inverse * startLat +
            2 * inverse * t * controlLat +
            t * t * endLat;


        const longitude =
            inverse * inverse * startLng +
            2 * inverse * t * controlLng +
            t * t * endLng;


        curve.push([
            latitude,
            longitude
        ]);

    }


    return curve;

}


// ============================================================
// CURVE DISTANCE CALCULATION
// ============================================================

function calculateLatLngDistance(
    coordinates
) {

    const distances = [0];

    let totalDistance = 0;


    for (
        let i = 1;
        i < coordinates.length;
        i++
    ) {

        const previous =
            L.latLng(
                coordinates[i - 1][0],
                coordinates[i - 1][1]
            );

        const current =
            L.latLng(
                coordinates[i][0],
                coordinates[i][1]
            );


        totalDistance +=
            previous.distanceTo(
                current
            );


        distances.push(
            totalDistance
        );

    }


    return {

        distances,

        totalDistance

    };

}


// ============================================================
// POSITION ALONG FLIGHT CURVE
// ============================================================

function positionAlongCurve(
    coordinates,
    distanceData,
    percentage
) {

    if (
        !coordinates ||
        !coordinates.length
    ) {

        return tripLocations.bethel;

    }


    if (
        percentage <= 0
    ) {

        return coordinates[0];

    }


    if (
        percentage >= 1
    ) {

        return coordinates[
            coordinates.length - 1
        ];

    }


    const targetDistance =
        distanceData.totalDistance *
        percentage;


    let index = 1;


    while (
        index <
        distanceData.distances.length &&
        distanceData.distances[index] <
        targetDistance
    ) {

        index++;

    }


    const previousDistance =
        distanceData.distances[
            index - 1
        ];

    const currentDistance =
        distanceData.distances[
            index
        ];


    const segmentProgress =
        (
            targetDistance -
            previousDistance
        ) /
        (
            currentDistance -
            previousDistance
        );


    const previous =
        coordinates[index - 1];

    const current =
        coordinates[index];


    return [

        previous[0] +
        (
            current[0] -
            previous[0]
        ) *
        segmentProgress,

        previous[1] +
        (
            current[1] -
            previous[1]
        ) *
        segmentProgress

    ];

}


// ============================================================
// CURVED FLIGHT PORTION
// ============================================================

function getCurvePortion(
    coordinates,
    distanceData,
    percentage
) {

    if (
        !coordinates ||
        !coordinates.length ||
        percentage <= 0
    ) {

        return [];

    }


    if (
        percentage >= 1
    ) {

        return coordinates;

    }


    const targetDistance =
        distanceData.totalDistance *
        percentage;


    const result = [];


    for (
        let i = 0;
        i < coordinates.length;
        i++
    ) {

        const coordinate =
            coordinates[i];

        const distance =
            distanceData.distances[i];


        if (
            distance <= targetDistance
        ) {

            result.push(
                coordinate
            );

            continue;

        }


        const previous =
            coordinates[i - 1];

        const previousDistance =
            distanceData.distances[
                i - 1
            ];


        const segmentProgress =
            (
                targetDistance -
                previousDistance
            ) /
            (
                distance -
                previousDistance
            );


        const latitude =
            previous[0] +
            (
                coordinate[0] -
                previous[0]
            ) *
            segmentProgress;


        const longitude =
            previous[1] +
            (
                coordinate[1] -
                previous[1]
            ) *
            segmentProgress;


        result.push([
            latitude,
            longitude
        ]);

        break;

    }


    return result;

}


// ============================================================
// ROUTE LAYERS
// ============================================================

const visibleRoutes = {

    jessToSam:
        L.polyline(
            [],
            {
                weight: 5,
                opacity: 0.9
            }
        ).addTo(map),

    samToBethel:
        L.polyline(
            [],
            {
                weight: 5,
                opacity: 0.9
            }
        ).addTo(map),

    meganToAirport:
        L.polyline(
            [],
            {
                weight: 4,
                opacity: 0.9
            }
        ).addTo(map),

    meganFlight:
        L.polyline(
            [],
            {
                weight: 3,
                opacity: 0.9,
                dashArray: '6 8'
            }
        ).addTo(map),

    meganBostonToBethel:
        L.polyline(
            [],
            {
                weight: 4,
                opacity: 0.9
            }
        ).addTo(map),

    groupToAirport:
        L.polyline(
            [],
            {
                weight: 4,
                opacity: 0.9
            }
        ).addTo(map),

    groupFlight:
        L.polyline(
            [],
            {
                weight: 3,
                opacity: 0.9,
                dashArray: '6 8'
            }
        ).addTo(map),

    groupBostonToBethel:
        L.polyline(
            [],
            {
                weight: 4,
                opacity: 0.9
            }
        ).addTo(map)

};


// ============================================================
// FUTURE ROUTES
// ============================================================

const futureRoutes = {};


// ============================================================
// OSRM
// ============================================================

async function getRoute(
    start,
    end
) {

    const startPoint =
        `${start[1]},${start[0]}`;

    const endPoint =
        `${end[1]},${end[0]}`;

    const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${startPoint};${endPoint}` +
        `?overview=full&geometries=geojson`;

    const response =
        await fetch(url);


    if (!response.ok) {

        throw new Error(
            `OSRM routing failed: ${response.status}`
        );

    }


    const data =
        await response.json();


    if (
        !data.routes ||
        !data.routes.length
    ) {

        throw new Error(
            'OSRM returned no route.'
        );

    }


    return data.routes[0];

}


// ============================================================
// ROUTE DISTANCE CALCULATION
// ============================================================

function calculateRouteDistances(
    coordinates
) {

    const distances = [0];

    let totalDistance = 0;


    for (
        let i = 1;
        i < coordinates.length;
        i++
    ) {

        const previous =
            L.latLng(
                coordinates[i - 1][1],
                coordinates[i - 1][0]
            );

        const current =
            L.latLng(
                coordinates[i][1],
                coordinates[i][0]
            );


        totalDistance +=
            previous.distanceTo(
                current
            );


        distances.push(
            totalDistance
        );

    }


    return {

        distances,

        totalDistance

    };

}


// ============================================================
// POSITION ALONG ROUTE
// ============================================================

function positionAlongRoute(
    coordinates,
    distanceData,
    percentage
) {

    if (
        !coordinates ||
        !coordinates.length
    ) {

        return tripLocations.bethel;

    }


    if (
        percentage <= 0
    ) {

        return [
            coordinates[0][1],
            coordinates[0][0]
        ];

    }


    if (
        percentage >= 1
    ) {

        const last =
            coordinates[
                coordinates.length - 1
            ];

        return [
            last[1],
            last[0]
        ];

    }


    const targetDistance =
        distanceData.totalDistance *
        percentage;


    const distances =
        distanceData.distances;


    let index = 1;


    while (
        index < distances.length &&
        distances[index] <
        targetDistance
    ) {

        index++;

    }


    const previousDistance =
        distances[index - 1];

    const currentDistance =
        distances[index];


    const segmentProgress =
        (
            targetDistance -
            previousDistance
        ) /
        (
            currentDistance -
            previousDistance
        );


    const previous =
        coordinates[index - 1];

    const current =
        coordinates[index];


    const longitude =
        previous[0] +
        (
            current[0] -
            previous[0]
        ) *
        segmentProgress;


    const latitude =
        previous[1] +
        (
            current[1] -
            previous[1]
        ) *
        segmentProgress;


    return [
        latitude,
        longitude
    ];

}


// ============================================================
// ROUTE PORTION
// ============================================================

function getRoutePortion(
    coordinates,
    distanceData,
    percentage
) {

    if (
        !coordinates ||
        !coordinates.length ||
        percentage <= 0
    ) {

        return [];

    }


    if (
        percentage >= 1
    ) {

        return coordinates.map(
            coordinate => [
                coordinate[1],
                coordinate[0]
            ]
        );

    }


    const targetDistance =
        distanceData.totalDistance *
        percentage;


    const result = [];


    for (
        let i = 0;
        i < coordinates.length;
        i++
    ) {

        const coordinate =
            coordinates[i];

        const distance =
            distanceData.distances[i];


        if (
            distance <= targetDistance
        ) {

            result.push([
                coordinate[1],
                coordinate[0]
            ]);

            continue;

        }


        const previous =
            coordinates[i - 1];

        const previousDistance =
            distanceData.distances[
                i - 1
            ];


        const segmentProgress =
            (
                targetDistance -
                previousDistance
            ) /
            (
                distance -
                previousDistance
            );


        const longitude =
            previous[0] +
            (
                coordinate[0] -
                previous[0]
            ) *
            segmentProgress;


        const latitude =
            previous[1] +
            (
                coordinate[1] -
                previous[1]
            ) *
            segmentProgress;


        result.push([
            latitude,
            longitude
        ]);

        break;

    }


    return result;

}


// ============================================================
// TIME HELPERS
// ============================================================

function routeProgress(
    currentTime,
    departure,
    arrival
) {

    if (
        currentTime <= departure
    ) {

        return 0;

    }


    if (
        currentTime >= arrival
    ) {

        return 1;

    }


    return (
        currentTime - departure
    ) / (
        arrival - departure
    );

}


function getCurrentTime() {

    const percentage =
        Number(
            slider.value
        );


    return new Date(
        timelineStart.getTime() +
        (
            timelineEnd.getTime() -
            timelineStart.getTime()
        ) *
        percentage
    );

}


// ============================================================
// MARKER HELPERS
// ============================================================

function showPerson(
    name,
    position
) {

    const marker =
        homeMarkers[name];

    if (!marker) {
        return;
    }


    marker.setLatLng(
        position
    );


    if (!map.hasLayer(marker)) {

        marker.addTo(map);

    }

}


function hidePerson(
    name
) {

    const marker =
        homeMarkers[name];

    if (
        marker &&
        map.hasLayer(marker)
    ) {

        map.removeLayer(marker);

    }

}


// ============================================================
// TIME DISPLAY
// ============================================================

function updateTimeDisplay(
    currentTime
) {

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
// JESS + SAM
// ============================================================

function updateJess(
    currentTime
) {

    const departure =
        new Date(
            jessTrip.departure
        );

    const pickup =
        new Date(
            jessTrip.pickup
        );

    const targetArrival =
        new Date(
            jessTrip.targetArrival
        );


    // --------------------------------------------
    // HOME
    // --------------------------------------------

    if (
        currentTime < departure
    ) {

        showPerson(
            'Jess',
            tripLocations.jessHome
        );

        showPerson(
            'Sam',
            tripLocations.samHome
        );

        markers.jess.setLatLng(
            tripLocations.jessHome
        );

        visibleRoutes.jessToSam.setLatLngs([]);
        visibleRoutes.samToBethel.setLatLngs([]);

        return;

    }


    // --------------------------------------------
    // JESS DRIVES TO SAM
    // --------------------------------------------

    hidePerson('Jess');


    if (
        currentTime < pickup
    ) {

        const progress =
            routeProgress(
                currentTime,
                departure,
                pickup
            );


        markers.jess.setIcon(
            carIcon
        );


        markers.jess.setLatLng(
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


        visibleRoutes.samToBethel.setLatLngs([]);

        return;

    }


    // --------------------------------------------
    // PICKUP
    // --------------------------------------------

    hidePerson('Sam');


    visibleRoutes.jessToSam.setLatLngs(
        getRoutePortion(
            routes.jessToSam.geometry.coordinates,
            routeDistances.jessToSam,
            1
        )
    );


    // --------------------------------------------
    // DRIVE TO BETHEL
    // --------------------------------------------

    if (
        currentTime < targetArrival
    ) {

        const progress =
            routeProgress(
                currentTime,
                pickup,
                targetArrival
            );


        markers.jess.setIcon(
            carIcon
        );


        markers.jess.setLatLng(
            positionAlongRoute(
                routes.samToBethel.geometry.coordinates,
                routeDistances.samToBethel,
                progress
            )
        );


        visibleRoutes.samToBethel.setLatLngs(
            getRoutePortion(
                routes.samToBethel.geometry.coordinates,
                routeDistances.samToBethel,
                progress
            )
        );


        return;

    }


    // --------------------------------------------
    // ARRIVED
    // --------------------------------------------

    markers.jess.setLatLng(
        tripLocations.bethel
    );


    markers.jess.setIcon(
        createEmojiIcon(
            '🦞',
            29
        )
    );


    visibleRoutes.samToBethel.setLatLngs(
        getRoutePortion(
            routes.samToBethel.geometry.coordinates,
            routeDistances.samToBethel,
            1
        )
    );

}


// ============================================================
// MEGAN
// ============================================================

function updateMegan(
    currentTime
) {

    const departure =
        new Date(
            meganTrip.homeDeparture
        );

    const airportArrival =
        new Date(
            meganTrip.airportArrival
        );

    const flightDeparture =
        new Date(
            meganTrip.flightDeparture
        );

    const flightArrival =
        new Date(
            meganTrip.flightArrival
        );

    const bostonDeparture =
        new Date(
            meganTrip.bostonDeparture
        );


    const bostonArrival =
        new Date(
            bostonDeparture.getTime() +
            routes.meganBostonToBethel.duration *
            1000
        );


    // --------------------------------------------
    // HOME
    // --------------------------------------------

    if (
        currentTime < departure
    ) {

        showPerson(
            'Megan',
            tripLocations.meganHome
        );


        markers.megan.setIcon(
            createEmojiIcon('🧍')
        );


        markers.megan.setLatLng(
            tripLocations.meganHome
        );


        visibleRoutes.meganToAirport.setLatLngs([]);
        visibleRoutes.meganFlight.setLatLngs([]);
        visibleRoutes.meganBostonToBethel.setLatLngs([]);

        return;

    }


    hidePerson('Megan');


    // --------------------------------------------
    // DRIVE TO AIRPORT
    // --------------------------------------------

    if (
        currentTime < airportArrival
    ) {

        const progress =
            routeProgress(
                currentTime,
                departure,
                airportArrival
            );


        markers.megan.setIcon(
            carIcon
        );


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

        return;

    }


    // --------------------------------------------
    // AIRPORT
    // --------------------------------------------

    if (
        currentTime < flightDeparture
    ) {

        markers.megan.setLatLng(
            tripLocations.norfolkAirport
        );


        markers.megan.setIcon(
            createEmojiIcon('🧍')
        );


        visibleRoutes.meganToAirport.setLatLngs(
            getRoutePortion(
                routes.meganToAirport.geometry.coordinates,
                routeDistances.meganToAirport,
                1
            )
        );


        visibleRoutes.meganFlight.setLatLngs([]);

        return;

    }


    // --------------------------------------------
    // FLIGHT
    // --------------------------------------------

    if (
        currentTime < flightArrival
    ) {

        const progress =
            routeProgress(
                currentTime,
                flightDeparture,
                flightArrival
            );


        markers.megan.setIcon(
            planeIcon
        );


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


        return;

    }


    // --------------------------------------------
    // BOSTON
    // --------------------------------------------

    visibleRoutes.meganToAirport.setLatLngs(
        getRoutePortion(
            routes.meganToAirport.geometry.coordinates,
            routeDistances.meganToAirport,
            1
        )
    );


    visibleRoutes.meganFlight.setLatLngs(
        meganFlightCurve
    );


    if (
        currentTime < bostonDeparture
    ) {

        markers.megan.setLatLng(
            tripLocations.bostonAirport
        );


        markers.megan.setIcon(
            createEmojiIcon('🧍')
        );


        return;

    }


    // --------------------------------------------
    // BOSTON → BETHEL
    // --------------------------------------------

    if (
        currentTime < bostonArrival
    ) {

        const progress =
            routeProgress(
                currentTime,
                bostonDeparture,
                bostonArrival
            );


        markers.megan.setIcon(
            carIcon
        );


        markers.megan.setLatLng(
            positionAlongRoute(
                routes.meganBostonToBethel.geometry.coordinates,
                routeDistances.meganBostonToBethel,
                progress
            )
        );


        visibleRoutes.meganBostonToBethel.setLatLngs(
            getRoutePortion(
                routes.meganBostonToBethel.geometry.coordinates,
                routeDistances.meganBostonToBethel,
                progress
            )
        );


        return;

    }


    // --------------------------------------------
    // MEGAN ARRIVED
    // --------------------------------------------

    markers.megan.setLatLng(
        tripLocations.bethel
    );


    markers.megan.setIcon(
        createEmojiIcon(
            '🦞',
            27
        )
    );


    visibleRoutes.meganBostonToBethel.setLatLngs(
        getRoutePortion(
            routes.meganBostonToBethel.geometry.coordinates,
            routeDistances.meganBostonToBethel,
            1
        )
    );

}


// ============================================================
// GROUP
// ============================================================

function updateGroup(
    currentTime
) {

    const departure =
        new Date(
            groupTrip.departure
        );

    const airportArrival =
        new Date(
            groupTrip.airportArrival
        );

    const flightDeparture =
        new Date(
            groupTrip.flightDeparture
        );

    const flightArrival =
        new Date(
            groupTrip.flightArrival
        );

    const bostonDeparture =
        new Date(
            groupTrip.bostonDeparture
        );


    const bostonArrival =
        new Date(
            bostonDeparture.getTime() +
            routes.groupBostonToBethel.duration *
            1000
        );


    const people =
        groupTrip.names;


    // --------------------------------------------
    // HOME
    // --------------------------------------------

    if (
        currentTime < departure
    ) {

        people.forEach(
            person => {

                showPerson(
                    person,
                    tripLocations.groupHome
                );

            }
        );


        markers.group.setLatLng(
            tripLocations.groupHome
        );


        markers.group.setIcon(
            carIcon
        );


        visibleRoutes.groupToAirport.setLatLngs([]);
        visibleRoutes.groupFlight.setLatLngs([]);
        visibleRoutes.groupBostonToBethel.setLatLngs([]);

        return;

    }


    // --------------------------------------------
    // GET INTO CAR
    // --------------------------------------------

    people.forEach(
        person => {

            hidePerson(person);

        }
    );


    // --------------------------------------------
    // DRIVE TO AIRPORT
    // --------------------------------------------

    if (
        currentTime < airportArrival
    ) {

        const progress =
            routeProgress(
                currentTime,
                departure,
                airportArrival
            );


        markers.group.setIcon(
            carIcon
        );


        markers.group.setLatLng(
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

        return;

    }


    // --------------------------------------------
    // AIRPORT
    // --------------------------------------------

    if (
        currentTime < flightDeparture
    ) {

        markers.group.setLatLng(
            tripLocations.norfolkAirport
        );


        markers.group.setIcon(
            createEmojiIcon(
                '🧍',
                28
            )
        );


        visibleRoutes.groupToAirport.setLatLngs(
            getRoutePortion(
                routes.groupToAirport.geometry.coordinates,
                routeDistances.groupToAirport,
                1
            )
        );


        visibleRoutes.groupFlight.setLatLngs([]);

        return;

    }


    // --------------------------------------------
    // FLIGHT
    // --------------------------------------------

    if (
        currentTime < flightArrival
    ) {

        const progress =
            routeProgress(
                currentTime,
                flightDeparture,
                flightArrival
            );


        markers.group.setIcon(
            planeIcon
        );


        markers.group.setLatLng(
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


        return;

    }


    // --------------------------------------------
    // BOSTON
    // --------------------------------------------

    visibleRoutes.groupToAirport.setLatLngs(
        getRoutePortion(
            routes.groupToAirport.geometry.coordinates,
            routeDistances.groupToAirport,
            1
        )
    );


    visibleRoutes.groupFlight.setLatLngs(
        groupFlightCurve
    );


    if (
        currentTime < bostonDeparture
    ) {

        markers.group.setLatLng(
            tripLocations.bostonAirport
        );


        markers.group.setIcon(
            createEmojiIcon(
                '🧍',
                28
            )
        );


        return;

    }


    // --------------------------------------------
    // BOSTON → BETHEL
    // --------------------------------------------

    if (
        currentTime < bostonArrival
    ) {

        const progress =
            routeProgress(
                currentTime,
                bostonDeparture,
                bostonArrival
            );


        markers.group.setIcon(
            carIcon
        );


        markers.group.setLatLng(
            positionAlongRoute(
                routes.groupBostonToBethel.geometry.coordinates,
                routeDistances.groupBostonToBethel,
                progress
            )
        );


        visibleRoutes.groupBostonToBethel.setLatLngs(
            getRoutePortion(
                routes.groupBostonToBethel.geometry.coordinates,
                routeDistances.groupBostonToBethel,
                progress
            )
        );


        return;

    }


    // --------------------------------------------
    // ARRIVED
    // --------------------------------------------

    markers.group.setLatLng(
        tripLocations.bethel
    );


    markers.group.setIcon(
        createEmojiIcon(
            '🦞',
            28
        )
    );


    visibleRoutes.groupBostonToBethel.setLatLngs(
        getRoutePortion(
            routes.groupBostonToBethel.geometry.coordinates,
            routeDistances.groupBostonToBethel,
            1
        )
    );

}


// ============================================================
// STATUS PANEL
// ============================================================

function getStatus(
    currentTime
) {

    const statuses = [];


    // --------------------------------------------
    // JESS
    // --------------------------------------------

    const jessDeparture =
        new Date(
            jessTrip.departure
        );

    const jessPickup =
        new Date(
            jessTrip.pickup
        );

    const jessArrival =
        new Date(
            jessTrip.targetArrival
        );


    if (
        currentTime < jessDeparture
    ) {

        statuses.push([
            '🧍',
            'Jess',
            'Home'
        ]);

    }

    else if (
        currentTime < jessPickup
    ) {

        statuses.push([
            '🚗',
            'Jess',
            'Driving'
        ]);

    }

    else if (
        currentTime < jessArrival
    ) {

        statuses.push([
            '🚗',
            'Jess',
            'Driving with Sam'
        ]);

    }

    else {

        statuses.push([
            '🦞',
            'Jess',
            'In Bethel'
        ]);

    }


    // --------------------------------------------
    // SAM
    // --------------------------------------------

    if (
        currentTime < jessPickup
    ) {

        statuses.push([
            '🧍',
            'Sam',
            'Waiting at home'
        ]);

    }

    else if (
        currentTime < jessArrival
    ) {

        statuses.push([
            '🚗',
            'Sam',
            'Riding with Jess'
        ]);

    }

    else {

        statuses.push([
            '🦞',
            'Sam',
            'In Bethel'
        ]);

    }


    // --------------------------------------------
    // MEGAN
    // --------------------------------------------

    const meganDeparture =
        new Date(
            meganTrip.homeDeparture
        );

    const meganAirport =
        new Date(
            meganTrip.airportArrival
        );

    const meganFlight =
        new Date(
            meganTrip.flightDeparture
        );

    const meganFlightArrival =
        new Date(
            meganTrip.flightArrival
        );

    const meganBoston =
        new Date(
            meganTrip.bostonDeparture
        );

    const meganBethel =
        new Date(
            meganBoston.getTime() +
            routes.meganBostonToBethel.duration *
            1000
        );


    if (
        currentTime < meganDeparture
    ) {

        statuses.push([
            '🧍',
            'Megan',
            'Home'
        ]);

    }

    else if (
        currentTime < meganAirport
    ) {

        statuses.push([
            '🚗',
            'Megan',
            'Driving to ORF'
        ]);

    }

    else if (
        currentTime < meganFlight
    ) {

        statuses.push([
            '🧍',
            'Megan',
            'At ORF'
        ]);

    }

    else if (
        currentTime < meganFlightArrival
    ) {

        statuses.push([
            '✈️',
            'Megan',
            'Flying'
        ]);

    }

    else if (
        currentTime < meganBoston
    ) {

        statuses.push([
            '🧍',
            'Megan',
            'In Boston'
        ]);

    }

    else if (
        currentTime < meganBethel
    ) {

        statuses.push([
            '🚗',
            'Megan',
            'Driving to Bethel'
        ]);

    }

    else {

        statuses.push([
            '🦞',
            'Megan',
            'In Bethel'
        ]);

    }


    // --------------------------------------------
    // GROUP
    // --------------------------------------------

    const groupDeparture =
        new Date(
            groupTrip.departure
        );

    const groupAirport =
        new Date(
            groupTrip.airportArrival
        );

    const groupFlight =
        new Date(
            groupTrip.flightDeparture
        );

    const groupFlightArrival =
        new Date(
            groupTrip.flightArrival
        );

    const groupBoston =
        new Date(
            groupTrip.bostonDeparture
        );

    const groupBethel =
        new Date(
            groupBoston.getTime() +
            routes.groupBostonToBethel.duration *
            1000
        );


    let groupStatus;


    if (
        currentTime < groupDeparture
    ) {

        groupStatus = [
            '🏠',
            'Group',
            'At home'
        ];

    }

    else if (
        currentTime < groupAirport
    ) {

        groupStatus = [
            '🚗',
            'Group',
            'Driving to ORF'
        ];

    }

    else if (
        currentTime < groupFlight
    ) {

        groupStatus = [
            '🧍',
            'Group',
            'At ORF'
        ];

    }

    else if (
        currentTime < groupFlightArrival
    ) {

        groupStatus = [
            '✈️',
            'Group',
            'Flying'
        ];

    }

    else if (
        currentTime < groupBoston
    ) {

        groupStatus = [
            '🧍',
            'Group',
            'In Boston'
        ];

    }

    else if (
        currentTime < groupBethel
    ) {

        groupStatus = [
            '🚗',
            'Group',
            'Driving to Bethel'
        ];

    }

    else {

        groupStatus = [
            '🦞',
            'Group',
            'In Bethel'
        ];

    }


    statuses.push(
        groupStatus
    );


    return statuses;

}


// ============================================================
// UPDATE STATUS PANEL
// ============================================================

function updateStatusPanel(
    currentTime
) {

    const statuses =
        getStatus(
            currentTime
        );


    statusList.innerHTML =
        statuses.map(
            status => {

                return `

                    <div class="status-row">

                        <div class="status-icon">
                            ${status[0]}
                        </div>

                        <div class="status-name">
                            ${status[1]}
                        </div>

                        <div class="status-state">
                            ${status[2]}
                        </div>

                    </div>

                `;

            }
        ).join('');


    const total =
        timelineEnd -
        timelineStart;


    const elapsed =
        currentTime -
        timelineStart;


    const percent =
        Math.max(
            0,
            Math.min(
                100,
                Math.round(
                    elapsed /
                    total *
                    100
                )
            )
        );


    statusProgress.textContent =
        `${percent}%`;


    const everybodyThere =
        statuses.every(
            status =>
                status[0] === '🦞'
        );


    if (everybodyThere) {

        statusFooter.textContent =
            '🦞 EVERYONE IS HERE';

    }

    else if (
        currentTime >= tripCheckIn
    ) {

        statusFooter.textContent =
            '🏡 Check-in time has arrived';

    }

    else {

        statusFooter.textContent =
            'Everybody is making their way north...';

    }

}


// ============================================================
// TIMELINE EVENTS
// ============================================================

function createTimelineEvents() {

    timelineEventsElement.innerHTML =
        '';


    timelineEvents.forEach(
        (event) => {

            const eventTime =
                new Date(
                    event.time
                );


            const percentage =
                (
                    eventTime -
                    timelineStart
                ) /
                (
                    timelineEnd -
                    timelineStart
                );


            if (
                percentage < 0 ||
                percentage > 1
            ) {

                return;

            }


            const element =
                document.createElement(
                    'div'
                );


            element.className =
                'timeline-event';


            element.style.left =
                `${percentage * 100}%`;


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

                <div
                    class="timeline-event-dot"
                ></div>

                <div
                    class="timeline-event-tooltip"
                >

                    <span
                        class="timeline-event-tooltip-emoji"
                    >
                        ${event.emoji}
                    </span>

                    ${event.label}

                    <span
                        class="timeline-event-tooltip-time"
                    >
                        ${readableTime}
                    </span>

                </div>

            `;


            element.addEventListener(
                'click',
                () => {

                    pauseTimeline();

                    slider.value =
                        percentage;

                    updateMap();

                }
            );


            timelineEventsElement.appendChild(
                element
            );

        }
    );

}


// ============================================================
// UPDATE EVERYTHING
// ============================================================

function updateMap() {

    const currentTime =
        getCurrentTime();


    updateTimeDisplay(
        currentTime
    );


    updateJess(
        currentTime
    );


    updateMegan(
        currentTime
    );


    updateGroup(
        currentTime
    );


    updateStatusPanel(
        currentTime
    );

}


// ============================================================
// SLIDER
// ============================================================

slider.addEventListener(
    'input',
    () => {

        pauseTimeline();

        updateMap();

    }
);


// ============================================================
// PLAYBACK
// ============================================================

function playTimeline() {

    if (isPlaying) {

        return;

    }


    isPlaying = true;


    playButton.textContent =
        '⏸ Pause';


    const startValue =
        Number(
            slider.value
        );


    const startTime =
        performance.now();


    function animate(
        now
    ) {

        if (!isPlaying) {

            return;

        }


        const elapsed =
            now -
            startTime;


        const progress =
            Math.min(
                elapsed /
                PLAY_DURATION,
                1
            );


        const newValue =
            startValue +
            (
                1 -
                startValue
            ) *
            progress;


        slider.value =
            newValue;


        updateMap();


        if (
            progress < 1
        ) {

            animationFrame =
                requestAnimationFrame(
                    animate
                );

        }

        else {

            isPlaying = false;

            animationFrame = null;

            playButton.textContent =
                '▶ Play';

        }

    }


    animationFrame =
        requestAnimationFrame(
            animate
        );

}


// ============================================================
// PAUSE
// ============================================================

function pauseTimeline() {

    isPlaying = false;


    if (
        animationFrame
    ) {

        cancelAnimationFrame(
            animationFrame
        );

        animationFrame =
            null;

    }


    playButton.textContent =
        '▶ Play';

}


// ============================================================
// PLAY BUTTON
// ============================================================

playButton.addEventListener(
    'click',
    () => {

        if (isPlaying) {

            pauseTimeline();

            return;

        }


        if (
            Number(
                slider.value
            ) >= 0.9999
        ) {

            slider.value = 0;

        }


        playTimeline();

    }
);


// ============================================================
// INITIALIZATION
// ============================================================

async function initialize() {

    try {

        timeDisplay.textContent =
            'Loading map...';


        // ====================================================
        // GET ALL OSRM ROUTES
        // ====================================================

        routes.jessToSam =
            await getRoute(
                tripLocations.jessHome,
                tripLocations.samHome
            );


        routes.samToBethel =
            await getRoute(
                tripLocations.samHome,
                tripLocations.bethel
            );


        routes.meganToAirport =
            await getRoute(
                tripLocations.meganHome,
                tripLocations.norfolkAirport
            );


        routes.meganBostonToBethel =
            await getRoute(
                tripLocations.bostonAirport,
                tripLocations.bethel
            );


        routes.groupToAirport =
            await getRoute(
                tripLocations.groupHome,
                tripLocations.norfolkAirport
            );


        routes.groupBostonToBethel =
            await getRoute(
                tripLocations.bostonAirport,
                tripLocations.bethel
            );


        // ====================================================
        // CALCULATE ROUTE DISTANCES
        // ====================================================

        routeDistances.jessToSam =
            calculateRouteDistances(
                routes.jessToSam.geometry.coordinates
            );


        routeDistances.samToBethel =
            calculateRouteDistances(
                routes.samToBethel.geometry.coordinates
            );


        routeDistances.meganToAirport =
            calculateRouteDistances(
                routes.meganToAirport.geometry.coordinates
            );


        routeDistances.meganBostonToBethel =
            calculateRouteDistances(
                routes.meganBostonToBethel.geometry.coordinates
            );


        routeDistances.groupToAirport =
            calculateRouteDistances(
                routes.groupToAirport.geometry.coordinates
            );


        routeDistances.groupBostonToBethel =
            calculateRouteDistances(
                routes.groupBostonToBethel.geometry.coordinates
            );


        // ====================================================
        // CREATE CURVED FLIGHT PATHS
        // ====================================================

        //
        // Megan bends slightly north/east.
        //
        meganFlightCurve =
            createFlightCurve(
                tripLocations.norfolkAirport,
                tripLocations.bostonAirport,
                0.20,
                100
            );


        //
        // Group bends in the opposite direction.
        //
        groupFlightCurve =
            createFlightCurve(
                tripLocations.norfolkAirport,
                tripLocations.bostonAirport,
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


        // ====================================================
        // FUTURE ROUTES
        // ====================================================

        futureRoutes.jessToSam =
            L.polyline(
                routes.jessToSam.geometry.coordinates.map(
                    c => [c[1], c[0]]
                ),
                {
                    weight: 4,
                    opacity: 0.12
                }
            ).addTo(map);


        futureRoutes.samToBethel =
            L.polyline(
                routes.samToBethel.geometry.coordinates.map(
                    c => [c[1], c[0]]
                ),
                {
                    weight: 4,
                    opacity: 0.12
                }
            ).addTo(map);


        futureRoutes.meganToAirport =
            L.polyline(
                routes.meganToAirport.geometry.coordinates.map(
                    c => [c[1], c[0]]
                ),
                {
                    weight: 4,
                    opacity: 0.12
                }
            ).addTo(map);


        // ----------------------------------------------------
        // MEGAN CURVED FLIGHT
        // ----------------------------------------------------

        futureRoutes.meganFlight =
            L.polyline(
                meganFlightCurve,
                {
                    weight: 3,
                    opacity: 0.12,
                    dashArray: '6 8'
                }
            ).addTo(map);


        futureRoutes.meganBostonToBethel =
            L.polyline(
                routes.meganBostonToBethel.geometry.coordinates.map(
                    c => [c[1], c[0]]
                ),
                {
                    weight: 4,
                    opacity: 0.12
                }
            ).addTo(map);


        futureRoutes.groupToAirport =
            L.polyline(
                routes.groupToAirport.geometry.coordinates.map(
                    c => [c[1], c[0]]
                ),
                {
                    weight: 4,
                    opacity: 0.12
                }
            ).addTo(map);


        // ----------------------------------------------------
        // GROUP CURVED FLIGHT
        // ----------------------------------------------------

        futureRoutes.groupFlight =
            L.polyline(
                groupFlightCurve,
                {
                    weight: 3,
                    opacity: 0.12,
                    dashArray: '6 8'
                }
            ).addTo(map);


        futureRoutes.groupBostonToBethel =
            L.polyline(
                routes.groupBostonToBethel.geometry.coordinates.map(
                    c => [c[1], c[0]]
                ),
                {
                    weight: 4,
                    opacity: 0.12
                }
            ).addTo(map);


        // ====================================================
        // FIT MAP TO ALL ROUTES
        // ====================================================

        const allRoutes =
            L.featureGroup([

                futureRoutes.jessToSam,

                futureRoutes.samToBethel,

                futureRoutes.meganToAirport,

                futureRoutes.meganFlight,

                futureRoutes.meganBostonToBethel,

                futureRoutes.groupToAirport,

                futureRoutes.groupFlight,

                futureRoutes.groupBostonToBethel

            ]);


        map.fitBounds(
            allRoutes.getBounds(),
            {
                padding: [
                    50,
                    50
                ]
            }
        );


        // ====================================================
        // CREATE TIMELINE
        // ====================================================

        createTimelineEvents();


        // ====================================================
        // INITIAL MAP STATE
        // ====================================================

        slider.value =
            0;


        updateMap();


        // ====================================================
        // DONE
        // ====================================================

        console.log(
            'The Maine Event initialized successfully.'
        );

    }

    catch (error) {

        console.error(
            'The Maine Event could not initialize:',
            error
        );


        timeDisplay.textContent =
            'Map failed to load';


        statusList.innerHTML = `

            <div class="status-row">

                <div class="status-icon">
                    ⚠️
                </div>

                <div class="status-name">
                    Map error
                </div>

                <div class="status-state">
                    Check console
                </div>

            </div>

        `;


        statusFooter.textContent =
            'Something went wrong loading the routes.';

    }

}


// ============================================================
// START
// ============================================================

initialize();