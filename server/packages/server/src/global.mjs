// console.log('#global')
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import request from '#root/request';
// const rp from 'request';
// const randtoken from 'rand-token';
// import User from "#models/user";
// import Settings from "#models/settings";
var Settings = {};
var User = {};
// import Sms from "#controllers/sms";
// import Action from "#controllers/action";
// import Customer from "#models/customer";
// import VARIABLE from "#v/variables";
// import config from "#json/variables/config";
var config = {
    setting: {
        logo: '',
        title: '',
        siteName: '',
        separator: '|',
        FRONT_ROUTE: '',
        SHOP_URL: '',
        BASE_URL: '',
        primaryColor: '',
        secondaryColor: '',
    },
};
// import randtoken from "rand-token";

let version = process.env.VERSION_NUM;
export const isSSR = typeof window === 'undefined';

let global = {
    body: '',
    ip: process.env.BASE_URL,
    domain: process.env.BASE_URL,
    capitalize: (str) => {
        return `${str[0].toLowerCase()}${str.slice(1)}`;
        // return str[0].toUpperCase() + str.slice(1)   // without template string
    },
    updateThemeConfig: (props = {}, __dirname = path.resolve()) => {
        console.log("updateThemeConfig==>")

        global
            .theme('admin', {props}, null)
            .then((resp = {}) => {
                console.log("global.theme==>")

                global.updateFile(
                    './theme/site_setting/',
                    'config.js',
                    "window.BASE_URL='" +
                    process.env.BASE_URL +
                    "';\n" +
                    "window.ADMIN_URL='" +
                    process.env.ADMIN_URL +
                    "';\n" +
                    "window.THEME_URL='" +
                    process.env.BASE_URL +
                    "/theme';\n" +
                    "window.SHOP_URL='" +
                    process.env.SHOP_URL +
                    "';\n" +
                    "window.defaultLanguage='" +
                    resp?.language +
                    "';\n" +
                    'window.theme=' +
                    JSON.stringify(resp) +
                    ';',
                    __dirname
                );
                global.updateFile(
                    './public_media/site_setting/',
                    'config.js',
                    "window.BASE_URL='" +
                    process.env.BASE_URL +
                    "';\n" +
                    "window.ADMIN_URL='" +
                    process.env.ADMIN_URL +
                    "';\n" +
                    "window.THEME_URL='" +
                    process.env.BASE_URL +
                    "/theme';\n" +
                    "window.SHOP_URL='" +
                    process.env.SHOP_URL +
                    "';\n" +
                    "window.defaultLanguage='" +
                    resp?.language +
                    "';\n" +
                    'window.theme=' +
                    JSON.stringify(resp) +
                    ';',
                    __dirname
                );
            })
            .catch((e) => {
                console.log("global.e==>")

                global.updateFile(
                    './theme/site_setting/',
                    'config.js',
                    "window.BASE_URL='" +
                    process.env.BASE_URL +
                    "';\n" +
                    "window.ADMIN_URL='" +
                    process.env.ADMIN_URL +
                    "';\n" +
                    "window.THEME_URL='" +
                    process.env.BASE_URL +
                    "/theme';\n" +
                    "window.defaultLanguage='" +
                    process.env.defaultLanguage +
                    "';\n" +
                    "window.SHOP_URL='" +
                    process.env.SHOP_URL +
                    "';",
                    __dirname
                );
                global.updateFile(
                    './public_media/site_setting/',
                    'config.js',
                    "window.BASE_URL='" +
                    process.env.BASE_URL +
                    "';\n" +
                    "window.ADMIN_URL='" +
                    process.env.ADMIN_URL +
                    "';\n" +
                    "window.THEME_URL='" +
                    process.env.BASE_URL +
                    "/theme';\n" +
                    "window.defaultLanguage='" +
                    process.env.defaultLanguage +
                    "';\n" +
                    "window.SHOP_URL='" +
                    process.env.SHOP_URL +
                    "';",
                    __dirname
                );
            });
    },
    config: (setting) => config,
    getTypeOfVariable: (variable) => {
        // console.log('variable',variable);
        return typeof variable;
    },
    rules: (rules, req = {}) => {
        console.log("rules==>")
        req.props.entity.forEach((en) => {
            let model = mongoose.model(en.modelName),
                identifire = en.modelName.toLowerCase();
            let schema = [];
            Object.keys(model.schema.obj).forEach((y) => {
                // console.log('model.schema.obj[y]',model.schema.obj[y]);
                schema.push({
                    name: y,
                    type: global.getTypeOfVariable(model.schema.obj[y]),
                });
            });
            if (en.admin && typeof en.admin === 'object') {
                rules[identifire] = en.admin;
            } else {
                rules[identifire] = {};
            }
            if (!rules[identifire].create) {
                rules[identifire].create = {};
            }
            if (!rules[identifire].create.fields) {
                rules[identifire].create.fields = schema;
            }
            if (!rules[identifire].edit) {
                rules[identifire].edit = {};
            }
            if (!rules[identifire].edit.fields) {
                rules[identifire].edit.fields = rules[identifire].create.fields;
            }
            if (!rules[identifire].list) {
                rules[identifire].list = {};
            }
            if (!rules[identifire].list.header) {
                rules[identifire].list.header = [];
            }
        });

        return rules;
    },
    models: () => {
        var models = mongoose.modelNames();
        return models;
    },
    builderComponents: (rules, req) => {
        let components = [];
        req.props.entity.forEach((en) => {
            if (en.components) {
                en.components.forEach((com) => {
                    components.push(com);
                });
            }
        });
        return components;
    },
    theme: (mode = 'admin', req, res, next) => {
        console.log('get theme settings... ');
        // return;
        return new Promise(function (resolve, reject) {
            let Settings = mongoose.model('Settings');
            let Template = mongoose.model('Template');
            let Page = mongoose.model('Page');
            Settings.findOne({}, 'currency gameMode showPricesToPublic forumMode learnMode socialMode guestMode language unitMass tax taxAmount factore_shop_name passwordAuthentication registerExtraFields orderExtraFields', function (set_err, setting) {
                // console.log('setting', setting)
                if (set_err) {
                    console.log("set_err", set_err)
                }
                if (setting && !set_err)
                    Template.findOne({type: 'header'}, function (err_header, header) {
                        if (err_header) {
                            console.log("Template.findOne header ./global.mjs line 218", err_header)

                        }
                        Template.findOne({type: 'footer'}, function (err_footer, footer) {
                            if (err_footer) {
                                console.log("Template.findOne footer ./global.mjs line 223", err_footer)

                            }
                            let routes = [];
                            Page.find({}, function (err_page, pages) {
                                if (err_page) {
                                    console.log("Page.findOne ./global.mjs line 223", err_page)

                                }
                                if (pages)
                                    pages.forEach((page) => {
                                        if (page.path) {
                                            routes.push({
                                                path: page.path,
                                                exact: true,
                                                layout: 'DefaultLayout',
                                                element: 'DynamicPage',
                                                elements: page.elements || [],
                                            });
                                        }
                                    });
                                // console.log('footer error',err);
                                // console.log('footer',footer);
                                if (req.headers && req.headers.token) {
                                }
                                // let headerMaxWidth='100%';
                                // if()
                                let currency = 'rial';
                                if (setting && setting.currency) {
                                    currency = setting.currency;
                                }
                                let socialMode = false;
                                if (setting && setting.socialMode) {
                                    socialMode = setting.socialMode;
                                }
                                let unitMass = 'gram';
                                if (setting && setting.unitMass) {
                                    unitMass = setting.unitMass;
                                }
                                let guestMode = false;
                                if (setting && setting.guestMode) {
                                    guestMode = setting.guestMode;
                                }

                                let language = 'fa';
                                if (setting && setting.language) {
                                    console.log('language of site: ', setting.language)
                                    language = setting.language;
                                }

                                let viewMode = 'advanced';
                                if (setting && setting.unitMass) {
                                    unitMass = setting.unitMass;
                                }

                                let tax = false;
                                if (setting && setting.tax) {
                                    tax = setting.tax;
                                }

                                let showPricesToPublic = true;
                                if (setting && !setting.showPricesToPublic) {
                                    showPricesToPublic = setting.showPricesToPublic;
                                }

                                let factore_shop_name = false;
                                if (setting && setting.factore_shop_name) {
                                    factore_shop_name = setting.factore_shop_name;
                                }
                                let passwordAuthentication = false;
                                if (setting && setting.passwordAuthentication) {
                                    passwordAuthentication = setting.passwordAuthentication;
                                }
                                let registerExtraFields = false;
                                if (setting && setting.registerExtraFields) {
                                    registerExtraFields = setting.registerExtraFields;
                                }
                                let orderExtraFields = false;
                                if (setting && setting.orderExtraFields) {
                                    orderExtraFields = setting.orderExtraFields;
                                }
                                let taxAmount = 0;
                                if (setting && setting.taxAmount) {
                                    taxAmount = setting.taxAmount;
                                }
                                let learnMode = false
                                if (setting && setting.learnMode) {
                                    learnMode = setting.learnMode;
                                }
                                let forumMode = false
                                if (setting && setting.forumMode) {
                                    forumMode = setting.forumMode;
                                }
                                let gameMode = false
                                if (setting && setting.gameMode) {
                                    gameMode = setting.gameMode;
                                }

                                let lastObj = {
                                    taxAmount: taxAmount,
                                    tax: tax,
                                    learnMode: learnMode,
                                    forumMode: forumMode,
                                    gameMode: gameMode,
                                    showPricesToPublic: showPricesToPublic,
                                    // manager_mode: manager_mode,
                                    passwordAuthentication: passwordAuthentication,
                                    registerExtraFields: registerExtraFields,
                                    orderExtraFields: orderExtraFields,
                                    factore_shop_name: factore_shop_name,
                                    currency: currency,
                                    unitMass: unitMass,
                                    guestMode: guestMode,
                                    language: language,
                                    socialMode: socialMode,
                                    header: {
                                        maxWidth:
                                            header && header.maxWidth ? header.maxWidth : '100%',
                                        backgroundColor:
                                            header && header.backgroundColor
                                                ? header.backgroundColor
                                                : '',
                                        classes: header && header.classes ? header.classes : '',
                                        padding: header && header.padding ? header.padding : '',
                                        showInDesktop:
                                            header && header.showInDesktop ? header.showInDesktop : '',
                                        showInMobile:
                                            header && header.showInMobile ? header.showInMobile : '',
                                        elements: header ? header.elements : [],
                                    },
                                    // body: [{name: 'MainContent'}],
                                    footer: {
                                        maxWidth:
                                            footer && footer.maxWidth ? footer.maxWidth : '100%',
                                        backgroundColor:
                                            footer && footer.backgroundColor
                                                ? footer.backgroundColor
                                                : '',
                                        classes: footer && footer.classes ? footer.classes : '',
                                        padding: footer && footer.padding ? footer.padding : '',
                                        elements: footer ? footer.elements : [],
                                    },
                                    // routes: [
                                    //     {
                                    //         path: '/',
                                    //         exact: true,
                                    //         layout: 'DefaultLayout',
                                    //         element: 'Home',
                                    //     },
                                    //
                                    //     {
                                    //         path: '/chat',
                                    //         exact: true,
                                    //         layout: 'Nohf',
                                    //         element: 'Chat',
                                    //     },
                                    //     {
                                    //         path: '/transaction/:method',
                                    //         exact: true,
                                    //         layout: 'Nohf',
                                    //         element: 'Transaction',
                                    //     },
                                    //     {
                                    //         path: '/transaction',
                                    //         exact: true,
                                    //         layout: 'Nohf',
                                    //         element: 'Transaction',
                                    //     },
                                    //     {
                                    //         path: '/admin',
                                    //         exact: true,
                                    //         layout: 'Nohf',
                                    //         element: 'Admin',
                                    //     },
                                    //     {
                                    //         path: '/admin/:model',
                                    //         exact: true,
                                    //         layout: 'Nohf',
                                    //         element: 'Admin',
                                    //     },
                                    //     {
                                    //         path: '/admin/:model/:action',
                                    //         exact: true,
                                    //         layout: 'Nohf',
                                    //         element: 'Admin',
                                    //     },
                                    //     {
                                    //         path: '/admin/:model/:action/:_id',
                                    //         exact: true,
                                    //         layout: 'Nohf',
                                    //         element: 'Admin',
                                    //     },
                                    //     {
                                    //         path: '/a/:_entity/:_id/:_slug',
                                    //         method: 'get',
                                    //         access: 'customer_all',
                                    //         controller: (req, res, next) => {
                                    //             console.log(
                                    //                 'show front, go visit ',
                                    //                 process.env.SHOP_URL
                                    //             );
                                    //             res.show();
                                    //         },
                                    //     },
                                    //     ...routes,
                                    // ],
                                    // components: global.builderComponents([], {props: req.props}),
                                };
                                if (mode == 'admin') {
                                    let rules = {};
                                    rules = global.rules(rules, {props: req.props});
                                    // console.log('global.models',global.models)
                                    // lastObj['models'] = global.models();
                                    // lastObj['rules'] = JSON.parse(JSON.stringify(rules));
                                }
                                if (res) return res.json(lastObj);
                                else return resolve(lastObj);
                            });
                        });
                    });
            });
        });
    },
    persianToUnicodeSlug: (text) => {
        const normalizedText = text.normalize('NFKD');
        return normalizedText.replace(/\//g, '-').replace(/ /g, "-")  // Remove any characters that aren't alphanumeric or spaces
    },
    isPersian: (text) => {
        const persianRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
        return persianRegex.test(text);
    },
    normalizeSlug: (title) => {

        if (global.isPersian(title)) {
            return (global.persianToUnicodeSlug(title))
        } else {
            return global.convertToSlug(title)
        }
    },
    getRobots: (req, res, next) => {
        res.type('text/plain');
        res.send(`
User-agent: *
Disallow: /admin/
Disallow: /home/
Disallow: /questioncategory/

Sitemap: ${process.env.BASE_URL}/sitemap.xml
    `);
    },
    convertToSlug: (Text) => {
        return Text.toLowerCase()
            .replace(/ /g, "-")
            .replace(/[^\w-]+/g, "-");
    },
    textToBarcode: (barcode) => {
        // const normalizedBarcode = barcode.replace(/❊/g, '@');
        // return normalizedBarcode

        const symbolToDigit = {
            ')': '0',
            '(': '9',
            '*': '8',
            '&': '7',
            '^': '6',
            '%': '5',
            '$': '4',
            '#': '3',
            '@': '2',
            '!': '1'
        };

        // Replace symbols with corresponding digits, ignore already existing digits
        const normalizedBarcode = barcode.split('').map(char => {
            return symbolToDigit[char] || char; // Replace only if it's in the mapping
        }).join('');

        return normalizedBarcode;
    },
    barcodeToText: (Barcode) => {

    },
    submitAction: (obj) => {
        console.log('==> submitAction for user', obj.user);
        return new Promise(function (resolve, reject) {
            let Action = mongoose.model('Action');
            try {
                Action.create(obj, function (err, res) {
                    if (err || !res) {
                        console.log('xxx submitAction error:', err)
                        reject({});
                    }
                    // if (res.title)
                    console.log('==> submitAction', res)
                    resolve(res);
                });
            } catch (e) {
                console.error('==> Failed submitAction')
                reject(e);
            }
            // .catch(err => {
            //         console.error('==> Failed submitAction', res._id)
            //
            //         reject(err);
            //     });
        });
    },
    fireEvent: (
        event,
        params = {},
        props = {},
        req = null,
        res = null,
        next = null
    ) => {
        console.log('Fire events...', event);
        let functions = [];
        props.entity.forEach((en, d) => {
            // console.log('en',en.name)
            // if (en.functioŒns) {
            //     en.functions.forEach((fn) => {
            //         console.log('fn', fn)
            //         functions.push(fn);
            //     });
            // }
            if (en.hook) {
                en.hook.forEach((hook) => {
                    // console.log('hook',hook)
                    if (hook.event == event) {
                        // console.log('run event ...', hook.name)
                        // if (req && res && next)
                        hook.func(req, res, next, params);
                    }
                });
            }
        });
        let Automation = mongoose.model('Automation');
        Automation.find({trigger: event}, function (err, automations) {
            if (err || !automations) {
                // console.log('return...')
                return;
            }
            if (automations) {
                automations.forEach((item, i) => {
                    if (item && item.functions) {
                        item.functions.forEach((func, j) => {
                            functions.forEach((call) => {
                                // if(call==func.name)
                            });
                        });
                    }
                });
            }
        });
    },
    resetSystem: () => {
        request(
            {
                method: 'post',
                url: 'http://rest.payamak-panel.com/api/SendSMS/SendSMS',
                data: {
                    username: process.env.SMS_USERNAME,
                },
            },
            (error, response, parsedBody) => {
            }
        ).catch(function (err) {
        });
    },
    CONFIG: {
        BASE_URL: process.env.BASE_URL,
        SHOP_URL: process.env.SHOP_URL,
        THEME_URL: process.env.THEME_URL,
        FRONT_ROUTE: process.env.BASE_URL + '/customer',
        setting: {
            separator: '|',
            siteName: process.env.SITE_NAME,
        },
    },
    getSetting: (name) => {
        return new Promise(function (resolve, reject) {
            let Settings = mongoose.model('Settings');

            Settings.findOne({}, name, function (err, setting) {
                if (err || !setting) {
                    return reject(err);
                }
                // console.log('getSetting', setting[name])
                if (setting[name]) return resolve(setting[name]);
                else reject({});
            });
        });
    },
    sendSms: function (
        to,
        text,
        From = process?.env?.SMS_NUMBER ? process.env.SMS_NUMBER : '50004000004',
        customerId = null,
        countryCode = '98',
        findKey = false
    ) {
        return new Promise(function (resolve, reject) {
            // return;
            if(process?.env?.SMS_NUMBER)
                From=process.env.SMS_NUMBER
            to = to.toString();
            if (to.length < 12) {
                // console.log('to: ', to.toString(), to.toString().length);
                if (to.toString().length === 10) {
                    to = '98' + to.toString();
                }
            }
            console.log('countryCode', countryCode);
            if (findKey) {
                let Settings = mongoose.model('Settings');

                Settings.find({}, function (err, setting) {
                    if (setting && setting[setting.length - 1]) {
                        let smstext = setting[setting.length - 1];
                        smstext = smstext[findKey];
                        if (typeof text == 'object') {
                            text.forEach((tt) => {
                                // const reg = /((\%(.*)\%)|(%(.*)%))/;
                                console.log('%' + tt.key + '%');
                                smstext = smstext?.replace('%' + tt.key + '%', tt.value);
                            });
                        }
                        global.sendmessage(
                            countryCode,
                            process?.env?.SMS_NUMBER ? process.env.SMS_NUMBER : '50001060009809',
                            to,
                            smstext,
                            resolve,
                            reject
                        );
                    }
                });
            } else {
                // 300088103373
                //50001060009809
                global.sendmessage(
                    countryCode,
                    process?.env?.SMS_NUMBER ? process.env.SMS_NUMBER : '50001060009809',
                    to,
                    text,
                    resolve,
                    reject
                );
            }
        });
    },
    sendmessage: function (
        countryCode = '98',
        From = process?.env?.SMS_NUMBER ? process.env.SMS_NUMBER : '300088103373',
        to,
        text,
        resolve,
        reject
    ) {
        if (countryCode === '98') {
            // From = '50004000004';
            console.log('\n\n\n\n\n\nsend sms for Iran\n');
            console.log('process.env.SMS_NUMBER:', process.env.SMS_NUMBER);
            console.log('process.env.SMS_USERNAME:', process.env.SMS_USERNAME);
            console.log('process.env.SMS_PASSWORD:', process.env.SMS_PASSWORD);
            console.log('to:', to);
            console.log('From', From);
            console.log('text', text);
            console.log('\n\n\n\n\n');
            let Notification = mongoose.model('Notification');

            Notification.create({
                message: text,
                phoneNumber: to,
                from: From,
            }).then((sms) => {
                // console.log("sss", sms);

                let options = {
                    method: 'post',
                    url: 'http://rest.payamak-panel.com/api/SendSMS/SendSMS',
                    data: {
                        username: process.env.SMS_USERNAME,
                        password: process.env.SMS_PASSWORD,
                        from: From,
                        //  from: '300088103373',

                        to: to,
                        isflash: 'false',
                        text: text,
                    },
                    // json: true // Automatically stringifies the body to JSON
                };

                // rp(options)
                //     .then(function (parsedBody) {
                request(options, function (error, response, parsedBody) {
                    console.log(
                        'parsedBody of sending sms to melli payamak:',
                        parsedBody,
                        to,
                        text
                    );
                    console.log(
                        'melli payamak:',
                        parsedBody.StrRetStatus,
                        parsedBody.RetStatus
                    );
                    if (parsedBody.StrRetStatus == 'Ok' && parsedBody.RetStatus == 1) {
                        // Notification.editByAdmin(sms._id, {status: "sent"});
                    }
                    return resolve({
                        success: true,
                        message: 'کد برای شما ارسال شد!',
                    });
                }).catch(function (err) {
                    console.log('err global sms:', err);
                    return reject({
                        success: true,
                        err: err,
                        message: 'مشکل در ارسال اس ام اس!',
                    });
                });
            });
        } else {
            reject({});
        }
    },
    publishToTelegram: function (obj, chname = 'channelname') {
        return new Promise(function (resolve, reject) {
            let u = encodeURI('https://idehweb.com/telegram/index.php');
            // if (chname != "arvandguarantee_shop") {
            //   u += "?chname=@" + chname;
            // }
            let options = {
                method: 'POST',
                url: u,
                body: obj,
                json: true, // Automatically stringifies the body to JSON
            };
            // console.log('d')
            // rp(options)
            //     .then(function (parsedBody) {
            request(options, function (error, response, parsedBody) {
                // console.log('parsedBody:', parsedBody, obj);
                resolve({
                    success: true,
                    // body:parsedBody
                });
            }).catch(function (err) {
                // console.log('err:', err);
                reject({
                    success: false,
                });
            });
        });
    },

    notifateToTelegram: function (obj) {
        return new Promise(function (resolve, reject) {
            //     // obj.message += "\n\n\n" + "ثبت آگهی رایگان در زومی روم..." + "\n" + "@zmnotifications" + "\n" + "https://zoomiroom.com"
            //     let u = encodeURI('https://arvandguarantee.com/telegram/index.php?chname=@zmnotifications');
            //     let options = {
            //         method: 'POST',
            //         uri: u,
            //         body: obj,
            //         json: true // Automatically stringifies the body to JSON
            //     };
            //     console.log('d')
            //     rp(options)
            //         .then(function (parsedBody) {
            //             console.log('parsedBody:', parsedBody, obj);
            resolve({
                success: true,
                // body:parsedBody
            });
            //         })
            //         .catch(function (err) {
            //             console.log('err:', err);
            //             reject({
            //                 success: false
            //             });
            //         });
            //
            //
        });
    },
    sendNotif: function (title, body, pg) {
        return new Promise(function (resolve, reject) {
            let options = {
                method: 'POST',
                url: 'https://fcm.googleapis.com/fcm/send',
                body: {
                    notification: {
                        title: title,
                        body: body,
                        click_action: '',
                        icon: '',
                    },
                    priority: 'high',
                    to: '/topics/all',
                },
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: '',
                },
                json: true, // Automatically stringifies the body to JSON
            };

            // rp(options)
            //     .then(function (parsedBody) {
            request(options, function (error, response, parsedBody) {
                // console.log('parsedBody:', parsedBody, title, body);
                resolve({
                    success: true,
                    message: 'نوتیف شما ارسال شد!',
                    parsedBody: parsedBody,
                });
            }).catch(function (err) {
                //  console.log('err:', err);
                reject({
                    success: true,
                    message: 'مشکل در ارسال نوتیف!',
                });
            });
        });
    },
    generateUnid: function (arr, userIp) {
        let abc = 'abcdefghijklmnopqrstuvwxyz1234567890'.split('');
        var token = '';
        for (let i = 0; i < 32; i++) {
            token += abc[Math.floor(Math.random() * abc.length)];
        }
        // console.log('token is',token);
        return token; //Will return a 32 bit "hash"

        // return randtoken.generate(32);
    },
    makeid: function () {
        let text = "";
        let possible = "abcdefghijklmnopqrstuvwxyz0123456789";

        for (let i = 0; i < 6; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    },
    addUnic: async function (arr, userIp) {
        return await new Promise(async function (resolve, reject) {
            const {length} = await arr;
            // console.log('arr.length', length);
            // console.log('userIp', userIp);
            const id = await (length + 1);
            const found = await arr.some((el) => el.userIp === userIp);
            // console.log('found', found);
            if (!found) {
                await arr.push({userIp: userIp, createdAt: new Date()});
            }
            await resolve(arr);
        });
    },
    checkSiteStatus: function () {
        return new Promise(function (resolve, reject) {
            let Settings = mongoose.model('Settings');

            Settings.find(
                {},
                {
                    activeCategory: 1,
                    siteActive: 1,
                    siteActiveMessage: 1,
                },
                function (err, setting) {
                    setting = setting[0];
                    if (err || !setting || setting == null) {
                        // console.log('==> authenticateAdmin() got error');
                        reject({
                            success: false,
                            message: 'something wrong!',
                        });
                    }
                    // console.log('setting', setting);
                    // activeCategory
                    // console.log('activeCategory', setting.activeCategory);
                    if (setting && setting.siteActive) {
                        resolve({
                            success: true,
                            activeCategory: setting.activeCategory,
                        });
                    } else if (
                        setting &&
                        setting.siteActiveMessage &&
                        setting.activeCategory
                    ) {
                        reject({
                            success: false,
                            message: setting.siteActiveMessage || '',
                            activeCategory: setting.activeCategory,
                        });
                    } else {
                        reject({
                            success: false,
                        });
                    }
                }
            );
        });
    },
    checkAdminAuthentication: function (token) {
        return new Promise(function (resolve, reject) {
            User.findOne(
                {
                    token: token,
                },
                'username , _id , active',
                function (err, post) {
                    if (err) {
                        // console.log('==> authenticateAdmin() got error');
                        reject(err);
                    } else {
                        // console.log('==> authenticateAdmin() got response ');
                        if (post) {
                            resolve({
                                success: true,
                                message: 'Admin has access!',
                                user: post,
                            });
                        } else {
                            reject({
                                success: false,
                                status: 401,
                                message: 'Admin does not exist!',
                            });
                        }
                    }
                }
            );
        });

        // return new Promise(function (resolve, reject) {
        //     if (!session_userId) {
        //         reject(false);
        //     }
        //     Admin.findById(session_userId)
        //         .exec(function (error, user) {
        //             if (error) {
        //                 reject(false);
        //             } else {
        //                 // console.log(user);
        //                 if (user)
        //                     resolve({success: true, user: {username: user.username, role: user.type,token:user.token}});
        //                 else
        //                     reject(false);
        //             }
        //         });
        //
        // });
    },
    checkCustomerAuthentication: function (token) {
        return new Promise(function (resolve, reject) {
            Customer.findOne(
                {
                    'tokens.token': token,
                },
                function (err, customer) {
                    if (err || !customer) {
                        // console.log('==> authenticateCustomer() got error');
                        reject(err);
                    }
                    // else {
                    // console.log('version:',version);
                    // if (customer) {

                    resolve({
                        success: true,
                        message: 'Customer has access!',
                        customer: customer,
                    });

                    // } else {
                    //     reject({success: false, status: 401, message: 'Customer does not exist!'});
                    // }
                    // }
                }
            );
        });
    },
    asyncForEach: async function (array, callback) {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array);
        }
    },
    check: function (s) {
        let PersianOrASCII = /[آ-ی]|([a-zA-Z])/;
        if ((m = s.match(PersianOrASCII)) !== null) {
            if (m[1]) {
                return false;
            } else {
                return true;
            }
        } else {
            return true;
        }
    },
    city: function (s) {
        let x = '';
        switch (s) {
            case 1:
                x = 'آذربایجان شرقی';
                break;
            case 2:
                x = 'آذربایجان غربی';
                break;
            case 3:
                x = 'اردبیل';
                break;
            case 4:
                x = 'اصفهان';
                break;
            case 5:
                x = 'ایلام';
                break;
            case 6:
                x = 'بوشهر';
                break;
            case 7:
                x = 'تهران';
                break;
            case 8:
                x = 'چهارمحال و بختیاری';
                break;
            case 9:
                x = 'خراسان جنوبی';
                break;
            case 10:
                x = 'خراسان رضوی';
                break;
            case 11:
                x = 'خراسان شمالی';
                break;
            case 12:
                x = 'خوزستان';
                break;
            case 13:
                x = 'زنجان';
                break;
            case 14:
                x = 'سمنان';
                break;
            case 15:
                x = 'سیستان و بلوچستان';
                break;
            case 16:
                x = 'فارس';
                break;
            case 17:
                x = 'قزوین';
                break;
            case 18:
                x = 'قم';
                break;
            case 19:
                x = 'کردستان';
                break;
            case 20:
                x = 'کرمان';
                break;
            case 21:
                x = 'کرمانشاه';
                break;
            case 22:
                x = 'البرز';
                break;
            case 23:
                x = 'گلستان';
                break;
            case 24:
                x = 'گیلان';
                break;
            case 25:
                x = 'لرستان';
                break;
            case 26:
                x = 'مازندران';
                break;
            case 27:
                x = 'مرکزی';
                break;
            case 28:
                x = 'هرمزگان';
                break;
            case 29:
                x = 'همدان';
                break;
            case 30:
                x = 'یزد';
                break;
            case 31:
                x = 'کهگیلویه و بویراحمد';
                break;
        }
        return x;
    },
    getFormattedTime: function () {
        let today = new Date();
        let y = today.getFullYear();
        let mo = today.getMonth();
        let d = today.getDate();
        let h = today.getHours();
        let m = today.getMinutes();
        let s = today.getSeconds();
        return y + '-' + mo + '-' + d + '-' + h + '-' + m + '-' + s;
    },
    updateFile: function (thePath, file_name, data, __dirname = path.resolve()) {
        // const __dirname = path.resolve();
        let filePath = path.join(__dirname, thePath, file_name);

        try {
            // console.log('reading file:', filePath)
            fs.promises.writeFile(filePath, data, 'utf8');
            // console.log("\ndata is written successfully in the file\n" +
            //     "filePath: " + filePath + " " + file_name);
        } catch (err) {
            console.error('not able to write data in the file ', err);
        }
    },
    authenticateCustomer: function (_id, token) {
        // console.log('==> authenticateCustomer ()');
        return new Promise(function (resolve, reject) {
            Customer.findOne(
                {
                    _id: _id,
                    'tokens.token': token,
                },
                function (err, post) {
                    if (err) {
                        // console.log('==> authenticateCustomer() got error');
                        reject(err);
                    } else {
                        // console.log('==> authenticateCustomer() got response ');
                        if (post) {
                            resolve({
                                success: true,
                                message: 'Customer has access!',
                                user_id: post._id,
                                _id: post._id,
                            });
                        } else {
                            reject({
                                success: false,
                                status: 401,
                                message: 'Customer does not exist!',
                            });
                        }
                    }
                }
            );
        });
    },
    // Promise:global.Promise
};

export default global;
