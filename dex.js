'use strict';

const express = require('express'),
	path = require('path'),
	nunjucks = require('nunjucks'),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	compression = require('compression'),
	request = require('request'),
	admin = require('firebase-admin'),
	rp = require('request-promise');


require('dotenv').config();

const network = require('./src/server/modules/network'),
		alert = require('./src/server/modules/alert');

const routes = require('./src/server/routes/routes');

// initializing different instances on the server
const app = express();

admin.initializeApp({
	credential: admin.credential.cert(require('./src/server/keys/fire.json')),
	databaseURL: "https://dex-dapp.firebaseio.com"
});

var db = admin.database();

app.locals.db = db;
app.locals.port = 8000;
network.init(app);

if (process.env.localURL) {
	app.locals.URL = `http://localhost:${app.locals.port}`;
} else {
	app.locals.URL = `https://easwap.com`;
}

app.set('trust proxy', true);

app.use(cookieParser());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.use(compression());
app.disable('x-powered-by');

app.use(express.static(path.join(__dirname, 'src/client/public'), {
	maxAge: '750h'
}));

var routePath = '';
for (var i = 0; i < 7; i++) {
	routePath += `/:id${i}`;
	app.use(routePath, express.static(path.join(__dirname, 'src/client/public'), {
		maxAge: '750h',
		redirect: false // to remove slash '/' from the last of url
	}));
}

app.use('/', routes);

nunjucks.configure('./src/client/views', {
	autoescape: false,
	express: app
});
app.set('view engine', 'nunjucks');

request('https://tracker.kyber.network/api/tokens/pairs', (err, respond, data) => {
    if (err) {
        console.log(err);
		alert.sendPush('sjain0410@gmail.com', "note", "api Kyber", `Err-7423: ${err}`);
    } else {
        var details = JSON.parse(data);
        db.ref('kyber/kyberData').set(details);
    }
});

request('https://tracker.kyber.network/api/tokens/supported', (err, respond, data) => {
    if (err) {
        console.log(err);
		alert.sendPush('sjain0410@gmail.com', "note", "api Kyber", `Err-4523: ${err}`);
    } else {
		var details = JSON.parse(data);
        db.ref('kyber/coinmarketcap').set(details);
    }
});

var gasError = 0;

setInterval(function () {
	request("https://ethgasstation.info/json/ethgasAPI.json", (err, data) => {
		if (err) {
			console.log(err);
			alert.sendPush('sjain0410@gmail.com', "note", "api ethgasstation", `Err-0932: ${err}`);
		} else {
			try {
				var details = JSON.parse(data.body);
				db.ref('gas').set({
					gasPrice: details
				}, function (error) {
					if (error) {
						console.log('err - 83292' + error)
					} else {
						// Data saved successfully!
					}
				});
			} catch (err) {
				gasError++;
				if (gasError % 10 == 0) {
					alert.sendPush('sjain0410@gmail.com', "note", "JSON PARSE", `error no.-${gasError}`);
				}
			}
		}
	});
}, 15000);

setInterval(function () {
	db.ref('kyber/coinmarketcap').once('value', function (snapshot) {
		var data = snapshot.val();
		var cmcQuery = "";
		for (i = 0; i < data.length; i++) {
			if (data[i].cmcName != 'KCC') {
				cmcQuery = cmcQuery + data[i].cmcName + ',';
			}
		}
		cmcQuery = cmcQuery.slice(0, -1);
		const requestOptions = {
			method: 'GET',
			uri: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest',
			qs: {
			symbol: cmcQuery
			},
			headers: {
			'X-CMC_PRO_API_KEY': 'b8038c9c-6c9b-42b8-8963-263e0a62ae85'
			},
			json: true,
			gzip: true
		};
		
		rp(requestOptions).then(response => {
			db.ref('coinmarketprice').set(response.data);
		}).catch((err) => {
			console.log('API call error:', err.message);
		});
	}, function (error) {
		if (error) {
			console.log(error);
		}
	});
}, 300000);


exports.module = app;


// Kyber's API's
// Main API with all addresses - https://tracker.kyber.network/api/tokens/pairs
// Coins main net addreses and coin market cap names of coins - https://tracker.kyber.network/api/tokens/supported
// Coins ropsten net addreses and coin market cap names of coins - https://tracker.kyber.network/api/tokens/supported?chain=ropsten
// Price details of coins - https://tracker.kyber.network/api/tickers
// Kovan coins addresses - https://github.com/KyberNetwork/smart-contracts/blob/master/web3deployment/kovanV2.json