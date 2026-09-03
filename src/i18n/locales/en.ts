/**
 * English strings. Keys are grouped by screen/feature so it's obvious
 * where each one is used. When adding a new user-facing string anywhere
 * in the app, add the key here AND in ar.ts (see README "Localization"
 * section) rather than hardcoding text inline.
 */
export const en = {
  common: {
    save: 'Save',
    saving: 'Saving...',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    ok: 'OK',
    retry: 'Retry',
    continue: 'Continue',
    done: 'Done',
    no: 'No',
    notNow: 'Not now',
    remove: 'Remove',
    total: 'Total',
    history: 'History',
    profile: 'Profile',
    signOut: 'Sign Out',
    language: 'Language',
    currency: 'DA',
    selectPlaceholder: 'Select...',
    phonePlaceholder: '+213...',
    youAreOfflineTitle: "You're offline",
    checkConnectionRetry: 'Check your connection and try again.',
    couldNotSaveTitle: 'Could not save',
    savedTitle: 'Saved',
    loadingRequest: 'Loading request...',
  },

  offline: {
    banner: "You're offline - some features are paused until you reconnect.",
  },

  auth: {
    welcomeBack: 'Welcome back',
    signInSubtitle: 'Sign in to request roadside help',
    email: 'Email',
    password: 'Password',
    passwordMin: 'Password (min 6 characters)',
    signIn: 'Sign In',
    signInLoading: 'Signing in...',
    signInError: 'Could not sign in. Check your email and password.',
    noAccount: "Don't have an account? Sign up",
    createAccount: 'Create your account',
    signUpSubtitle: 'Get roadside help, or offer it',
    iNeedHelp: 'I need help',
    iProvideService: 'I provide a service',
    firstName: 'First name',
    lastName: 'Last name',
    nationalId: 'National ID number',
    nationalIdHint:
      "Used to verify your identity in case of a scam report. It's encrypted before it ever leaves your device.",
    signUp: 'Sign Up',
    signUpLoading: 'Creating your account...',
    alreadyHaveAccount: 'Already have an account? Sign in',
    emailInUse: 'That email is already registered.',
    signUpError: 'Could not create your account. Please try again.',
  },

  serviceSelect: {
    greeting: 'Hi',
    subtitle: 'What do you need help with?',
  },

  services: {
    mechanic: { label: 'Mechanic', description: 'On-site repair for breakdowns' },
    tow: { label: 'Tow Truck', description: 'Vehicle towing to a garage' },
    taxi: { label: 'Taxi', description: 'Passenger pickup and ride' },
    ambulance: { label: 'Ambulance', description: 'Emergency medical transport' },
    garage: { label: 'Garage', description: 'Fixed-location repair shop' },
    station: { label: 'Fuel Delivery', description: 'Fuel or oil brought to you' },
  },

  // Labels/placeholders for the per-service extra fields defined in
  // config/serviceTypes.ts, keyed by ExtraFieldConfig.key. One entry
  // here covers every service that uses that field (e.g. issueDescription
  // is shared by mechanic + garage), so a 7th service reuses these too.
  serviceFields: {
    vehicleType: { label: 'Vehicle type' },
    vehicleMakeModel: { label: 'Make & model', placeholder: 'e.g. Renault Symbol' },
    issueDescription: {
      label: 'Describe the issue',
      placeholder: "What's wrong with the vehicle? Be as specific as you can.",
    },
    passengerCount: { label: 'Passengers' },
    injuredCount: { label: 'Number of injured' },
    fuelType: { label: 'Fuel type' },
    quantity: { label: 'Quantity' },
  },

  // Option labels for select-type extra fields (vehicle types, fuel
  // types). Flat map keyed by option value - safe since the two option
  // sets don't share any values.
  fieldOptions: {
    car: 'Car',
    suv_4x4: 'SUV / 4x4',
    motorcycle: 'Motorcycle',
    van_minibus: 'Van / Minibus',
    pickup: 'Pickup',
    truck: 'Truck',
    bus: 'Bus',
    tricycle: 'Tricycle (Triporteur)',
    tractor: 'Tractor / Agricultural',
    other: 'Other',
    petrol_normal: 'Petrol - Normale',
    petrol_super: 'Petrol - Super (Sans Plomb)',
    diesel: 'Diesel (Gasoil)',
    gpl: 'GPL / Auto Gas (Sirghaz)',
    engine_oil: 'Engine Oil (Huile moteur)',
  },

  // Short state labels shown in history rows (uppercase chip text).
  requestStates: {
    pending: 'Pending',
    accepted: 'Accepted',
    declined: 'Declined',
    completed: 'Completed',
    cancelled: 'Cancelled',
  },

  mapPicker: {
    findingLocation: 'Finding your location...',
    gettingAddress: 'Getting address...',
    hint: 'Tap the map to drop a pin, or use your current location.',
    confirm: 'Confirm Location',
  },

  profile: {
    phone: 'Phone',
    nationalId: 'National ID',
    myVehicles: 'My Vehicles',
    vehiclesSubtext:
      'Saved vehicles auto-fill on mechanic, tow, and garage requests - still editable per request.',
    addVehicle: '+ Add Vehicle',
    savedMessage: 'Your profile has been updated.',
  },

  providerList: {
    sending: 'Sending your request...',
    looking: 'Looking for providers...',
    nearYou: 'near you',
    yourArea: 'Your area',
    estimateNote:
      'Prices below are a rough call-out estimate - the {service} will confirm the final cost with you once they see the issue.',
    offlineMessage:
      "You're offline - can't search for providers right now. Reconnect and this screen will update automatically.",
    noneAvailable: 'No {service} available nearby right now.',
    reconnectToSend: 'Reconnect to send this request.',
    couldNotSendTitle: 'Could not send request',
    estimatedSuffix: 'est.',
    newRequestPushTitle: 'New request',
    newRequestPushBody: '{icon} {service} request nearby{price}',
  },

  requestDetails: {
    title: 'A few details for your {service} request',
    useSavedVehicle: 'Use a saved vehicle',
    estimatedItemCost: 'Estimated item cost',
    deliveryCostHint: 'Delivery cost is added once you pick a provider, based on distance.',
  },

  requestHistory: {
    empty: 'No requests yet.',
    payNow: 'Unpaid - tap to pay',
  },

  requestStatus: {
    pending: 'Waiting for a provider to accept...',
    accepted: 'Provider is on the way!',
    declined: 'Provider declined this request.',
    completed: 'Service completed.',
    cancelled: 'Request cancelled.',
    offlineLoading: "You're offline - this will load once you reconnect.",
    itemCost: 'Item cost',
    estimatedCallOut: 'Estimated call-out',
    deliveryCost: 'Delivery cost',
    finalPriceNote: 'Final price is agreed directly with the provider.',
    cancelRequestButton: 'Cancel Request',
    callProviderButton: 'Call Provider',
    cancelConfirmTitle: 'Cancel request?',
    cancelConfirmMessage: 'This will stop the search for a provider.',
    yesCancel: 'Yes, cancel',
    couldNotCancelTitle: "Couldn't cancel",
    followUpAmbulanceTitle: 'Need a ride for the rest of the group?',
    followUpAmbulanceMessage:
      'If some of your group are unhurt and need to get home, we can send a taxi to the same location.',
    requestTaxi: 'Request a Taxi',
    followUpTaxiTitle: 'Is anyone hurt?',
    followUpTaxiMessage:
      'If this is from an accident and someone needs medical help, you can also request an ambulance to the same location.',
    requestAmbulance: 'Request an Ambulance',
    paid: 'Paid ({method})',
    payNowButton: 'Pay Now',
  },

  payment: {
    amountDue: 'Amount due',
    chooseMethod: 'Choose a payment method',
    cash: 'Cash',
    cashHint: 'Pay the provider directly, in person.',
    card: 'Card',
    cardHint: 'Simulated for now - no real charge is made.',
    localMethods: 'Local payment methods',
    edahabia: 'Edahabia / CIB',
    edahabiaHint: 'Algérie Poste & CIB cards. Simulated for now.',
    mada: 'mada',
    madaHint: 'Saudi domestic debit network. Simulated for now.',
    stcpay: 'STC Pay',
    stcpayHint: 'Saudi mobile wallet. Simulated for now.',
    confirmCash: 'Confirm Cash Payment',
    payNow: 'Pay Now',
    processing: 'Processing payment...',
    successTitle: 'Payment recorded',
    successMessage: 'This request is now marked as paid.',
    couldNotPayTitle: 'Could not record payment',
    cardDetails: 'Card details',
    cardNumber: 'Card number',
    expiry: 'Expiry',
    cvv: 'CVV',
    cardholderName: 'Cardholder name',
    cardholderNamePlaceholder: 'Name on card',
    cardFormNote: 'Simulated for now - no real charge is made and no card data is stored.',
    pushPaidTitle: 'Payment received',
    pushPaidBody: '{name} paid for the completed job.',
  },

  providerCard: {
    kmAway: '{km} km away',
  },

  worker: {
    online: 'Online',
    offline: 'Offline',
    activeJob: 'Active Job',
    incomingRequests: 'Incoming Requests',
    noIncomingRequests: 'No incoming requests right now.',
    goOnlineToReceive: "You're offline - go online to receive requests.",
    callClient: 'Call Client',
    markCompleted: 'Mark Completed',
    decline: 'Decline',
    accept: 'Accept',
    client: 'Client',
    verified: '✓ Verified',
    couldNotAccept: "Couldn't accept",
    couldNotDecline: "Couldn't decline",
    couldNotComplete: "Couldn't complete",
    pushAcceptedTitle: 'Request accepted',
    pushAcceptedBody: '{name} is on the way!',
    pushDeclinedTitle: 'Request declined',
    pushDeclinedBody: '{name} could not take this request.',
    pushCompletedTitle: 'Service completed',
    pushCompletedBody: '{name} marked the job done - payment is due.',
    pushYourProvider: 'Your provider',
  },

  workerHistory: {
    empty: 'No completed jobs yet.',
    clientFallback: 'Client',
    paid: 'Paid',
    unpaid: 'Unpaid',
  },

  workerOnboarding: {
    title: 'Set up your service',
    subtitle: 'Clients will find you under this category',
    businessName: 'Business / display name',
    contactPhone: 'Contact phone',
    submitButton: 'Start Receiving Requests',
    settingUp: 'Setting up your profile...',
    locationPermissionError: 'Location permission is required so clients can find you.',
    createError: 'Could not create your provider profile. Please try again.',
    locationHint:
      "We'll use your current location as your service base - you can update it anytime from your profile.",
  },

  workerProfile: {
    savedMessage: 'Your provider profile has been updated.',
  },

  splash: {
    tagline: 'Help is on the way',
  },

  nav: {
    appName: 'Tari9',
    setUpService: 'Set Up Your Service',
    providerDashboard: 'Tari9 Provider',
    jobHistory: 'Job History',
    yourLocation: 'Your Location',
    details: 'Details',
    nearbyProviders: 'Nearby Providers',
    requestStatus: 'Request Status',
    payment: 'Payment',
  },
} as const;

/** The shape every other locale file must match. */
export type TranslationSchema = typeof en;
