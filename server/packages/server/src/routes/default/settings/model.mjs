// console.log('#model setting')

export default (mongoose) => {
    const SettingsSchema = new mongoose.Schema({
        title: {},
        siteName: {},
        keywords: {},
        description: {},
        messages: [],
        plugins: {},
        registerExtraFields: [],
        orderExtraFields: [],
        data: [],
        settings: {},
        showPricesToPublic: {type: Boolean, default: true},
        guestMode: {type: Boolean, default: false},
        language: String,
        expireDateMode: {type: Boolean, default: false},
        siteActive: {type: Boolean, default: true},
        limitRegistration: {type: Boolean, default: false},
        socialMode: {type: Boolean, default: false},
        learnMode: {type: Boolean, default: false},
        forumMode: {type: Boolean, default: false},
        gameMode: {type: Boolean, default: false},
        paymentActive: {type: Boolean, default: true},
        tax: {type: Boolean, default: true},
        passwordAuthentication: {type: Boolean, default: true},
        taxAmount: Number,
        defaultLanguage: String,
        factore_shop_name: String,
        factore_shop_site_name: String,
        factore_shop_site_address: String,
        factore_shop_address: String,
        factore_shop_phoneNumber: String,
        factore_shop_faxNumber: String,
        factore_shop_postalCode: String,
        factore_shop_submitCode: String,
        factore_shop_internationalCode: String,
        defaultSmsGateway: String,
        defaultBankGateway: String,
        siteActiveMessage: String,
        logo: String,
        header_first: String,
        header_last: String,
        body_first: String,
        body_last: String,
        ADMIN_ROUTE: String,
        ADMIN_URL: String,
        SHOP_URL: String,
        BASE_URL: String,
        ZIBAL_TOKEN: String,
        ZARINPAL_TOKEN: String,
        primaryColor: String,
        addToCartTextColor: String,
        addToCartColor: String,
        addToCartHoverColor: String,
        secondaryColor: String,
        textColor: String,
        bgColor: String,
        footerBgColor: String,
        unitMass: {type: String, default: 'gram'},
        createdAt: {type: Date, default: Date.now},
        updatedAt: {type: Date, default: Date.now},
        activeCategory: [{type: mongoose.Schema.Types.ObjectId, ref: "Category"}],
        customerStatus: [],
        formStatus: [],
        currency: {type: String, default: 'Toman'},
        dollarPrice: Number,
        derhamPrice: Number,
        sms_welcome: {},
        sms_register: {},
        sms_submitOrderNotPaying: {},
        sms_submitOrderFromAdmin: {},
        sms_submitOrderSuccessPaying: {},
        sms_onSendProduct: {},
        sms_onGetProductByCustomer: {},
        sms_submitReview: {},
        sms_onCancel: {}
    });
    return SettingsSchema;

// module.exports = mongoose.model('User', UserSchema);

    // return mongoose.model('Settings', SettingsSchema);
    // export default mongoose.model('User', UserSchema);

    // return User

};
