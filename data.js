// ============================================================
// THE MAINE EVENT
// TRIP DATA
// ============================================================


// ============================================================
// MAIN TRIP TIMELINE
// ============================================================

const tripStart = new Date(
    '2026-10-21T10:00:00'
);

const tripCheckIn = new Date(
    '2026-10-22T16:00:00'
);

const tripCheckout = new Date(
    '2026-10-25T10:00:00'
);


// The visualization ends early Friday morning.
// This gives the map enough room to show everyone
// getting into Bethel without making the slider enormous.

const tripTimelineEnd = new Date(
    '2026-10-23T04:00:00'
);


// ============================================================
// LOCATIONS
// ============================================================
//
// IMPORTANT:
// These are public meeting points rather than anyone's
// residential addresses.
//
// Jess       → Cook Out, Blacksburg
// Sam        → Cook Out, Lexington
// Group      → Cook Out, Battlefield Blvd, Chesapeake
//
// The current app treats the Virginia Beach / Chesapeake
// travelers as one group, so they share the Battlefield
// Cook Out starting point for now.
//
// ============================================================

const tripLocations = {

    // --------------------------------------------------------
    // DESTINATION
    // --------------------------------------------------------

    bethel: [
        44.4041,
        -70.7890
    ],


    // --------------------------------------------------------
    // STARTING POINTS
    // --------------------------------------------------------

    // Cook Out
    // 1311 S Main St
    // Blacksburg, VA
    jessHome: [
        37.2170378,
        -80.4007365
    ],


    // Cook Out
    // 445 E Nelson St
    // Lexington, VA
    samHome: [
        37.779835,
        -79.43726
    ],


    // Cook Out
    // 5670 Indian River Rd
    // Virginia Beach, VA
    //
    // Kept here for future individual routing.
    meganHome: [
        36.8055928,
        -76.1903827
    ],


    // Cook Out
    // 1328 Battlefield Blvd N
    // Chesapeake, VA
    //
    // This is the shared starting point used by the
    // current group routing system.
    groupHome: [
        36.7657656,
        -76.2524169
    ],


    // Cook Out
    // 1620 General Booth Blvd
    // Virginia Beach, VA
    //
    // Reserved for Marshall when individual group
    // routing is added.
    marshallHome: [
        36.8103,
        -75.9893
    ],


    // --------------------------------------------------------
    // AIRPORTS
    // --------------------------------------------------------

    norfolkAirport: [
        36.8946,
        -76.2012
    ],

    bostonAirport: [
        42.3656,
        -71.0096
    ]

};


// ============================================================
// JESS + SAM
// ============================================================

const jessTrip = {

    name: 'Jess',

    color: '#e63946',

    departure: '2026-10-22T00:00:00',

    pickup: '2026-10-22T01:23:00',

    // OSRM determines the actual driving time.
    //
    // We then add planned stop time in app.js.
    //
    // The visualization is intentionally targeted toward
    // roughly 4:30 PM arrival.

    targetArrival: '2026-10-22T16:30:00'

};


const samTrip = {

    name: 'Sam',

    color: '#457b9d',

    pickup: '2026-10-22T01:23:00',

    targetArrival: '2026-10-22T16:30:00'

};


// ============================================================
// MEGAN
// ============================================================

const meganTrip = {

    name: 'Megan',

    color: '#9b5de5',

    homeDeparture: '2026-10-21T14:00:00',

    airportArrival: '2026-10-21T15:00:00',

    flightDeparture: '2026-10-21T16:00:00',

    flightArrival: '2026-10-21T17:30:00',

    bostonDeparture: '2026-10-22T20:00:00'

};


// ============================================================
// VIRGINIA BEACH / CHESAPEAKE GROUP
// ============================================================

const groupTrip = {

    names: [
        'Brennen',
        'Mary',
        'Allison',
        'Olivia',
        'Marshall'
    ],

    departure: '2026-10-22T14:00:00',

    airportArrival: '2026-10-22T15:00:00',

    flightDeparture: '2026-10-22T17:00:00',

    flightArrival: '2026-10-22T18:30:00',

    bostonDeparture: '2026-10-22T20:00:00'

};


// ============================================================
// TIMELINE EVENTS
// ============================================================
//
// These are deliberately just points.
// JavaScript creates the little hoverable markers.
// No text is permanently printed across the timeline.
//

const timelineEvents = [

    {
        label: 'Megan leaves Virginia Beach',
        emoji: '🚗',
        time: '2026-10-21T14:00:00'
    },

    {
        label: 'Megan reaches Norfolk International Airport',
        emoji: '🧍',
        time: '2026-10-21T15:00:00'
    },

    {
        label: 'Megan flies to Boston',
        emoji: '✈️',
        time: '2026-10-21T16:00:00'
    },

    {
        label: 'Megan arrives in Boston',
        emoji: '📍',
        time: '2026-10-21T17:30:00'
    },

    {
        label: 'Jess leaves Blacksburg',
        emoji: '🚗',
        time: '2026-10-22T00:00:00'
    },

    {
        label: 'Jess picks up Sam in Buena Vista',
        emoji: '👋',
        time: '2026-10-22T01:23:00'
    },

    {
        label: 'Virginia Beach / Chesapeake group leaves',
        emoji: '🚗',
        time: '2026-10-22T14:00:00'
    },

    {
        label: 'Bethel check-in',
        emoji: '🦞',
        time: '2026-10-22T16:00:00'
    },

    {
        label: 'Group flight leaves Norfolk',
        emoji: '✈️',
        time: '2026-10-22T17:00:00'
    },

    {
        label: 'Group arrives in Boston',
        emoji: '📍',
        time: '2026-10-22T18:30:00'
    },

    {
        label: 'Megan leaves Boston for Bethel',
        emoji: '🚗',
        time: '2026-10-22T20:00:00'
    },

    {
        label: 'Group leaves Boston for Bethel',
        emoji: '🚗',
        time: '2026-10-22T20:00:00'
    },

    {
        label: 'Jess + Sam arrive in Bethel',
        emoji: '🦞',
        time: '2026-10-22T16:30:00'
    }

];