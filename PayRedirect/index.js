const LiqPay = require('liqpayjs-sdk');
const util = require('util');
const appInsights = require("applicationinsights");
const uuidv4 = require('uuid/v4');

appInsights.setup(process.env["instrumentation_key"]);
appInsights.start();

module.exports = async function (context, req) {
    let client = appInsights.defaultClient;
    req.requestId = uuidv4();
    client.trackEvent({name: "Redirection request", properties: {req: req.query, id: req.requestId}});
       
    if (req.query.pay && req.query.account && req.query.amount && req.query.period) {
        switch (req.query.pay)
        {
            case "liq":
                payLiq(req, client, context);
                break;
            case "p24":
                payP24(req, client, context);
                break;
            default:
                error(req, client, context);
        }
        
    }
    else {
        error(req, client, context);
    }

    client.flush();
};

function error(req, client, context) {
    client.trackEvent({ name: "No redirection", properties: { id: req.requestId } });
    context.res = {
        status: 400,
        body: "Query string is missing"
    };
}

function payLiq(req, client, context) {
    var liqpay = new LiqPay(process.env["liqpay_public_key"], process.env["liqpay_private_key"]);
    var description = util.format(process.env["liqpay_description"], req.query.period, req.query.account);
    const params = {
        'action': 'paydonate',
        'amount': parseFloat(req.query.amount)*1.01,
        'currency': 'UAH',
        'description': description,
        'order_id': 'order_id_1',
        'version': '3',
        'result_url': process.env["liqpay_result_url"]
    };
    var signature = liqpay.cnb_signature(params);
    var data = new Buffer(JSON.stringify(params)).toString('base64');
    client.trackEvent({ name: "LiqPay redirection", properties: { data: data, signature: signature, id: req.requestId} });
    context.res = {
        status: 303,
        headers: {
            location: "https://www.liqpay.ua/api/3/checkout?data=" + data + "&signature=" + signature
        }
    };
    return;
}


function payP24(req, client, context) {
    const amount = parseFloat(req.query.amount);
    const account = req.query.account;
    const token = process.env["p24_token"];
    const url = util.format(
        "https://next.privat24.ua/payments/form/"+
        "%%7B%%22token%%22:%%22%s%%22,%%22sum%%22:%%22%f%%22,%%22personalAccount%%22:%%22%s%%22%%7D",
        token, amount, account);
    client.trackEvent({ name: "Privat24 redirection", properties: { url: url, id: req.requestId} });
    context.res = {
        status: 303,
        headers: {
            location: url
        }
    };
    return;
}
