var LiqPay = require('liqpayjs-sdk');
const util = require('util');

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
       
    if (req.query.account && req.query.amount && req.query.period) {
        var liqpay = new LiqPay(process.env["liqpay_public_key"], process.env["liqpay_private_key"]);
        var description = util.format(process.env["liqpay_description"], req.query.period, req.query.account)
        const params = {
            'action': 'paydonate',
            'amount': parseFloat(req.query.amount),
            'currency': 'UAH',
            'description': description,
            'order_id': 'order_id_1',
            'version': '3',
            'result_url': process.env["liqpay_result_url"]
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