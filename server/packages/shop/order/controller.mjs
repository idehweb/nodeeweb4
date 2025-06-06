import _ from 'lodash'
import crypto from 'crypto';
import persianJs from "persianjs";
import stringMath from "string-math";
import moment from "moment-jalaali";
import {Types} from 'mongoose';
import {replaceValue} from './utils.mjs'
import fs from 'fs'; // Import fs for file system operations
import pdf from 'html-pdf'
import path from 'path'; // Import path for handling file paths

let self = ({
    update: async function (req, res, next) {
        const orderModel = req.mongoose.model('Order');
        const settingModel = req.mongoose.model('Settings');

        const order = await orderModel.findById(req.params.id).populate('transaction', {Authority: 1});
        const setting = await settingModel.findOne({});

        if (!order) return res.status(404).json({message: "order not found", success: 'false'});

        // Check if the role is 'agent' and if the order should be editable
        if (req.headers.role == 'agent') {
            if (order?.agent?._id) {
                console.log("status", order.status, "order.agent", order.agent, "order.statusArray", order.statusArray);

                if (order?.status === 'processing' && (order.statusArray?.length === 0 || !order.statusArray)) {
                    // If the order is not editable
                    return res.status(200).json({message: "Order is not editable", success: 'false'});
                } else {
                    // If the order is editable, set the flag to true
                    order.editable = true;
                }
            }
        }

        // If the role is 'admin', the order is always editable
        if (req.headers.role == 'admin') {
            order.editable = true;
        }

        // Proceed with updating the order if it is editable
        if (order.editable) {
            // Now handle the status changes and SMS notifications
            let text, settingKey;
            switch (order.status) {
                case 'cart':
                    break;
                case 'checkout':
                    break;
                case 'processing':
                    break;
                case 'indoing':
                    break;
                case 'makingready':
                    break;
                case 'inpeyk':
                    settingKey = 'sms_onSendProduct'
                    break;
                case 'complete':
                    break;
                case 'cancel':
                    settingKey = 'sms_onCancel';
                    break;
            }

            if (req.global?.sendSms && settingKey && order.customer_data?.phoneNumber) {
                const newTxt = replaceValue({
                    text: setting[settingKey],
                    data: [order.toObject(), order.customer_data, {payment_link: `https://gateway.zibal.ir/start/${order.transaction?.pop()?.Authority}`}]
                });
                // Uncomment this to send the SMS
                // req.global.sendSms(order.customer_data?.phoneNumber, newTxt);
            }

            // Update the order and send response
            await orderModel.findByIdAndUpdate(req.params.id, req.body, {new: true});
            return res.json({order, success: 'true'});
        } else {
            // If the order is not editable, return a failure response
            return res.status(403).json({message: "Order is not editable", success: 'false'});
        }
    },

    // update: async function (req, res, next) {
    //     const orderModel = req.mongoose.model('Order');
    //     const settingModel = req.mongoose.model('Settings');
    //     if (req.headers.role == 'agent') {
    //         req.body.status = 'processing'
    //         delete req.body.paymentStatus
    //     }
    //     const order = await orderModel.findByIdAndUpdate(req.params.id, req.body, {new: true}).populate('transaction', {Authority: 1});
    //     const setting = await settingModel.findOne({});
    //
    //     if (!order) return res.status(404).json({message: "order not found", success: 'false'});
    //     let text, settingKey;
    //     switch (order.status) {
    //         case 'cart':
    //             break;
    //         case 'checkout':
    //             break;
    //         case 'processing':
    //             break;
    //         case 'indoing':
    //             break;
    //         case 'makingready':
    //             break;
    //         case 'inpeyk':
    //             settingKey = 'sms_onSendProduct'
    //             break;
    //         case 'complete':
    //             break;
    //         case 'cancel':
    //             settingKey = 'sms_onCancel';
    //             break;
    //     }
    //
    //     if (req.global?.sendSms && settingKey && order.customer_data?.phoneNumber) {
    //         const newTxt = replaceValue({
    //             text: setting[settingKey],
    //             data: [order.toObject(), order.customer_data, {payment_link: `https://gateway.zibal.ir/start/${order.transaction?.pop()?.Authority}`}]
    //         });
    //         // if(newTxt)
    //         // req.global.sendSms(order.customer_data?.phoneNumber, newTxt);
    //     }
    //     return res.json(order);
    //
    // },
    recommendation: async function (req, res, next) {
        const cart = req.body.cart;
        const pids = cart.map(p => p._id || p.id).map(id => new Types.ObjectId(id.split('DDD')[0]));
        const productModel = req.mongoose.model('Product');
        const products = await productModel.find({_id: {$in: pids}}).populate('relatedProducts');
        const relatedProducts = products.flatMap(p => p.relatedProducts)
        const {hasSale, normal} = relatedProducts.reduce((prev, curr) => {
            const hasSale = curr.salePrice || curr.combinations?.some(c => c.salePrice);
            if (hasSale) prev.hasSale.push(curr);
            else prev.normal.push(curr);
            return prev;
        }, {hasSale: [], normal: []});
        return res.json([...hasSale, ...normal].slice(0, 5))
    },

    allold: function (req, res, next) {
        // console.log('get all orders...')
        let Order = req.mongoose.model('Order');

        let offset = 0;
        if (req.params.offset) {
            offset = parseInt(req.params.offset);
        }

        let search = {};

        if (req.query['customer']) {
            search['customer'] = req.query['customer']
        }

        if (req.query['firstName']) {
            // if (!Array.isArray(search['$or'])) {
            //     search['$or'] = [];
            //
            // }
            // search['$or'].push({
            //     "customer_data.firstName": {
            //         $exists: true,
            //         "$regex": req.query['firstName'],
            //         "$options": "i"
            //     }
            // });

            search['customer_data.firstName'] = {
                $exists: true,
                '$regex': req.query['firstName'],
                '$options': 'i',

            };

        }
        if (req.query['lastName']) {
            // if (!Array.isArray(search['$or'])) {
            //     search['$or'] = [];
            //
            // }
            // search['$or'].push({
            //     "customer_data.lastName": {
            //         $exists: true,
            //         "$regex": req.query['lastName'],
            //         "$options": "i"
            //     }
            // });
            search['customer_data.lastName'] = {
                $exists: true,
                '$regex': req.query['lastName'],
                '$options': 'i',

            };


        }
        if (req.query['paymentStatus']) {
            // if (!Array.isArray(search['$or'])) {
            //     search['$or'] = [];
            //
            // }
            // search['$or'].push({
            //     paymentStatus: req.query['paymentStatus']
            // });

            search['paymentStatus'] = req.query['paymentStatus'];
        }
        if (req.query['date_gte']) {

            search['createdAt'] = {$gt: new Date(req.query['date_gte'])};
        }
        if (req.query['date_lte']) {

            search['createdAt']['$lt'] = new Date(req.query['date_lte']);
        }

        search['status'] = {
            $nin: ['cart', 'checkout', 'trash', ''],

        };
        if (req.query['status'] && req.query['status'] != 'all') {
            if (!search['status']) {

                search['status'] = {};
            }
            search['status']['$in'] = (req.query['status']);
        }

        if (req.query['search']) {
            // if (!Array.isArray(search['$or'])) {
            //     search['$or'] = [];
            //
            // }
            // search['$or'] = [];
            // search['$or'].push({
            //     "customer_data.phoneNumber": {
            //         $exists: true,
            //         "$regex": req.query['search'],
            //         "$options": "i"
            //     }
            // });
            // search['$or'].push({
            //     // "$where": "function() { return this.orderNumber.toString().match(/" + req.query['search'] + "/) != null; }"
            //     "orderNumber": parseInt(req.query['search'])
            // });
            // search['orderNumber'] = {
            //         $exists: true,
            //         "$regex": req.query['search'],
            //         "$options": "i"
            // };
            // search["$where"]=
            //     "function() { return this.orderNumber.toString().match(/" + req.params.search + "/) != null; }"};

            // search['orderNumber'] = { "$where": "function() { return this.number.toString().match(/"+req.query['search']+"/) != null; }" };
            search['orderNumber'] = parseInt(req.query['search']);
            delete search['status'];

        }
        let f = [];

        if (req.query['orderNumber']) {
            search['orderNumber'] = req.query['orderNumber']
        }
        if (req.headers.role == 'agent') {
            search['agent'] = req.headers._id
        }
        console.log('search', search);
        Order.find(search, '_id , orderNumber , agent , customer_data , source , customer , sum , amount , paymentStatus , status , createdAt , updatedAt , card', function (err, orders) {
            if (err || !orders) {
                console.log('err', err);
                res.json([]);
                return 0;
            }
            let thelength = orders.length, p = 0;
            // console.log('orders', orders);
            delete search['$or'];
            Order.countDocuments(search, function (err, count) {
                // console.log('countDocuments', count, err);
                if (err || !count) {
                    res.json([]);
                    return 0;
                }
                res.setHeader(
                    'X-Total-Count',
                    count,
                );
                _.forEach(orders, (item, i) => {
                    // console.log('item._id', item._id, item.customer)
                    if (item.customer && item.customer._id) {
                        let sObj = {customer: item.customer._id};

                        if (req.query['date_gte']) {

                            sObj['createdAt'] = {$lt: new Date(req.query['date_gte'])};
                        }
                        if (search['status']) {
                            sObj['status'] = search['status'];
                        }
                        // console.log('sObj',sObj)
                        Order.countDocuments(sObj, function (err, theOrderCount) {
                            orders[i].customer.orderCount = (theOrderCount - 0);
                            if (req.query.orderCount) {
                                // console.log('req.query.orderCount', req.query.orderCount)
                                if (orders[i].customer.orderCount > req.query.orderCount) {
                                    // console.log('f1 push ', i)

                                }
                            } else {
                                // console.log('f2 push ', i)

                            }
                            f[i] = (orders[i]);

                            p++;
                            if (p == thelength) {
                                // console.log('here...', p, thelength)
                                return res.json(f);
                                // 0;
                            }
                        })
                    } else {
                        f[i] = (orders[i]);


                        p++;
                    }
                    if (p == thelength) {
                        // console.log('here2...')

                        return res.json(f);
                        // 0;
                    }
                })
                // console.log('orders.length', orders.length)


            });

        }).populate('customer', '_id phoneNumber firstName lastName').populate('agent', '_id nickname username').skip(offset).sort({
            createdAt: -1,

            updatedAt: -1,
            _id: -1,

        }).limit(parseInt(req.params.limit)).lean();
    },
    all: function (req, res, next) {
        console.log("all orders...")
        let Order = req.mongoose.model('Order');

        let offset = 0;
        if (req.params.offset) {
            offset = parseInt(req.params.offset);
        }

        let search = {};

        if (req.query['customer']) {
            search['customer'] = req.query['customer'];
        }

        if (req.query['firstName']) {
            search['customer_data.firstName'] = {
                $exists: true,
                '$regex': req.query['firstName'],
                '$options': 'i',
            };
        }

        if (req.query['lastName']) {
            search['customer_data.lastName'] = {
                $exists: true,
                '$regex': req.query['lastName'],
                '$options': 'i',
            };
        }

        if (req.query['paymentStatus']) {
            search['paymentStatus'] = req.query['paymentStatus'];
        }

        if (req.query['date_gte']) {
            search['createdAt'] = {$gt: new Date(req.query['date_gte'])};
        }

        if (req.query['date_lte']) {
            search['createdAt']['$lt'] = new Date(req.query['date_lte']);
        }

        search['status'] = {$nin: ['cart', 'checkout', 'trash', '']};

        if (req.query['status'] && req.query['status'] != 'all') {
            if (!search['status']) {
                search['status'] = {};
            }
            search['status']['$in'] = req.query['status'];
        }

        if (req.query['search']) {
            search['orderNumber'] = parseInt(req.query['search']);
            delete search['status'];
        }

        if (req.query['orderNumber']) {
            search['orderNumber'] = req.query['orderNumber'];
        }

        if (req.headers.role == 'agent') {
            search['agent'] = req.headers._id;
        }

        console.log('search', search);

        Order.find(search, '_id , orderNumber , agent , customer_data , source , customer , sum , amount , paymentStatus , status , createdAt , updatedAt , card', function (err, orders) {
            if (err || !orders) {
                console.log('err', err);
                res.json([]);
                return 0;
            }

            let thelength = orders.length, p = 0;
            let f = [];

            Order.countDocuments(search, function (err, count) {
                if (err || !count) {
                    res.json([]);
                    return 0;
                }

                res.setHeader('X-Total-Count', count);

                // Loop through each order to check the conditions
                _.forEach(orders, (item, i) => {
                    // Add notEditable property based on status and statusArray
                    if (req.headers.role == 'agent') {
                        if (item?.agent?._id) {
                            console.log("status", item.status, "item.agent", item.agent, "item.statusArray", item.statusArray)

                            if (item?.status === 'processing' && (item.statusArray?.length === 0 || !item.statusArray)) {
                                item.editable = false;
                            } else {
                                item.editable = true;
                            }
                        }
                    }
                    if (req.headers.role == 'admin') {
                        item.editable = true;

                    }
                    f[i] = item;

                    p++;
                    if (p === thelength) {
                        return res.json(f);
                    }
                });
            });
        }).populate('customer', '_id phoneNumber firstName lastName').populate('agent', '_id nickname username').skip(offset).sort({
            createdAt: -1,
            updatedAt: -1,
            _id: -1,
        }).limit(parseInt(req.params.limit)).lean();
    },

    createByCustomer: function (req, res, next) {
        let Settings = req.mongoose.model('Settings');
        let Customer = req.mongoose.model('Customer');
        //if guest mode enabled
        Settings.findOne({}, 'guestMode', async (err, setting) => {
            if (!setting) {
                return res.json({
                    success: false,
                    message: 'setting not found!'
                })
            }
            console.log('setting guestMode: ', setting.guestMode)

            //if guest mode true: continue
            //if false, check for loggedin customer, if was not logged in, return error
            if (!setting.guestMode) {

                try {
                    // Assuming you have a function to find the customer asynchronously
                    const customer = await Customer.findOne({ "tokens.token": req.headers.token });

                    if (!customer) {

                        return res.json({
                            success: false,
                            message: 'customer not found!'
                        });
                    }
                    req.headers.customer=customer
                    if (!req.headers.token) {
                        return res.json({
                            success: false,
                            message: 'customer not found!'
                        });
                    }

                    // Continue with the rest of your code after the customer check
                } catch (error) {
                    console.error("Error finding customer:", error);
                    return res.status(500).json({
                        success: false,
                        message: 'Internal server error'
                    });
                }
            }
            console.log("createByCustomer...")
            let Product = req.mongoose.model('Product');
            let Order = req.mongoose.model('Order');
            let action = {}
            if (req.headers?.customer?._id) {
                action = {
                    customer: req.headers?.customer?._id,
                    title: 'create order ' + req.body.amount,
                    data: req.body,
                };
            }
            var _ids = [], len = 0, ii = 0;
            if (req.body.card && req.body.card.length)
                len = req.body.card.length;
            _.forEach(req.body.card, function (pack) {
                var main_id = pack._id.split('DDD');
                var id = main_id[0];
                console.log(' id: ', id)
                if (!id) {
                    id = pack._id;
                }
                let tempProducts = [];
                Product.findOne({_id: id}, '_id combinations type price salePrice title quantity in_stock', function (err, ps) {
                    if (!ps) {
                        return res.json({
                            success: false,
                            message: 'product not found!'
                        })
                    }
                    ii++;
                    if (ps.type != 'normal') {
                        if (ps.combinations) {
                            _.forEach(ps.combinations, function (comb, inde) {
                                if ((inde == main_id[1]) || (comb.id == main_id[1])) {
                                    // console.log('find comb', comb);
                                    if (pack.salePrice) {
                                        if (pack.salePrice != comb.salePrice) {
                                            return res.json({
                                                success: false,
                                                message: 'مغایرت در قیمت ها!',
                                                'pack.salePrice': pack.salePrice,
                                                'comb.salePrice': comb.salePrice,
                                                'ps.type': ps.type,
                                                'ps.title': ps.title,
                                                'err': 1,
                                            });
                                            // return 0;

                                        }
                                    } else if (pack.price) {
                                        if (pack.price != comb.price) {
                                            return res.json({
                                                success: false,
                                                message: 'مغایرت در قیمت ها!',
                                                'pack.price': pack.price,
                                                'comb.price': comb.price,
                                                'ps.type': ps.type,
                                                'ps.title': ps.title,
                                                'err': 2,

                                            });
                                            // return 0;

                                        }
                                    }

                                    if (ps.combinations[inde].quantity == 0) {
                                        ps.combinations[inde].in_stock = false;
                                        comb.in_stock = false

                                    }
                                    console.log('pack', pack)
                                    // console.log('comb', comb)
                                    console.log('ps quantity', ps.combinations[inde])
                                    if (pack.count > ps.combinations[inde].quantity) {
                                        return res.json({
                                            success: false,
                                            message: 'مغایرت در تعداد محصول!',
                                            'comb.in_stock': comb.in_stock,
                                            'ps.type': ps.type,
                                            'ps.title': ps.title,
                                        });
                                    }
                                    if (ps.combinations[inde].quantity) {
                                        ps.combinations[inde].quantity--;
                                    }
                                    if (comb.in_stock == false) {
                                        return res.json({
                                            success: false,
                                            message: 'مغایرت در موجودی!',
                                            'comb.in_stock': comb.in_stock,
                                            'ps.type': ps.type,
                                            'ps.title': ps.title,
                                        });
                                        // return 0;
                                    }
                                }
                            });
                        }
                    }
                    if (ps.type == 'normal') {
                        if (pack.salePrice) {
                            if (pack.salePrice != ps.salePrice) {
                                return res.json({
                                    success: false,
                                    message: 'مغایرت در قیمت ها!',
                                    'pack.salePrice': pack.salePrice,
                                    'ps.salePrice': ps.salePrice,
                                    'ps.type': ps.type,
                                    'ps.title': ps.title,


                                });
                                // return 0;

                            }
                        }
                        else if (pack.price)
                            if (pack.price != ps.price) {
                                return res.json({
                                    success: false,
                                    message: 'مغایرت در قیمت ها!',
                                    'pack.price': pack.price,
                                    'ps.price': ps.price,
                                    'ps.type': ps.type,
                                    'ps.title': ps.title,

                                });
                                // return 0;

                            }


                        if (ps.quantity == 0) {
                            ps.in_stock = false;
                        }
                        console.log('pack', pack)
                        // console.log('comb', comb)
                        console.log('ps quantity', ps)
                        if (ps.quantity) {
                            if (pack.count > ps.quantity) {
                                return res.json({
                                    success: false,
                                    message: 'مغایرت در تعداد محصول!',
                                    'in_stock': ps.in_stock,
                                    'type': ps.type,
                                    'title': ps.title,

                                });
                            }
                            ps.quantity--;

                        }


                        if (ps.in_stock == false) {
                            return res.json({
                                success: false,
                                message: 'مغایرت در موجودی!',
                                'ps.in_stock': ps.in_stock,
                                'ps.type': ps.type,
                                'ps.title': ps.title,

                            });
                            // return 0;
                        }
                    }

                    // }

                    // console.log('ii', ii);
                    // console.log('len', len);
                    // console.log(' pspspspsps ', ps)
                    tempProducts.push(ps);
                    req.body.orderNumber = Math.floor(10000 + Math.random() * 90000);
                    // return;
                    req.body.customer = req.headers._id;

                    if (ii == len) {
                        // console.log('\ntempProducts: ', tempProducts)
                        req.global.checkSiteStatus().then(function (resp) {
                            // console.log('resp', resp);
                            Settings.findOne({}, 'tax taxAmount sms_submitOrderNotPaying', function (err, setting) {
                                let tax = setting.tax || false;
                                let taxAmount = setting.taxAmount || 0;
                                // console.log('setting.taxAmount', setting.taxAmount)
                                // if (setting.taxAmount)
                                //     taxAmount = setting.taxAmount;

                                if (taxAmount) {
                                    let theTaxAmount = parseInt(req.body.sum * (taxAmount / 100));
                                    req.body.amount = theTaxAmount + req.body.sum;
                                    req.body.taxAmount = taxAmount;
                                    // req.body.amount=taxAmount+req.body.amount;
                                }
                                if (req.body.deliveryPrice) {
                                    let deliveryPrice = parseInt(req.body.deliveryPrice);
                                    req.body.amount = deliveryPrice + req.body.amount;
                                    // req.body.taxAmount = taxAmount;
                                    // req.body.amount=taxAmount+req.body.amount;
                                }
                                // console.log('req.body.customer', req.body.customer)
                                let lastObject = {
                                    "billingAddress": req.body.billingAddress,
                                    "amount": req.body.amount,
                                    "card": req.body.card,
                                    "customer": req?.body?.customer,
                                    "customer_data": req.body.customer_data,
                                    "discount": req.body.discount,
                                    "discountAmount": req.body.discountAmount,
                                    "discountCode": req.body.discountCode,
                                    "deliveryDay": req.body.deliveryDay,
                                    "deliveryPrice": req.body.deliveryPrice,
                                    "status": 'processing',
                                    "package": req.body.package,
                                    "total": req.body.discount ? (req.body.amount - req.body.discount) : req.body.amount,
                                    "sum": req.body.sum,
                                    "ship": req.body.ship || false,
                                    "shipAmount": req.body.shipAmount || 0,
                                    "tax": setting.tax || false,
                                    "taxAmount": req.body.taxAmount || 0,
                                    "extraFields": req.body.extraFields || {},
                                    "productsAfterThisOrder": tempProducts
                                }
// console.
                                if (req.body.discountCode) {
                                    let Discount = req.mongoose.model('Discount');
                                    Discount.findOne({slug: req.body.discountCode},
                                        function (err, discount) {
                                            if (err || !discount) {
                                                return res.json({
                                                    success: false,
                                                    err: err,
                                                    message: 'did not find any discount!'
                                                });

                                            }
                                            if (discount.count < 1) {
                                                return res.json({
                                                    success: false,
                                                    message: 'discount is done!'
                                                });
                                            }
                                            if (!discount.customer) {
                                                discount.customer = [];
                                            }

                                            if (discount.customer && discount.customer.length > 0) {

                                                var isInArray = discount.customer.some(function (cus) {
                                                    return cus.equals(req.headers._id);
                                                });
                                                // || discount.customerLimit !== 0
                                                if (isInArray) {

                                                    // console.log('found it', req.headers._id)
                                                    // if (!discount.customerLimit || discount.customerLimit !== 0)
                                                    if (discount.customerLimit)
                                                        return res.json({
                                                            success: false,
                                                            message: 'you have used this discount once!'
                                                        });
                                                    continueDiscount();

                                                } else {
                                                    continueDiscount();
                                                }

                                            } else {
                                                continueDiscount();
                                            }

                                            function continueDiscount() {

                                                discount.customer.push(req.headers._id);
                                                // console.log('req.body.amount', req.body.amount)
                                                let theDiscount = 0;
                                                // return res.json(order);
                                                if (discount.price) {
                                                    theDiscount = discount.price;

                                                }
                                                if (discount.percent) {
                                                    let x = (req.body.sum * discount.percent) / 100
                                                    theDiscount = parseInt(x);

                                                }
                                                if (theDiscount < 0) {
                                                    theDiscount = 0;
                                                }
                                                Discount.findOneAndUpdate({slug: req.body.discountCode}, {
                                                        $set: {
                                                            count: (discount.count - 1),
                                                            customer: discount.customer,
                                                            order: req.body.order_id || null

                                                        }
                                                    },
                                                    function (err, discount) {
                                                        if (err || !discount) {
                                                            return res.json({
                                                                success: false,
                                                                message: 'could not update discount!'
                                                            });
                                                        }
                                                        lastObject['discountAmount'] = theDiscount;
                                                        // console.log('req.body.amount', req.body.amount)
                                                        // console.log('theDiscount', theDiscount)
                                                        req.body.amount = req.body.amount - theDiscount;
                                                        // console.log('req.body.amount', req.body.amount)
                                                        lastObject['amount'] = req.body.amount
                                                        update_order();
                                                    });


                                            }
                                        });
                                } else {
                                    update_order();
                                }

                                function update_order() {
                                    if (req.body.order_id) {
                                        // console.log('==> create order 1...', req.body.order_id);

                                        Order.findOneAndUpdate(
                                            {order_id: req.body.order_id}, {
                                                $set: {...lastObject, updatedAt: new Date()},
                                                $push: {
                                                    statusArray: {status: 'processing'},
                                                },
                                            }, function (err, order) {
                                                if (err || !order) {
                                                    // console.log('err', err);
                                                    Order.create({
                                                        ...lastObject,
                                                        order_id: req.body.order_id,
                                                        status: 'processing',
                                                        orderNumber: req.body.orderNumber,

                                                    }, function (err, order) {
                                                        if (err || !order) {
                                                            return res.json({
                                                                err: err,
                                                                success: false,
                                                                message: 'error!',
                                                            });
                                                        }
                                                        if (req.headers?.customer && req.headers?.token) {
                                                            let action = {
                                                                customer: req.headers.customer._id,
                                                                title: 'create order successfully ' + order._id,
                                                                data: req.body,
                                                                history: req.body,
                                                                order: order._id,
                                                            };
                                                            // req.global.submitAction(action);
                                                        }
                                                        console.log('creating order2 successfully:', order);
                                                        change_products_quantities();
                                                        req.fireEvent('create-order-by-customer', order);
                                                        res.json({success: true, order: order});

                                                    });
                                                    // res.json({
                                                    //     // obj: {
                                                    //     //     amount: req.body.amount,
                                                    //     //     // card: req.body.card
                                                    //     // },
                                                    //     hrer:'jhjk',
                                                    //     err: err,
                                                    //     order: order,
                                                    //     success: false,
                                                    //     message: 'error!'
                                                    // });
                                                    // return 0;
                                                } else {
                                                    // if (req.headers.customer && req.headers.token) {
                                                    //     let action = {
                                                    //         customer: req.headers.customer._id,
                                                    //         title: 'create order successfully ' + order._id,
                                                    //         data: req.body,
                                                    //         history: req.body,
                                                    //         order: order._id
                                                    //     };
                                                    //     req.global.submitAction(action);
                                                    // }
                                                    console.log('creating order1 successfully:', order);
                                                    change_products_quantities();
                                                    req.fireEvent('create-order-by-customer', order);

                                                    res.json({success: true, order: order});
                                                }

                                            });
                                    } else {
                                        // console.log('create order 2... line 240');
                                        Order.create({
                                            billingAddress: req.body.billingAddress,
                                            amount: req.body.amount,
                                            card: req.body.card,
                                            customer: req.body.customer,
                                            customer_data: req.body.customer_data,
                                            deliveryDay: req.body.deliveryDay,
                                            deliveryPrice: req.body.deliveryPrice,
                                            order_id: crypto.randomBytes(64).toString('hex'),
                                            package: req.body.package,
                                            total: req.body.total,
                                            orderNumber: req.body.orderNumber,
                                            sum: req.body.sum,
                                            ...lastObject
                                        }, function (err, order) {
                                            if (err || !order) {
                                                res.json({
                                                    err: err,
                                                    success: false,
                                                    message: 'error!',
                                                });
                                                return 0;
                                            }
                                            if (req.headers.customer && req.headers.token) {
                                                let action = {
                                                    customer: req.headers.customer._id,
                                                    title: 'create order successfully ' + order._id,
                                                    data: req.body,
                                                    history: req.body,
                                                    order: order._id,
                                                };
                                                // req.global.submitAction(action);
                                            }
                                            // console.log('creating order successfully:', order);
                                            change_products_quantities();
                                            req.fireEvent('create-order-by-customer', order);
                                            res.json({success: true, order: order});
                                            // return 0;

                                        });
                                    }
                                }

                                function change_products_quantities() {


                                    console.log('****** change_products_quantities ******')
                                    // _.forEach(tempProducts, function (tempProduct) {
                                    //     console.log('\ntempProduct',{
                                    //         in_stock:tempProduct.in_stock,
                                    //         quantity:tempProduct.quantity,
                                    //         combinations:tempProduct.combinations,
                                    //     })
                                    //
                                    //     Product.findByIdAndUpdate(tempProduct._id,{
                                    //         $set:{
                                    //             in_stock:tempProduct.in_stock,
                                    //             quantity:tempProduct.quantity,
                                    //             combinations:tempProduct.combinations,
                                    //         }
                                    //     },function(err,resp){
                                    //         console.log('resp',resp._id)
                                    //     })
                                    // })

                                }
                            })


                        }).catch(function (err2) {
                            res.json({
                                success: false,
                                message: 'site is deactive!',
                            });
                            return 0;
                        });
                    }
                });
            });

        })


    },
    create: function (req, res, next) {
        console.log('creating order...');
        let Product = req.mongoose.model('Product');
        let Order = req.mongoose.model('Order');

        // if (req.headers.user && req.headers.token) {
        //     let action = {
        //         user: req.headers.user._id,
        //         title: 'create order ' + order._id,
        //         data: order,
        //         // history:req.body,
        //         order: order._id
        //     };
        //     req.global.submitAction(action);
        // }
        // if (req.headers.customer && req.headers.token) {
        //     let action = {
        //         customer: req.headers.customer._id,
        //         title: 'create order ' + req.body.amount,
        //         data: req.body,
        //         // history:req.body,
        //         // order: order._id
        //     };
        //     // req.global.submitAction(action);
        // }
        var _ids = [], len = 0, ii = 0;
        if (req.body.card && req.body.card.length)
            len = req.body.card.length;
        _.forEach(req.body.card, function (pack) {
            var main_id = pack._id.split('DDD');
            var id = main_id[0];
            if (!id) {
                id = pack._id;
            }

            // console.log('_id', id, pack.price, pack.salePrice);
            // _ids.push(id);
            // console.log('find _id:', id);
            Product.findOne({_id: id}, '_id combinations type price salePrice title', function (err, ps) {
                // console.log('found id:', id, 'main_id[1]:', main_id[1], 'ps', ps);
                ii++;
                if (ps.type != 'normal') {
                    if (ps.combinations) {
                        _.forEach(ps.combinations, function (comb, inde) {
                            if ((inde == main_id[1]) || (comb.id == main_id[1])) {
                                // console.log('find comb', comb);
                                if (pack.salePrice) {
                                    if (pack.salePrice != comb.salePrice) {
                                        return res.json({
                                            success: false,
                                            message: 'مغایرت در قیمت ها!',
                                            'pack.salePrice': pack.salePrice,
                                            'comb.salePrice': comb.salePrice,
                                            'ps.type': ps.type,
                                            'ps.title': ps.title,
                                            'err': 1,
                                        });
                                        // return 0;

                                    }
                                } else if (pack.price) {
                                    if (pack.price != comb.price) {
                                        return res.json({
                                            success: false,
                                            message: 'مغایرت در قیمت ها!',
                                            'pack.price': pack.price,
                                            'comb.price': comb.price,
                                            'ps.type': ps.type,
                                            'ps.title': ps.title,
                                            'err': 2,

                                        });
                                        // return 0;

                                    }
                                }
                                if (ps.combinations[inde].quantity == 0) {
                                    ps.combinations[inde].in_stock = false;
                                    comb.in_stock = false

                                }
                                if (ps.combinations[inde].quantity) {
                                    ps.combinations[inde].quantity--;
                                }
                                if (comb.in_stock == false) {
                                    return res.json({
                                        success: false,
                                        message: 'مغایرت در موجودی!',
                                        'comb.in_stock': comb.in_stock,
                                        'ps.type': ps.type,
                                        'ps.title': ps.title,

                                    });
                                    // return 0;
                                }
                            }
                        });
                    }
                }
                if (ps.type == 'normal') {
                    if (pack.salePrice) {
                        if (pack.salePrice != ps.salePrice) {
                            return res.json({
                                success: false,
                                message: 'مغایرت در قیمت ها!',
                                'pack.salePrice': pack.salePrice,
                                'ps.salePrice': ps.salePrice,
                                'ps.type': ps.type,
                                'ps.title': ps.title,


                            });
                            // return 0;

                        }
                    }
                    else if (pack.price)
                        if (pack.price != ps.price) {
                            return res.json({
                                success: false,
                                message: 'مغایرت در قیمت ها!',
                                'pack.price': pack.price,
                                'ps.price': ps.price,
                                'ps.type': ps.type,
                                'ps.title': ps.title,

                            });
                            // return 0;

                        }

                    if (ps.quantity == 0) {
                        ps.in_stock = false;
                    }

                    if (ps.quantity) {
                        ps.quantity--;
                    }
                    if (ps.in_stock == false) {
                        return res.json({
                            success: false,
                            message: 'مغایرت در موجودی!',
                            'ps.in_stock': ps.in_stock,
                            'ps.type': ps.type,
                            'ps.title': ps.title,

                        });
                        // return 0;
                    }
                }

                // console.log('ii', ii);
                // console.log('len', len);
                req.body.orderNumber = Math.floor(10000 + Math.random() * 90000);
                // return;
                if (ii == len)
                    req.global.checkSiteStatus().then(function (resp) {
                        // console.log('resp', resp);

                        req.body.customer = req.headers.customer_id;
                        if (req.body.order_id) {
                            // console.log('create order 1 line 847 ...', req.body.order_id);

                            Order.findOneAndUpdate({_id: req.body.order_id}, {
                                $set: {
                                    billingAddress: req.body.billingAddress,
                                    amount: req.body.amount,
                                    card: req.body.card,
                                    customer: req.body.customer,
                                    customer_data: req.body.customer_data,
                                    deliveryDay: req.body.deliveryDay,
                                    deliveryPrice: req.body.deliveryPrice,
                                    order_id: req.body.order_id,
                                    status: 'processing',
                                    package: req.body.package,
                                    total: req.body.total,
                                    sum: req.body.sum,
                                },
                                $push: {
                                    statusArray: {status: 'processing'},
                                },
                            }, function (err, order) {
                                if (err || !order) {
                                    Order.create({
                                        billingAddress: req.body.billingAddress,
                                        amount: req.body.amount,
                                        card: req.body.card,
                                        customer: req.body.customer,
                                        customer_data: req.body.customer_data,
                                        deliveryDay: req.body.deliveryDay,
                                        deliveryPrice: req.body.deliveryPrice,
                                        order_id: req.body.order_id,
                                        package: req.body.package,
                                        status: 'processing',
                                        total: req.body.total,
                                        orderNumber: req.body.orderNumber,
                                        sum: req.body.sum,
                                    }, function (err, order) {
                                        if (err || !order) {
                                            return res.json({
                                                err: err,
                                                success: false,
                                                message: 'error!',
                                            });
                                        }
                                        req.fireEvent('create-order-by-customer', order);
                                        return res.json({success: true, order: order});

                                    });

                                } else {
                                    // console.log('creating order successfully:', order);
                                    return res.json({success: true, order: order});
                                }

                            });
                        } else {
                            // console.log('create order 2... line 524');
                            Order.create({
                                billingAddress: req.body.billingAddress,
                                amount: req.body.amount,
                                card: req.body.card,
                                customer: req.body.customer,
                                customer_data: req.body.customer_data,
                                deliveryDay: req.body.deliveryDay,
                                deliveryPrice: req.body.deliveryPrice,
                                // order_id: req.body.order_id,
                                package: req.body.package,
                                total: req.body.total,
                                orderNumber: req.body.orderNumber,
                                sum: req.body.sum,
                            }, function (err, order) {
                                if (err || !order) {
                                    res.json({
                                        err: err,
                                        success: false,
                                        message: 'error!',
                                    });
                                    return 0;
                                }
                                // console.log('creating order successfully:', order);
                                res.json({success: true, order: order});
                                return 0;

                            });
                        }


                    }).catch(function (err2) {
                        res.json({
                            success: false,
                            message: 'site is deactive!',
                        });
                        return 0;
                    });
            });
        });
    },
    createAdmin: async function (req, res, next) {
        try {
            const Customer = req.mongoose.model('Customer');
            const Order = req.mongoose.model('Order');
            const Settings = req.mongoose.model('Settings');

            console.log('Creating order by admin...', req.headers);

            // Generate order number and unique order ID
            const orderNumber = Math.floor(10000 + Math.random() * 90000);
            const orderId = crypto.randomBytes(64).toString('hex');

            // Initialize order object
            let orderData = {
                order_id: orderId,
                orderNumber,
                status: req.body.status || 'checkout',
                amount: req.body.amount || 0,
                total: req.body.amount || 0,
                sum: req.body.amount || 0,
                package: []
            };

            // Assign agent/admin based on role
            if (req.headers.role === 'agent') {
                orderData.agent = req.headers._id;
                orderData.status = 'processing';
                orderData.paymentStatus = 'notpaid';
            } else if (req.headers.role === 'admin') {
                orderData.admin = req.headers._id;
            }

            // Process cart items if provided
            if (req.body?.card?.length) {
                orderData.card = req.body.card

                orderData.package = req.body.card.map((item) => ({
                    product_name: item.title?.fa,
                    product_id: item.product_id || item._id || "",
                    price: item.salePrice || item.price,
                    total_price: (item.salePrice || item.price) * item.count,
                    quantity: item.count
                }));

                // Calculate total amount
                orderData.amount = req.body.amount || _.sumBy(orderData.package, 'total_price');
            }

            // Validate customer
            if (!req.body.customer) {
                return res.status(400).json({success: false, message: 'Customer is required!'});
            }

            // Fetch customer data
            const customer = await Customer.findById(req.body.customer, 'firstName lastName countryCode internationalCode address phoneNumber');
            if (!customer) {
                return res.status(404).json({success: false, message: 'Customer not found!'});
            }

            // Assign customer details
            orderData.customer = req.body.customer;
            orderData.customer_data = customer;
            orderData.billingAddress = customer.address?.[0] || {};
            orderData.source = 'CRM';

            // Create order
            const order = await Order.create(orderData);
            if (!order) {
                return res.status(500).json({success: false, message: 'Failed to create order!'});
            }

            // Send SMS notification if applicable
            const setting = await Settings.findOne({}, 'sms_submitOrderFromAdmin');
            if (req.global?.sendSms && setting?.sms_submitOrderFromAdmin && order.customer_data?.phoneNumber) {
                // const paymentLink = `https://gateway.zibal.ir/start/${order.transaction?.pop()?.Authority}`;
                // , { payment_link: paymentLink }
                const newTxt = replaceValue({
                    text: setting.sms_submitOrderFromAdmin,
                    data: [order.toObject(), order.customer_data]
                });

                if (newTxt) {
                    req.global.sendSms(order.customer_data.phoneNumber, newTxt);
                }
            }
            req.fireEvent('create-order-by-admin', order);

            return res.json(order);
        } catch (err) {
            console.error('Error in createAdmin:', err);
            return res.status(500).json({success: false, message: 'Internal server error', error: err.message});
        }
    }
    ,
    createAdminOld: function (req, res, next) {
//...
        let Customer = req.mongoose.model('Customer');
        let Order = req.mongoose.model('Order');
        let Setting = req.mongoose.model('Setting');

        console.log('creating order by admin...', req.headers);
        req.body.orderNumber = Math.floor(10000 + Math.random() * 90000);
        let pack = [], amount = 0;
        let obj = {
            order_id: crypto.randomBytes(64).toString('hex'),
            amount: req.body.amount ? req.body.amount : amount,
            total: req.body.amount ? req.body.amount : amount,
            orderNumber: req.body.orderNumber,
            sum: req.body.amount ? req.body.amount : amount,
            status: req.body.status || 'checkout'
        }
        if (req.headers.role == 'agent') {
            obj['agent'] = req.headers._id
            obj['status'] = 'processing'
            obj['paymentStatus'] = 'notpaid'
        }
        if (req.headers.role == 'admin') {
            obj['admin'] = req.headers._id
        }
        if (req.body.card) {
            obj['card'] = req.body.card

            _.forEach(req.body.card, function (item, i) {
                amount += (item.salePrice || item.price) * item.count;
                pack.push({
                    product_name: item.title?.fa,
                    product_id: item.product_id ? item.product_id : item._id ? item._id : "",
                    price: (item.salePrice || item.price),
                    total_price: (item.salePrice || item.price) * item.count,
                    quantity: item.count,
                })
            })

            obj['package'] = pack
            obj['amount'] = req.body.amount ? req.body.amount : amount

        }
        if (req.body.customer) {
            Customer.findById(req.body.customer, '_id firstName lastName countryCode internationalCode address phoneNumber', function (err, customer) {
                if (err || !customer) {
                    res.json({
                        err: err,
                        success: false,
                        message: 'error!',
                    });
                    return 0;
                }
                obj['customer'] = req.body.customer;
                obj['customer_data'] = customer;
                obj['billingAddress'] = (customer.address && customer.address[0]) ? customer.address[0] : {};
                obj['source'] = 'CRM';
                Order.create(obj, async function (err, order) {
                    if (err || !order) {
                        res.json({
                            err: err,
                            success: false,
                            message: 'error!',
                        });
                        return 0;
                    }
                    const setting = await Setting.findOne({}, 'sms_submitOrderFromAdmin');
                    if (req.global?.sendSms && setting?.sms_submitOrderFromAdmin && order.customer_data?.phoneNumber) {
                        const newTxt = replaceValue({
                            text: setting?.sms_submitOrderFromAdmin,
                            data: [order.toObject(), order.customer_data, {payment_link: `https://gateway.zibal.ir/start/${order.transaction?.pop()?.Authority}`}]
                        });
                        // if(newTxt)
                        // req.global.sendSms(order.customer_data?.phoneNumber, newTxt);
                    }
                    return res.json(order)

                })
            });
        } else {
            res.json({
                success: false,
                message: 'customer is necessary!',
            });
            return 0;
            // Order.create(obj, function (err, order) {
            //     if (err || !order) {
            //         res.json({
            //             err: err,
            //             success: false,
            //             message: 'error!',
            //         });
            //         return 0;
            //     }
            //     return res.json(order)
            //
            // });
        }
    },
    allWOrders: function (req, res, next) {
        let Order = req.mongoose.model('Order');

        // console.log('allWOrders');
        let offset = 0;
        if (req.params.offset) {
            offset = parseInt(req.params.offset);
        }

        let search = {};
        search['customer'] = req.headers._id;
        // search['status']='published';
        // console.log('search', search)
        Order.find(search, '_id updatedAt createdAt card sum amount deliveryPrice orderNumber status paymentStatus deliveryDay customer_data billingAddress transaction', function (err, orders) {
            if (err || !orders) {
                res.json([]);
                return 0;
            }

            Order.countDocuments(search, function (err, count) {
                // console.log('countDocuments', count);
                if (err || !count) {
                    res.json([]);
                    return 0;
                }
                res.setHeader(
                    'X-Total-Count',
                    count,
                );


                // orders.map(resource => ({ ...resource, id: resource._id }))
                res.json(orders);
                return 0;


            });

        }).populate('customer', 'nickname photos address').skip(offset).sort({_id: -1}).limit(parseInt(req.params.limit)).lean();
    },

    myOrder: function (req, res, next) {
        let Order = req.mongoose.model('Order');

        // console.log('hgfgh');
        let obj = {
            _id: req.params.id,
            customer: req.headers._id.toString(),
        }
        console.log('obj', obj)
        Order.findOne(obj,
            function (err, order) {
                if (err || !order) {
                    res.json({
                        success: false,
                        message: 'error!',
                    });
                    return 0;
                }

                return res.json(order);

            }).populate('customer', 'nickname phoneNumber firstName lastName').populate('transaction', 'Authority amount statusCode status');
    },
    downloadInvoice: async function (req, res, next) {
        const Order = req.mongoose.model('Order');
        const orderId = req.params.id;
        const customerId = req.headers._id.toString();
        const Settings = req.mongoose.model('Settings');

        try {
            const order = await Order.findOne({_id: orderId, customer: customerId})
                .populate('customer', 'firstName lastName phoneNumber address')
                .exec();
            const shopData = await Settings.findOne({}, 'factore_shop_name factore_shop_site_name factore_shop_address factore_shop_phoneNumber factore_shop_faxNumber factore_shop_postalCode factore_shop_submitCode factore_shop_internationalCode')
            console.log("shopData: ", shopData)
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found!',
                });
            }
            const mmm = (d, f = 'YYYY/MM/DD HH:mm') => {
                return d ? moment(d).locale('fa').format(f) : '';
            };

            // Generate the HTML content for the PDF
            const html = `
            <html>
                <head>
                    <title>Order Invoice</title>
                    <style>
                        @font-face {
                            font-family: IRANSans;
                            src: url(process.env.BASE_URL + "/static/meida/"+IRANSansWeb_font_eot);
                            src: url(process.env.BASE_URL + "/static/meida/"+IRANSansWeb_font_eot + "?#iefix") format("embedded-opentype"),
                                 url(process.env.BASE_URL + "/static/meida/"+IRANSansWeb_font_woff2) format("woff2"),
                                 url(process.env.BASE_URL + "/static/meida/"+IRANSansWeb_font_woff) format("woff"),
                                 url(process.env.BASE_URL + "/static/meida/"+IRANSansWeb_font_ttf) format("truetype");
                        }
                        body {
                            padding: 10px;
                            font-family: IRANSans;
                            direction: rtl;
                            line-height: 20px;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                        }
                        th, td {
                            border: 1px solid black;
                            padding: 5px;
                            text-align: center;
                        }
                        td div{
                            text-align: right;
                        }
                        .seller-spans span{
                            margin: 0 5px;
                        }
                        .shop-info{
                            border: none;
                        }
                        .shop-info div{
                            text-align: center;
                        }
                        .customer-spans span{
                            margin-left: 45px;
                            margin-right: 5px;
                        }
                        .seller-spans, .customer-spans{
                            text-align: right;
                        }
                        .footerr td{
                            text-align: right;
                        }
                        .shop-name h3 {
                            margin: 0;
                        }
                        .shop-name{
                            text-align: center;
                            width: 100%;
                        }
                        .textAlignR {
                            text-align: right;
                        }
                        @media print {
                            .no-print {
                                display: none;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div id="theprint">
                        <div class="no-print" id="now-print-1">print</div>
                        <table class="head container">
                            <tbody>
                                <tr>
                                    <td class="shop-info">
                                        <div class="shop-name">
                                            <h3>فاکتور فروش</h3>
                                        </div>
                                        <h1 class="document-type-label">${shopData.factore_shop_name}</h1>
                                    </td>
                                    <td class="shop-info">
                                        <div>
                                            <span>شماره فاکتور:</span>
                                            <span>${order.orderNumber}</span>
                                        </div>
                                        <div class="invoice-date">
                                            <span>تاریخ:</span>
                                            <span>${mmm(order.createdAt)}</span>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <table class="order-data-addresses">
                            <tbody>
                                <tr>
                                    <td class="title-td">فروشنده</td>
                                    <td class="seller-spans">
                                        <span>نام شخص حقیقی / حقوقی: ${shopData.factore_shop_name}</span>
                                        <span>شماره اقتصادی: ${shopData.factore_shop_internationalCode}</span>
                                        <span>آدرس: ${shopData.factore_shop_address}</span><br/>
                                        <span>تلفن: ${shopData.factore_shop_phoneNumber}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="title-td">خریدار</td>
                                    <td class="customer-spans">
                                        <span>نام شخص حقیقی / حقوقی: ${order.customer?.firstName} ${order.customer.lastName}</span>
                                        <span>کد ملی: ${order.customer_data?.internationalCode}</span><br />
                                        <span>شماره تماس: ${order.customer?.phoneNumber}</span>
                                        <span>کد پستی: ${order.customer_data?.address?.map(addr => addr.PostalCode).join(', ')}</span><br/>
                                        <span>نشانی: ${order.customer_data?.address?.map(addr => addr.StreetAddress).join(', ')}</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <table class="order-details">
                            <thead>
                                <tr>
                                    <th>ردیف</th>
                                    <th>کد کالا</th>
                                    <th>شرح کالا یا خدمات</th>
                                    <th>تعداد</th>
                                    <th>مبلغ واحد</th>
                                    <th>مبلغ تخفیف</th>
                                    <th>مبلغ کل</th>
                                    <th>جمع مالیات و عوارض</th>
                                    <th>جمع کل</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${order.card?.map((item, index) => `
                                    <tr>
                                        <td class="title-td">${index + 1}</td>
                                        <td>${item?.sku || ''}</td>
                                        <td>${item?.title.fa}</td>
                                        <td>${item?.count}</td>
                                        <td>${item?.price}</td>
                                        <td>${item?.discount || 0}</td>
                                        <td>${item.totalPrice || item.price * item.count}</td>
                                        <td>${item?.tax || 0}</td>
                                        <td>${item.totalWithTax || (item.totalPrice || item.price * item.count) + (item.tax || 0)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        <table>
                            <tbody class="footerr">
                                <tr>
                                    <td>
                                        <span>روش ارسال: ${order.deliveryDay?.title}</span><br/>
                                        <span>روش پرداخت: در گاه آنلاین</span>
                                    </td>
                                    <td>
                                        <span>جمع کل: ${order?.sum}</span><br/>
                                        <span>تخفیف: ${order?.discount || 0}</span><br/>
                                        <span>قابل پرداخت: ${order?.amountDue || order.sum - (order.discount || 0)}</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </body>
            </html>
        `;
            // Define file path in the "order" folder
            const invoicesDir = path.join('./public_media', 'invoices');

            // Create the invoices directory if it doesn't exist
            if (!fs.existsSync(invoicesDir)) {
                fs.mkdirSync(invoicesDir, {recursive: true});
            }

            // Define file path for the PDF in the "invoices" folder
            const filename = `Invoice-${order._id}.pdf`;
            const filePath = path.join(invoicesDir, filename);
            const pdfOptions = {
                format: 'A4', // Set the format to 'A4', 'A3', 'Letter', etc.
                orientation: 'portrait', // You can also set 'landscape' if needed
                border: {
                    top: "1in",       // Set custom borders if needed
                    right: "1in",
                    bottom: "1in",
                    left: "1in"
                }
            };
            // Create a PDF document and save it to the filePath
            pdf.create(html, pdfOptions).toFile(filePath, (err, result) => {
                if (err) {
                    console.error('PDF creation error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error creating PDF!',
                    });
                }
                // Construct the download URL dynamically
                const downloadUrl = `${process.env.BASE_URL}/invoices/${filename}`;
                // Return the download link or path once the PDF is generated
                res.json({
                    success: true,
                    order: order,
                    fileUrl: downloadUrl,
                });
            });
        } catch (error) {
            console.error('Error retrieving order:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving order!',
            });
        }
    },
    createPaymentLink: function (req, res, next) {
        console.log('creating transaction by admin...');
        // req.body.orderNumber = Math.floor(10000 + Math.random() * 90000);

        let Order = req.mongoose.model('Order');
        let Product = req.mongoose.model('Product');
        let Transaction = req.mongoose.model('Transaction');
        let Gateway = req.mongoose.model('Gateway');
        let Settings = req.mongoose.model('Settings');

        // console.log("buy...", req.params._id, req.body.amount);
        if (req.body.amount && (req.body.amount == null || req.body.amount == "null"))
            return res.json({
                success: false,
                message: "req.body.amount"
            });
        if (req.body.method)
            Gateway.findOne({slug: req.body.method}, function (err, gateway) {
                if (!gateway || !gateway.request) {
                    return res.json({
                        success: false,
                        slug: req.body.method,
                        // gateway: gateway,
                        message: "gateway request not found"
                    })
                }
                req.body.orderNumber = Math.floor(10000 + Math.random() * 90000);

                let obj = {
                    order_id: crypto.randomBytes(64).toString('hex'),
                    amount: req.body.amount ? req.body.amount : amount,
                    total: req.body.amount ? req.body.amount : amount,
                    orderNumber: req.body.orderNumber,
                    sum: req.body.amount ? req.body.amount : amount,
                    status: req.body.status || 'checkout'
                }
                Order.create(obj,
                    function (err, order) {
                        if (err || !order) {
                            res.json({
                                success: false,
                                message: "error!"
                            });
                            return 0;
                        }

                        // obj[]=;
// console.log(order.amount/);
//                 return;
                        let amount = parseInt(order.amount) * 10;
                        if (req.body.amount) {
                            amount = parseInt(req.body.amount) * 10;
                        }
                        if (order.discount) {
                            amount = amount - (order.discount * 10);
                        }
                        if (amount < 0) {
                            amount = 0;
                        }
                        let LIMIT = 1000000000
                        if (amount > LIMIT) {
                            return res.json({
                                success: false,
                                message: "price is more than 50,000,000T"
                            });
                        }
                        //check if we have method or not,
                        // for both we have to create transaction
                        //    if we have method, submit method too
                        // console.log('order.orderNumber', order.orderNumber)
                        gateway.request = gateway.request.replaceAll("%domain%", process.env.BASE_URL);


                        gateway.request = gateway.request.replaceAll("%amount%", order.amount);


                        gateway.request = gateway.request.split("%orderNumber%").join(order.orderNumber);
                        // gateway.request = gateway.request.replace("%orderNumber%", order.orderNumber);
                        gateway.request = gateway.request.replaceAll("%orderId%", order._id);
                        // console.log('gateway.request', gateway.request);
                        if (!JSON.parse(gateway.request))
                            return res.json({
                                success: false,
                                gateway: JSON.parse(gateway.request),
                                message: "gateway request not found"
                            })
                        // let sendrequest=
                        var theReq = JSON.parse(gateway.request);
                        // console.log('theReq[\'amount\']', theReq['data'])

                        if (theReq['data'] && theReq['data']['Amount'])
                            theReq['data']['Amount'] = stringMath(theReq['data']['Amount'].toString())

                        if (theReq['data'] && theReq['data']['amount'])
                            theReq['data']['amount'] = stringMath(theReq['data']['amount'].toString())

                        if (theReq['body'] && theReq['body']['Amount'])
                            theReq['body']['Amount'] = stringMath(theReq['body']['Amount'].toString())

                        if (theReq['body'] && theReq['body']['amount'])
                            theReq['body']['amount'] = stringMath(theReq['body']['amount'].toString())
                        // console.log('gateway.request', theReq)

                        // return;
                        req.httpRequest(theReq).then(function (parsedBody) {

                            let obj = {
                                "amount": amount,
                                "method": req.body.method,
                                "order": req.params._id,
                                "gatewayResponse": JSON.stringify(parsedBody["data"]),
                                "Authority": parsedBody["data"]["trackId"]
                            };
                            if (req.headers && req.headers.customer && req.headers.customer._id) {
                                obj["customer"] = req.headers.customer._id;
                            }
                            // return res.json({
                            //     ...obj, gateway: JSON.parse(gateway.request),
                            // });
                            Transaction.create(obj, function (err, transaction) {
                                if (err || !transaction) {
                                    return res.json({
                                        success: false,
                                        message: "transaction could not be created",
                                        err: err
                                    })
                                }
                                Order.findByIdAndUpdate(req.params._id, {
                                    $push: {
                                        transaction: transaction._id
                                    }
                                }, function (order_err, updated_order) {
                                    console.log('end of buy...');
                                    if (parsedBody['data'] && parsedBody['data']['url']) {
                                        return res.json({
                                            success: true,
                                            url: parsedBody['data']['url']
                                        });
                                    }
                                    if (parsedBody['data'] && parsedBody['data'].trackId) {

                                        return res.json({
                                            success: true,
                                            // data: parsedBody['data'],
                                            // request: JSON.parse(gateway.request),
                                            url: "https://gateway.zibal.ir/start/" + parsedBody['data'].trackId
                                        });
                                    } else {
                                        return res.json({
                                            success: false,
                                            // data: parsedBody['data'],
                                            // request: JSON.parse(gateway.request),
                                            parsedBody: parsedBody['data']
                                        });
                                    }
                                });
                            });

                        }).catch(e => {
                            console.log("error at 1276  at order controller")
                            res.json({e, requ: theReq})
                        })


                    });
            })
        else {
            return res.json({
                success: false,
                message: "you have no gateway"
            })
        }

    }
    ,
    createCart: function (req, res, next) {

        let obj = {};
        if (req.body.billingAddress) {
            obj['billingAddress'] = req.body.billingAddress;
        }
        if (req.body.amount || req.body.amount == 0) {
            obj['amount'] = req.body.amount;
        }
        if (req.body.card) {
            obj['card'] = req.body.card;
        }
        if (req.body.customer) {
            obj['customer'] = req.body.customer;
        }
        if (req.body.customer_data) {
            obj['customer_data'] = req.body.customer_data;
        }
        if (req.body.customer_data && req.body.customer_data._id) {
            obj['customer'] = req.body.customer_data._id;
        }
        if (req.body.deliveryDay) {
            obj['deliveryDay'] = req.body.deliveryDay;
        }
        if (req.body.deliveryPrice) {
            obj['deliveryPrice'] = req.body.deliveryPrice;
        }
        if (req.body.package) {
            obj['package'] = req.body.package;
        }
        if (req.body.totalWeight || req.body.totalWeight == 0) {
            obj['totalWeight'] = req.body.totalWeight;
        }
        if (req.body.total) {
            obj['total'] = req.body.total;
        }
        if (req.body.sum || req.body.sum == 0) {
            obj['sum'] = req.body.sum;
        }
        if (req.body.orderNumber) {
            obj['orderNumber'] = req.body.orderNumber;

        } else {
            obj['orderNumber'] = Math.floor(10000 + Math.random() * 90000);
        }
        let Order = req.mongoose.model('Order');
        let status = 'cart';

        if (req.body.status == 'checkout')
            status = 'checkout';
        // if(req.body.)
        obj['status'] = status;
        if (req.params.id) {
            Order.findByIdAndUpdate(req.params.id, {
                $set: obj,
                $push: {statusArray: {status: status}},
            }, {new: true}, function (err, order) {
                if (err || !order) {
                    res.json({
                        success: false,
                        message: 'error!',
                        err: err,
                    });
                    return 0;
                }
                //console.log('req.headers', req.headers);
                if (req.headers.customer && req.headers.token) {
                    let action = {
                        customer: req.headers.customer._id,
                        title: 'customer edit cart ' + order._id,
                        data: order,
                        history: req.body,
                        order: order._id,
                    };
                    // req.req.global.submitAction(action);
                }
                if (!req.headers.customer && !req.headers.token) {
                    let action = {
                        title: 'guest edit cart ' + order._id,
                        data: order,
                        history: req.body,
                        // order: order._id
                    };
                    // req.req.global.submitAction(action);
                }
                console.log("obj: ", obj)
                console.log("order: ", order)
                res.json(order);
                return 0;

            });
        } else {
            req.body.orderNumber = Math.floor(10000 + Math.random() * 90000);
            if (req.body.orderNumber) {
                obj['orderNumber'] = req.body.orderNumber;
            }
            // console.log('obj', obj)
            if (!obj.order_id) {
                obj.order_id = crypto.randomBytes(64).toString('hex');
            }
            Order.create(obj, function (err, order) {
                if (err || !order) {
                    res.json({
                        success: false,
                        message: 'error!',
                        err: err,
                    });
                    return 0;
                }
                //console.log('req.headers', req.headers);
                if (req.headers.customer && req.headers.token) {
                    let action = {
                        customer: req.headers.customer._id,
                        title: 'create cart ' + order._id,
                        data: order,
                        history: req.body,
                        order: order._id,
                    };
                    // req.req.global.submitAction(action);
                }
                if (!req.headers.customer && !req.headers.token) {
                    let action = {
                        // customer: req.headers.customer._id,
                        title: 'guest created cart ' + order._id,
                        data: order,
                        history: req.body,
                        // order: order._id
                    };
                    // req.req.global.submitAction(action);
                }
                res.json(order);
                return 0;

            });
        }
    },
    sendReq: function (req, theUrl, page) {
        page = parseInt(page)
        // console.log('get:', theUrl, 'page:', page)
        let url = theUrl;
        url += '&page=' + page;
        // console.log('theUrl:', url);
        req.httpRequest({
            method: "get",
            url: url,
        }).then(function (response) {
            // count++;
            // let x = count * parseInt(req.query.per_page)
            let Order = req.mongoose.model('Order');

            response.data.forEach((dat) => {
                let obj = {};
                if (dat.total) {
                    obj['amount'] = dat.total
                }
                // if (dat.description) {
                //     obj['description'] = {
                //         fa: dat.description
                //
                //     }
                // }

                if (dat.id) {
                    obj['orderNumber'] = dat.id;
                }
                obj['data'] = dat;
                if (dat && dat.date_created) {
                    // console.log('date_created', dat.date_created, new Date(dat.date_created))
                    obj['createdAt'] = moment(dat.date_created).format();
                    obj['created_at'] = moment(dat.date_created).format();
                }
                if (dat && dat.date_modified) {
                    // console.log('date_created', dat.date_created, new Date(dat.date_created))
                    obj['updatedAt'] = moment(dat.date_modified).format();
                }
                // console.log('created dat id:', dat.id)
                Order.create(obj, function (err, ord) {
                    let y = page + 1;
                    self.checkOrder(req, ord)
                    self.sendReq(req, theUrl, y);

                })
            });
            // return res.json(response.data)
        }).catch(e => {
            // console.log('#page =====>     error')

            let y = page;

            self.sendReq(req, theUrl, y);
        });
    },
    importFromWordpress: function (req, res, next) {
        let url = '';
        if (req.query.url) {
            url = req.query.url;
        }
        if (req.query.consumer_secret) {
            url += '?consumer_secret=' + req.query.consumer_secret;
        }
        if (req.query.consumer_key) {
            url += '&consumer_key=' + req.query.consumer_key;
        }

        if (req.query.per_page) {
            url += '&per_page=' + 1;
        }
        // if (req.query.page) {
        //     url += '&page=' + req.query.page;
        // }
        // console.log('importFromWordpress', url);
        let count = 0;
        var i = req.query.page;
        // for (var i = 3101; i < 7000; i++) {
        // let theUrl = url;
        // theUrl += '&page=' + i;
        // console.log('theUrl:', theUrl);
        // return
        self.sendReq(req, url, parseInt(i));
        // }


    },
    checkOrder: function (req, item, k = -1) {
        let Customer = req.mongoose.model('Customer');
        let Order = req.mongoose.model('Order');
        let Media = req.mongoose.model('Media');
        let Notfound = 0
        let obj = {};
        if (item.data && item.data.date_created) {
            // console.log('date_created', item.data.date_created, new Date(item.data.date_created))
            obj['createdAt'] = moment(item.data.date_created).format();
            obj['created_at'] = moment(item.data.date_created).format();
        }
        if (item.data && item.data.date_modified) {
            // console.log('date_created', item.data.date_created, new Date(item.data.date_created))
            obj['updatedAt'] = moment(item.data.date_modified).format();
        }
        if (item.data && item.data.coupon_lines) {
            _.forEach(item.data.coupon_lines, (coupon_lines) => {
                let dcode = coupon_lines.code;
                let discountAmount = coupon_lines.discount;
                if (dcode) {
                    obj['discountCode'] = dcode
                }
                if (discountAmount) {
                    obj['discountAmount'] = discountAmount
                }
                if (coupon_lines.meta_data && coupon_lines.meta_data[0]) {
                    let discount = coupon_lines.meta_data[0].display_value.amount;

                    if (discount) {
                        obj['discount'] = discount
                    }
                }
            })
        }
        if (item.data && item.data.discount_total && item.data.discount_tax) {
            obj['discountAmount'] = parseInt(item.data.discount_total) + parseInt(item.data.discount_tax)

        }
        if (item.data && item.data.line_items) {
            let theCart = [], thePackage = [];
            _.forEach(item.data.line_items, (cart_data) => {
                theCart.push({
                    "_id": cart_data.id,
                    "sku": cart_data.sku,
                    "price": parseInt(cart_data.subtotal) || cart_data.price,
                    "salePrice": null,
                    "count": cart_data.quantity,
                    "title": {
                        "fa": cart_data.name
                    }
                })
                thePackage.push({
                    "product_name": cart_data.name,
                    "product_id": cart_data.id,
                    "price": parseInt(cart_data.subtotal) || cart_data.price,
                    "total_price": cart_data.total,
                    "quantity": cart_data.quantity,
                    // "_id":  cart_data.id
                })
            })

            obj['card'] = theCart;
            obj['package'] = thePackage;
        }
        // console.log('obj',obj)
// return
        // console.log('item.data.date_created',item.data.date_created,moment(item.data.date_created).format())
        if (item.data && item.data.status) {
            obj['status'] = item.data.status
            if (item.data.status == 'processing') {
                obj['status'] = 'indoing';
                obj['paymentStatus'] = 'paid';
                obj['paid'] = 'true';

            }
            if (item.data.status == 'completed') {
                obj['status'] = 'complete';
                obj['paymentStatus'] = 'paid';
                obj['paid'] = 'true';

            }
            if (item.data.status == 'pws-ready-to-ship') {
                obj['status'] = 'makingready';
                obj['paymentStatus'] = 'paid';
                obj['paid'] = 'true';

                // obj['paymentStatus']='paid';

            }
            if (item.data.status == 'pws-shipping') {
                obj['status'] = 'makingready';
                obj['paymentStatus'] = 'paid';
                obj['paid'] = 'true';

                // obj['paymentStatus']='paid';

            }
            if (item.data.status == 'pws-packaged') {
                obj['status'] = 'makingready';
                obj['paymentStatus'] = 'paid';
                obj['paid'] = 'true';

                // obj['paymentStatus']='paid';

            }
            if (item.data.status == 'cancelled') {
                obj['status'] = 'cancel';
                // obj['paymentStatus']='paid';

            }
            if (item.data.status == 'pending') {
                obj['status'] = 'processing';
                // obj['paymentStatus']='paid';

            }

            if (item.data.status == 'on-hold') {
                obj['status'] = 'processing';
                // obj['paymentStatus']='paid';

            }
        }
        if (item.data && item.data.total) {
            obj['amount'] = item.data.total
            obj['total'] = item.data.total
            obj['sum'] = item.data.total
        }
        if (item.data && item.data.cart_tax) {
            obj['taxAmount'] = parseInt(item.data.cart_tax)


        }
        let internationalCode = null, sex = null, birthday = null, monthday = null
        if (item.data && item.data.meta_data && item.data.meta_data[0]) {
            _.forEach(item.data.meta_data, (j) => {
                if (j.key == '_billing_national_id') {
                    internationalCode = j.value;
                }
                if (j.key == '_billing_sex') {
                    sex = j.value;
                }
                if (j.key == 'birthday') {
                    birthday = j.value;
                }
                if (j.key == 'monthday') {
                    monthday = j.value;
                }
            })
        }

        if (item.data && item.data.billing && item.data.billing.phone) {
            let custObj = {
                // 'firstName': item.data.billing.first_name,
                // 'lastName': item.data.billing.last_name,

            };
            if (item.data.billing && item.data.billing.email) {
                custObj['email'] = item.data.billing.email
            }
            if (internationalCode) {
                custObj['internationalCode'] = internationalCode
            }
            if (sex) {
                custObj['sex'] = sex
            }
            if (birthday && monthday) {
                // console.log(monthday + '/' + birthday)
                // custObj['birthdate']=sex
            }
            let phoneNumber = (item.data.billing.phone).slice(-12);
            phoneNumber = phoneNumber.replace(/\s/g, "");
            // console.log('==> addCustomer() 1.11');
            phoneNumber = persianJs(phoneNumber).arabicNumber().toString().trim();
            phoneNumber = persianJs(phoneNumber).persianNumber().toString().trim();
            phoneNumber = parseInt(phoneNumber).toString();

            if (phoneNumber.length < 12) {
                // console.log('to: ', to.toString(), to.toString().length);
                if (phoneNumber.toString().length === 10) {
                    phoneNumber = "98" + phoneNumber.toString();
                }
            }
            custObj['address'] = [{
                "type": "",
                "State": item.data.billing.state,
                "City": item.data.billing.city,
                "StreetAddress": item.data.billing.address_1,
                "PostalCode": item.data.billing.postcode
            }]
            // if(item.data.meta_data){
            //     item.data.meta_data.forEach((j)=>{
            //         if(j.key=='_billing_national_id'){
            //             // j.value
            //             custObj['internationalCode'] = j.value;
            //
            //         }
            //     })
            // }
            if (phoneNumber.length == 12)
                Customer.findOneAndUpdate({phoneNumber: phoneNumber}, custObj, {new: true}, function (err, customer) {
                    if (!customer) {
                        Notfound++;
                        // console.log('#' + k + ' customer not found', item.data.billing.phone, phoneNumber);
                        custObj['firstName'] = item.data.billing.first_name;
                        custObj['lastName'] = item.data.billing.last_name;
                        Customer.create({phoneNumber: phoneNumber, ...custObj}, function (err, tcustomer) {
                            if (tcustomer) {
                                obj['customer'] = tcustomer._id;
                                obj['customer_data'] = {
                                    'firstName': item.data.billing.first_name,
                                    'lastName': item.data.billing.last_name,
                                }
                                obj['billingAddress'] = {
                                    "type": "",
                                    "State": item.data.billing.state,
                                    "City": item.data.billing.city,
                                    "StreetAddress": item.data.billing.address_1,
                                    "PostalCode": item.data.billing.postcode
                                }
                                Order.findByIdAndUpdate(item._id, obj, function (err, products) {
                                    // console.log('k', k, moment(item.data.date_created).format(), products.createdAt)
                                })
                            }
                        });
                    }
                    if (customer) {
                        obj['customer_data'] = {
                            phoneNumber: phoneNumber,
                            'firstName': customer.firstName || item.data.billing.first_name,
                            'lastName': customer.lastName || item.data.billing.last_name,
                            'email': item.data.billing.email,
                            // 'internationalCode': item.data.billing.email,
                        }
                        if (custObj['internationalCode']) {
                            obj['customer_data']['internationalCode'] = custObj['internationalCode']
                        }
                        // if(!item.data.billing.last_name){
                        //     console.log(item.orderNumber+' has not last name')
                        //     let las=item.data.billing.first_name.split(' ');
                        //     let fi=las.shift()
                        //     console.log('las')
                        //     obj['firstName']=fi;
                        //     obj['lastName']=las.join(' ', ' ')
                        // }
                        obj['customer'] = customer._id;

                        obj['billingAddress'] = {
                            "type": "",
                            "State": item.data.billing.state,
                            "City": item.data.billing.city,
                            "StreetAddress": item.data.billing.address_1,
                            "PostalCode": item.data.billing.postcode
                        }
                        if (!customer.firstName) {
                            custObj['firstName'] = item.data.billing.first_name
                        }
                        if (!customer.lastName) {
                            custObj['lastName'] = item.data.billing.last_name
                        }
                        Customer.findByIdAndUpdate(customer._id, custObj, {new: true}, function (err, customer) {
                            // console.log('custObj', custObj)

                        });
                        Order.findByIdAndUpdate(item._id, obj, {new: true}, function (err, orders) {
                            // console.log('obj', obj)
                            if (err) {
                                console.log('err', err)
                            }
                            // if (obj.card)
                            // console.log('k', k, obj.card.length, orders.card.length, orders.orderNumber, moment(item.data.date_created).format(), orders.createdAt)
                        })
                    }
                })
        } else {
            // console.log('obj', obj)
            // return
            Order.findByIdAndUpdate(item._id, obj, {new: true}, function (err, orders) {
                if (err) {
                    console.error('err', err)
                }
                // if (item.data)
                // console.log('k', k, obj.card.length, orders.card.length, orders.orderNumber, moment(item.data.date_created).format(), orders.createdAt)
            })
        }
    },
    rewriteOrders: function (req, res, next) {
        console.log('rewriteOrders');
        let Customer = req.mongoose.model('Customer');
        let Order = req.mongoose.model('Order');
        let Media = req.mongoose.model('Media');
        let Notfound = 0
        Order.find({}, function (err, orders) {
            _.forEach(orders, (item, k) => {
                self.checkOrder(req, item, k);
            })
        })
    },
    destroy: function (req, res, next) {
        let Order = req.mongoose.model('Order');

        Order.findByIdAndUpdate(req.params.id,
            {
                $set: {
                    status: "trash"
                }
            },
            function (err, order) {
                if (err || !order) {
                    return res.json({
                        success: false,
                        message: 'error!'
                    });
                }
                if (req.headers._id && req.headers.token) {
                    let action = {
                        user: req.headers._id,
                        title: 'delete order ' + order._id,
                        // data:order,
                        history: order,
                        order: order._id,
                    };
                    req.submitAction(action);
                }
                return res.json({
                    success: true,
                    message: 'Deleted!'
                });

            }
        );
    }


});
export default self;