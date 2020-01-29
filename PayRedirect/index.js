var LiqPay = require('liqpayjs-sdk');

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
       
    if (req.query.account && req.query.amount) {
        var liqpay = new LiqPay(process.env["liqpay_public_key"], process.env["liqpay_private_key"]);
        const params = {
            'action': 'pay',
            'amount': req.query.amount,
            'currency': 'UAH',
            'description': process.env["liqpay_description"] + ' ' + req.query.account,
            'order_id': 'order_id_1',
            'version': '3'
        };
        var signature = liqpay.cnb_signature(params);
        
        var data = new Buffer(JSON.stringify(params)).toString('base64');

        context.res = {
            status: 303, /* Defaults to 200 */
            headers: {
                location: "https://www.liqpay.ua/api/3/checkout?data="+data+"&signature="+signature
            }
        };
    }
    else {
        context.res = {
            status: 400,
            body: "Query string is missing"
        };
    }
};