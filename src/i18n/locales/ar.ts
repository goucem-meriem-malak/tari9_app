import { TranslationSchema } from './en';

/**
 * Arabic strings. Kept as a plain object matching TranslationSchema
 * (not a Partial<>) so TypeScript errors immediately if a key from
 * en.ts is missing here, instead of silently falling back and shipping
 * an English string inside an otherwise-Arabic screen.
 */
export const ar: TranslationSchema = {
  common: {
    save: 'حفظ',
    saving: 'جارٍ الحفظ...',
    saveChanges: 'حفظ التغييرات',
    cancel: 'إلغاء',
    ok: 'موافق',
    retry: 'إعادة المحاولة',
    continue: 'متابعة',
    done: 'تم',
    no: 'لا',
    notNow: 'ليس الآن',
    remove: 'إزالة',
    total: 'المجموع',
    history: 'السجل',
    profile: 'الملف الشخصي',
    signOut: 'تسجيل الخروج',
    language: 'اللغة',
    currency: 'دج',
    selectPlaceholder: 'اختر...',
    phonePlaceholder: '+213...',
    youAreOfflineTitle: 'أنت غير متصل بالإنترنت',
    checkConnectionRetry: 'تحقق من اتصالك وحاول مرة أخرى.',
    couldNotSaveTitle: 'تعذّر الحفظ',
    savedTitle: 'تم الحفظ',
    loadingRequest: 'جارٍ تحميل الطلب...',
  },

  offline: {
    banner: 'أنت غير متصل بالإنترنت - بعض الميزات متوقفة حتى تتم إعادة الاتصال.',
  },

  auth: {
    welcomeBack: 'مرحبًا بعودتك',
    signInSubtitle: 'سجّل الدخول لطلب المساعدة على الطريق',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    passwordMin: 'كلمة المرور (6 أحرف على الأقل)',
    signIn: 'تسجيل الدخول',
    signInLoading: 'جارٍ تسجيل الدخول...',
    signInError: 'تعذّر تسجيل الدخول. تحقق من بريدك الإلكتروني وكلمة المرور.',
    noAccount: 'ليس لديك حساب؟ أنشئ حسابًا',
    createAccount: 'إنشاء حسابك',
    signUpSubtitle: 'اطلب المساعدة على الطريق، أو قدّمها',
    iNeedHelp: 'أحتاج إلى مساعدة',
    iProvideService: 'أنا أقدّم خدمة',
    firstName: 'الاسم الأول',
    lastName: 'اسم العائلة',
    nationalId: 'رقم بطاقة التعريف الوطنية',
    nationalIdHint:
      'يُستخدم للتحقق من هويتك في حال الإبلاغ عن احتيال. يتم تشفيره قبل أن يغادر جهازك.',
    signUp: 'إنشاء حساب',
    signUpLoading: 'جارٍ إنشاء حسابك...',
    alreadyHaveAccount: 'لديك حساب بالفعل؟ سجّل الدخول',
    emailInUse: 'هذا البريد الإلكتروني مسجّل بالفعل.',
    signUpError: 'تعذّر إنشاء حسابك. حاول مرة أخرى.',
  },

  serviceSelect: {
    greeting: 'مرحبًا',
    subtitle: 'ما الذي تحتاج المساعدة فيه؟',
  },

  services: {
    mechanic: { label: 'ميكانيكي', description: 'إصلاح في الموقع عند الأعطال' },
    tow: { label: 'سطحة (سحب)', description: 'سحب المركبة إلى الكراج' },
    taxi: { label: 'تاكسي', description: 'نقل الركاب' },
    ambulance: { label: 'إسعاف', description: 'نقل طبي طارئ' },
    garage: { label: 'كراج', description: 'ورشة إصلاح ثابتة' },
    station: { label: 'توصيل وقود', description: 'وقود أو زيت يُوصَل إليك' },
  },

  serviceFields: {
    vehicleType: { label: 'نوع المركبة' },
    vehicleMakeModel: { label: 'الماركة والموديل', placeholder: 'مثال: Renault Symbol' },
    issueDescription: {
      label: 'صف المشكلة',
      placeholder: 'ما هي مشكلة المركبة؟ كن دقيقًا قدر الإمكان.',
    },
    passengerCount: { label: 'عدد الركاب' },
    injuredCount: { label: 'عدد المصابين' },
    fuelType: { label: 'نوع الوقود' },
    quantity: { label: 'الكمية' },
  },

  fieldOptions: {
    car: 'سيارة',
    suv_4x4: 'دفع رباعي (SUV)',
    motorcycle: 'دراجة نارية',
    van_minibus: 'شاحنة صغيرة / حافلة صغيرة',
    pickup: 'بيك أب',
    truck: 'شاحنة',
    bus: 'حافلة',
    tricycle: 'دراجة ثلاثية (تريبورتور)',
    tractor: 'جرار / آلة زراعية',
    other: 'أخرى',
    petrol_normal: 'بنزين - عادي',
    petrol_super: 'بنزين - سوبر (خالٍ من الرصاص)',
    diesel: 'ديزل (مازوت)',
    gpl: 'غاز البترول المسال (GPL)',
    engine_oil: 'زيت المحرك',
  },

  requestStates: {
    pending: 'قيد الانتظار',
    accepted: 'مقبول',
    declined: 'مرفوض',
    completed: 'مكتمل',
    cancelled: 'ملغى',
  },

  mapPicker: {
    findingLocation: 'جارٍ تحديد موقعك...',
    gettingAddress: 'جارٍ الحصول على العنوان...',
    hint: 'اضغط على الخريطة لتحديد نقطة، أو استخدم موقعك الحالي.',
    confirm: 'تأكيد الموقع',
  },

  profile: {
    phone: 'الهاتف',
    nationalId: 'رقم التعريف الوطني',
    myVehicles: 'مركباتي',
    vehiclesSubtext:
      'تُملأ المركبات المحفوظة تلقائيًا في طلبات الميكانيكي والسطحة والكراج - ويمكن تعديلها لكل طلب.',
    addVehicle: '+ إضافة مركبة',
    savedMessage: 'تم تحديث ملفك الشخصي.',
  },

  providerList: {
    sending: 'جارٍ إرسال طلبك...',
    looking: 'جارٍ البحث عن مزودي الخدمة...',
    nearYou: 'بالقرب منك',
    yourArea: 'منطقتك',
    estimateNote:
      'الأسعار أدناه تقدير تقريبي للانتقال - سيؤكد {service} التكلفة النهائية معك بعد معاينة المشكلة.',
    offlineMessage:
      'أنت غير متصل بالإنترنت - لا يمكن البحث عن مزودي الخدمة الآن. أعد الاتصال وسيتم تحديث هذه الشاشة تلقائيًا.',
    noneAvailable: 'لا يوجد {service} متاح بالقرب منك حاليًا.',
    reconnectToSend: 'أعد الاتصال بالإنترنت لإرسال هذا الطلب.',
    couldNotSendTitle: 'تعذّر إرسال الطلب',
    estimatedSuffix: 'تقريبًا',
    newRequestPushTitle: 'طلب جديد',
    newRequestPushBody: '{icon} طلب {service} بالقرب منك{price}',
  },

  requestDetails: {
    title: 'بعض التفاصيل لطلب {service}',
    useSavedVehicle: 'استخدام مركبة محفوظة',
    estimatedItemCost: 'التكلفة التقديرية للعنصر',
    deliveryCostHint: 'تُضاف تكلفة التوصيل بمجرد اختيار مزود الخدمة، حسب المسافة.',
  },

  requestHistory: {
    empty: 'لا توجد طلبات بعد.',
    payNow: 'غير مدفوع - اضغط للدفع',
  },

  requestStatus: {
    pending: 'بانتظار قبول مزود الخدمة...',
    accepted: 'مزود الخدمة في الطريق إليك!',
    declined: 'رفض مزود الخدمة هذا الطلب.',
    completed: 'اكتملت الخدمة.',
    cancelled: 'تم إلغاء الطلب.',
    offlineLoading: 'أنت غير متصل بالإنترنت - سيتم التحميل بعد إعادة الاتصال.',
    itemCost: 'تكلفة العنصر',
    estimatedCallOut: 'تكلفة الانتقال التقديرية',
    deliveryCost: 'تكلفة التوصيل',
    finalPriceNote: 'يُتفق على السعر النهائي مباشرة مع مزود الخدمة.',
    cancelRequestButton: 'إلغاء الطلب',
    callProviderButton: 'اتصل بمزود الخدمة',
    cancelConfirmTitle: 'إلغاء الطلب؟',
    cancelConfirmMessage: 'سيؤدي هذا إلى إيقاف البحث عن مزود خدمة.',
    yesCancel: 'نعم، إلغاء',
    couldNotCancelTitle: 'تعذّر الإلغاء',
    followUpAmbulanceTitle: 'هل تحتاج بقية المجموعة إلى توصيلة؟',
    followUpAmbulanceMessage:
      'إذا كان بعض أفراد مجموعتك غير مصابين ويحتاجون للعودة إلى المنزل، يمكننا إرسال تاكسي إلى نفس الموقع.',
    requestTaxi: 'طلب تاكسي',
    followUpTaxiTitle: 'هل أُصيب أحد؟',
    followUpTaxiMessage:
      'إذا كان هذا بسبب حادث ويحتاج أحدهم إلى مساعدة طبية، يمكنك أيضًا طلب سيارة إسعاف إلى نفس الموقع.',
    requestAmbulance: 'طلب سيارة إسعاف',
    paid: 'مدفوع ({method})',
    payNowButton: 'ادفع الآن',
  },

  payment: {
    amountDue: 'المبلغ المستحق',
    chooseMethod: 'اختر طريقة الدفع',
    cash: 'نقدًا',
    cashHint: 'ادفع لمزود الخدمة مباشرة، شخصيًا.',
    card: 'بطاقة',
    cardHint: 'محاكاة حاليًا - لا يتم خصم أي مبلغ فعلي.',
    localMethods: 'وسائل الدفع المحلية',
    edahabia: 'الذهبية / CIB',
    edahabiaHint: 'بطاقات بريد الجزائر و CIB. محاكاة حاليًا.',
    mada: 'مدى',
    madaHint: 'شبكة السحب الآلي السعودية المحلية. محاكاة حاليًا.',
    stcpay: 'STC Pay',
    stcpayHint: 'محفظة STC السعودية. محاكاة حاليًا.',
    confirmCash: 'تأكيد الدفع النقدي',
    payNow: 'ادفع الآن',
    processing: 'جارٍ معالجة الدفع...',
    successTitle: 'تم تسجيل الدفع',
    successMessage: 'تم الآن وضع علامة على هذا الطلب كمدفوع.',
    couldNotPayTitle: 'تعذّر تسجيل الدفع',
    cardDetails: 'تفاصيل البطاقة',
    cardNumber: 'رقم البطاقة',
    expiry: 'تاريخ الانتهاء',
    cvv: 'رمز التحقق CVV',
    cardholderName: 'اسم حامل البطاقة',
    cardholderNamePlaceholder: 'الاسم كما يظهر على البطاقة',
    cardFormNote: 'محاكاة حاليًا - لا يتم خصم أي مبلغ فعلي ولا يتم تخزين بيانات البطاقة.',
    pushPaidTitle: 'تم استلام الدفع',
    pushPaidBody: 'دفع {name} مقابل العمل المكتمل.',
  },

  providerCard: {
    kmAway: 'على بعد {km} كم',
  },

  worker: {
    online: 'متصل',
    offline: 'غير متصل',
    activeJob: 'المهمة الحالية',
    incomingRequests: 'الطلبات الواردة',
    noIncomingRequests: 'لا توجد طلبات واردة حاليًا.',
    goOnlineToReceive: 'أنت غير متصل - فعّل الاتصال لاستقبال الطلبات.',
    callClient: 'اتصل بالعميل',
    markCompleted: 'وضع علامة مكتمل',
    decline: 'رفض',
    accept: 'قبول',
    client: 'عميل',
    verified: '✓ موثّق',
    couldNotAccept: 'تعذّر القبول',
    couldNotDecline: 'تعذّر الرفض',
    couldNotComplete: 'تعذّر الإكمال',
    pushAcceptedTitle: 'تم قبول الطلب',
    pushAcceptedBody: '{name} في الطريق إليك!',
    pushDeclinedTitle: 'تم رفض الطلب',
    pushDeclinedBody: 'تعذّر على {name} تلبية هذا الطلب.',
    pushCompletedTitle: 'اكتملت الخدمة',
    pushCompletedBody: 'وضع {name} علامة على العمل كمكتمل - الدفع مستحق الآن.',
    pushYourProvider: 'مزود الخدمة الخاص بك',
  },

  workerHistory: {
    empty: 'لا توجد مهام مكتملة بعد.',
    clientFallback: 'عميل',
    paid: 'مدفوع',
    unpaid: 'غير مدفوع',
  },

  workerOnboarding: {
    title: 'أنشئ خدمتك',
    subtitle: 'سيجدك العملاء ضمن هذه الفئة',
    businessName: 'اسم النشاط / الاسم المعروض',
    contactPhone: 'هاتف التواصل',
    submitButton: 'ابدأ استقبال الطلبات',
    settingUp: 'جارٍ إعداد ملفك الشخصي...',
    locationPermissionError: 'إذن الموقع مطلوب حتى يتمكن العملاء من العثور عليك.',
    createError: 'تعذّر إنشاء ملف مزود الخدمة الخاص بك. حاول مرة أخرى.',
    locationHint:
      'سنستخدم موقعك الحالي كقاعدة لخدمتك - يمكنك تحديثه في أي وقت من ملفك الشخصي.',
  },

  workerProfile: {
    savedMessage: 'تم تحديث ملف مزود الخدمة الخاص بك.',
  },

  splash: {
    tagline: 'المساعدة في الطريق إليك',
  },

  nav: {
    appName: 'تاري9',
    setUpService: 'أنشئ خدمتك',
    providerDashboard: 'تاري9 لمزودي الخدمة',
    jobHistory: 'سجل المهام',
    yourLocation: 'موقعك',
    details: 'التفاصيل',
    nearbyProviders: 'مزودو الخدمة القريبون',
    requestStatus: 'حالة الطلب',
    payment: 'الدفع',
  },
};
