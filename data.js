// ============================================================
// THE MAINE EVENT
// TRIP DATA
// ============================================================


// ============================================================
// MAIN TRIP TIMELINE
// ============================================================

// The visualization begins early enough to show Megan's
// Wednesday morning airport run and ends after the
// Providence group reaches Bethel Thursday evening.

const tripStart = new Date(
    '2026-10-21T04:00:00'
);

const tripCheckIn = new Date(
    '2026-10-22T16:00:00'
);

const tripCheckout = new Date(
    '2026-10-25T10:00:00'
);

const tripTimelineEnd = new Date(
    '2026-10-22T20:00:00'
);


// ============================================================
// LOCATIONS
// ============================================================
//
// Public-safe stand-ins are used instead of residential
// addresses because this map lives in a public GitHub repo.
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
    // JESS
    // --------------------------------------------------------

    // Cook Out — Blacksburg
    jessHome: [
        37.2170378,
        -80.4007365
    ],


    // --------------------------------------------------------
    // SAM
    // --------------------------------------------------------

    // Cook Out — Lexington
    samHome: [
        37.779835,
        -79.43726
    ],


    // --------------------------------------------------------
    // OLIVIA
    // --------------------------------------------------------

    // 7-Eleven near Newtown Rd / Lake Edward Dr.
    // Public stand-in for Olivia's home.
    oliviaHome: [
        36.8576948,
        -76.1771738
    ],


    // --------------------------------------------------------
    // MEGAN
    // --------------------------------------------------------

    // Buffalo Wild Wings near Town Center / Kempsville.
    meganHome: [
        36.839605,
        -76.137668
    ],


    // --------------------------------------------------------
    // BRENNEN + MARY
    // --------------------------------------------------------

    // Cook Out — Battlefield Blvd, Chesapeake
    groupHome: [
        36.765729,
        -76.252661
    ],


    // --------------------------------------------------------
    // MARSHALL
    // --------------------------------------------------------

    // Cook Out — General Booth Blvd
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

    // Rhode Island T.F. Green International Airport
    providenceAirport: [
        41.7240,
        -71.4290
    ],


    // --------------------------------------------------------
    // PROVIDENCE
    // --------------------------------------------------------

    // Public city-center stand-in for where the group
    // spends Thursday before leaving for Maine.
    providence: [
        41.8240,
        -71.4128
    ]

};


// ============================================================
// JESS + SAM + OLIVIA
// ============================================================

const jessTrip = {

    name: 'Jess',

    color: '#e63946',

    // Jess leaves Blacksburg at 8 PM Wednesday.
    departure: '2026-10-21T20:00:00',

    // Planned stops / buffers.
    samStopMinutes: 20,

    // The 20-minute gas/stop buffer is applied when
    // the group reaches Virginia Beach.
    virginiaBeachStopMinutes: 20,

    // Roughly two hours from arriving in VB to leaving
    // Olivia's place around 4 AM.
    virginiaBeachStayMinutes: 120,

    // Four 10-minute stretch/driver-switch stops.
    maineStopMinutes: 40

};


const samTrip = {

    name: 'Sam',

    // Sam is picked up in Buena Vista.
    pickupLocation: 'Buena Vista, VA'

};


const oliviaTrip = {

    name: 'Olivia',

    // Olivia joins Jess and Sam in Virginia Beach.
    departureFromVirginiaBeach: 'approximately 4:00 AM'

};


// ============================================================
// MEGAN
// ============================================================

const meganTrip = {

    name: 'Megan',

    color: '#9b5de5',

    // Delta ORF -> PVD
    airportArrival: '2026-10-21T04:30:00',

    flightDeparture: '2026-10-21T06:00:00',

    flightArrival: '2026-10-21T12:17:00',

    // She stays in Providence overnight and joins
    // Brennen + Mary for the Maine drive Thursday.
    providenceDeparture: '2026-10-22T15:00:00'

};


// ============================================================
// BRENNEN + MARY
// ============================================================

const groupTrip = {

    names: [
        'Brennen',
        'Mary'
    ],

    // Breeze ORF -> PVD
    airportArrival: '2026-10-21T20:29:00',

    flightDeparture: '2026-10-21T21:59:00',

    flightArrival: '2026-10-21T23:26:00',

    // They meet Megan in Providence and leave together.
    providenceDeparture: '2026-10-22T15:00:00'

};


// ============================================================
// MARSHALL
// ============================================================

const marshallTrip = {

    name: 'Marshall',

    // Confirmed traveler, but flight has not been purchased yet.
    // This is intentionally not a fake flight time.
    travelTBD: '2026-10-21T04:00:00'

};


// ============================================================
// TIMELINE EVENTS
// ============================================================

const timelineEvents = [

    {
        label: 'Megan leaves for ORF',
        emoji: '🚗',
        time: '2026-10-21T04:30:00'
    },

    {
        label: 'Megan arrives at ORF',
        emoji: '🧍',
        time: '2026-10-21T04:30:00'
    },

    {
        label: 'Megan flies Delta ORF → PVD',
        emoji: '✈️',
        time: '2026-10-21T06:00:00'
    },

    {
        label: 'Megan arrives in Providence',
        emoji: '📍',
        time: '2026-10-21T12:17:00'
    },

    {
        label: 'Brennen + Mary leave for ORF',
        emoji: '🚗',
        time: '2026-10-21T20:29:00'
    },

    {
        label: 'Breeze ORF → PVD departs',
        emoji: '✈️',
        time: '2026-10-21T21:59:00'
    },

    {
        label: 'Brennen + Mary arrive in Providence',
        emoji: '📍',
        time: '2026-10-21T23:26:00'
    },

    {
        label: 'Jess leaves Blacksburg',
        emoji: '🚗',
        time: '2026-10-21T20:00:00'
    },

    {
        label: 'Jess reaches Buena Vista',
        emoji: '👋',
        time: '2026-10-21T21:30:00'
    },

    {
        label: 'Jess + Sam leave Buena Vista',
        emoji: '🚗',
        time: '2026-10-21T21:50:00'
    },

    {
        label: 'Jess + Sam reach Virginia Beach',
        emoji: '📍',
        time: '2026-10-22T02:00:00'
    },

    {
        label: 'Jess + Sam + Olivia leave Virginia Beach',
        emoji: '🚗',
        time: '2026-10-22T04:00:00'
    },

    {
        label: 'Megan + Brennen + Mary leave Providence',
        emoji: '🚗',
        time: '2026-10-22T15:00:00'
    },

    {
        label: 'Bethel check-in',
        emoji: '🦞',
        time: '2026-10-22T16:00:00'
    }

];
