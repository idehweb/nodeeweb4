export default (props) => {
    // console.log("samanGateway",props);

    // _.forEach()
    if (props && props.entity)
        props.entity.map((item, i) => {
            if (item.name === 'gateway') {
                if (item.routes)
                    item.routes.push({
                        'path': '/saman/getToken',
                        'method': 'post',
                        'access': 'customer_all',
                        'controller': (req, res, next) => {
                            console.log('req,body', req.body);
                            if (!req.body.MerchantID) {

                            }
                            let getToken = {
                                'method': 'POST',
                                'headers': { 'Content-Type': 'application/json' },
                                'url': 'https://sep.shaparak.ir/onlinepg/onlinepg',
                                'data': {
                                    'action': 'token',
                                    'TerminalId': req.body.TerminalId,
                                    'ResNum': req.body.ResNum,
                                    'Amount': req.body.Amount,
                                    'RedirectUrl': req.body.RedirectUrl,
                                    'CellNumber': req.body.CellNumber,
                                },
                                'json': true,
                            };

                            req.httpRequest(getToken).then(function(parsedBody) {
                                console.log('parsedBody saman', parsedBody['data']);
                                if (parsedBody && parsedBody['data'] && (parsedBody['data']['status'] == 1) && parsedBody['data']['token'])
                                    return res.json({
                                        url: 'https://sep.shaparak.ir/OnlinePG/SendToken?token=' + parsedBody['data']['token'],
                                        Authority: parsedBody['data']['token'],
                                    });
                                else return res.status(500).json({
                                    success:false
                                })
                            });
// let { "method": "POST", "headers":{"Content-Type":"application/json"},"url": "https://www.saman.com/pg/rest/WebGate/PaymentRequest.json", "data": { "MerchantID": "e3d567e6-0c5d-440d-ae22-d44370c5473d", "Amount": "%amount%*10", "CallbackURL": "%domain%/transaction/zibal/", "Description": "# %orderNumber%" }, "json": true }

                        },
                    });
            }
            if (item.name === 'transaction') {
                if (item.routes)
                    item.routes.push({
                        'path': '/status/saman/',
                        'method': 'post',
                        'access': 'customer_all',
                        'controller': (req, res, next) => {
                            console.log('saman:', req.body);
                            let data = {}, transactionObject = {}, orderObject = {};
                            if (req.body.Status && req.body.Status == 'NOK') {
                                transactionObject['statusCode'] = 3;
                                orderObject['paymentStatus'] = 'unsuccessful';

                            }
                            if (req.body.Status == 'OK') {
                                let Gateway = req.mongoose.model('Gateway');
                                let Transaction = req.mongoose.model('Transaction');
                                Gateway.findOne({ slug: 'saman' }, function(err, items) {
                                    if (err || !item) {
                                        return res.json({
                                            success: false,
                                        });
                                    }
                                    if (!items.verify)
                                        return res.json({
                                            success: false,
                                        });
                                    console.log('verify', items.verify);

                                    let verify = JSON.parse(items.verify);
                                    console.log('verify', verify);

                                    if (!verify['data']) {
                                        verify['data'] = {};
                                    }
                                    Transaction.findOne({ Authority: req.body.Authority }, function(err, tr) {
                                        console.log('tr', tr);
                                        console.log('/status/saman/', req.body);
                                        console.log('req.body.Authority:', req.body.Authority);
                                        verify['data']['Authority'] = (req.body.Authority);
                                        verify['data']['Amount'] = parseInt(tr.amount);
                                        console.log('verify', verify);
                                        console.log('start send request');
                                        req.httpRequest(verify).then(function(parsedBody) {
                                            console.log('parsedBody["data"]', parsedBody['data']);
                                            if (!parsedBody['data']) {
                                                return res.json({
                                                    'success': false,
                                                    'message': '',
                                                });
                                            }
                                            data = (parsedBody['data']);
                                            console.log('data', data);
                                            transactionObject['status'] = !!(data && data.Status === 100);
                                            transactionObject['statusCode'] = (data && data.Status === 100) ? '1' : '-1';
                                            if (data.cardNumber)
                                                transactionObject['cardNumber'] = data.cardNumber;

                                            if (data.RefID)
                                                transactionObject['RefID'] = data.RefID;
                                            if (tr.paymentStatus != 'paid')
                                                orderObject['paymentStatus'] = (data && data.Status === 100) ? 'paid' : 'notpaid';
                                            if (data && (data.Status == 201)) {
                                                return res.json({
                                                    message: 'you did it before',
                                                    success: false,
                                                });
                                            } else if (data && (data.Status == 202)) {
                                                return res.json({
                                                    message: 'you did noy pay',
                                                    success: false,
                                                });
                                            } else if (data && (data.Status == 102)) {
                                                return res.json({
                                                    message: 'you did not enter merchant',
                                                    success: false,
                                                });
                                            } else if (data && (data.Status == 103)) {
                                                return res.json({
                                                    message: 'merchant is deactive',
                                                    success: false,
                                                });
                                            } else if (data && (data.Status == 104)) {
                                                return res.json({
                                                    message: 'merchant is unknown',
                                                    success: false,
                                                });
                                            } else if (data && (data.Status == 203)) {
                                                return res.json({
                                                    message: 'trackId is unknown',
                                                    success: false,
                                                });
                                            } else {
                                                update_transaction();
                                            }

                                        }).catch(e => {
                                            console.error(e);

                                            return res.json({ e, requ: verify });

                                        });

                                    });

                                    // return;

                                });
                            } else {
                                update_transaction();
                            }

                            function update_transaction() {
                                req.updateTransaction(req, res, next, transactionObject, orderObject, { 'Authority': req.body.Authority });
                            }
                        },
                    });
            }

        });
    props['plugin']['saman-gateway'] = [
        { name: 'token', value: '', label: 'token' },
    ];
    return props;
}
