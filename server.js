var express = require('express');
var bodyParser = require('body-parser');
var {OAuth2Client} = require('google-auth-library');
var io = require('socket.io-client');
var AWS = require("aws-sdk");

AWS.config.update({region:'us-east-1'});
var dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

var app = express();


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));

/*Temporary DB structure (feel free to add to prototypes)

user Collection:

{
	_id: (primary key on db, same as google id)
	socialId: (used for google/fb integration)
	classes: [{
		_id: (primary key of class in the class table)
		name: (name of class)
		notifications: (on/off)
	}]
	testPoints: (number of points for test bank)
}


//Chat could be implemented used Socket.io, which emits events to those who are connected, and stores messages in a database intermittently

class Collection:

{
	_id: (primary key in db)
	name: (name of class, MongoDB index exists for this field)
	schedule: [{
		day: 
		startTime:
		endTime:
	}]
	locations: []
	users: [{
		_id: (primary key of each user in the class)
	}]
	chatMessages: (id of class chat)
}


classChat Collection:

{
	_id: 
	chatMessages: {[
		time: (time when message was sent)
		text: (actual content)
		byUser: (_id of user)
	]}
}


location Collection:

{
	name: 
	type: (library/study room/special)
	mapCoords: (not sure how to implement)
	activityLevel: (not sure how to measure)
}

*/

var CLIENT_ID = "373351297766-5f4knsqmvuu540bl3oh24i6qu2uh4lif.apps.googleusercontent.com";
const oauthClient = new OAuth2Client(CLIENT_ID);

var origin = "https://google.com";
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', origin || "*");
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,HEAD,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'content-Type,x-requested-with');
    next();
});


app.get('/', function(req, res){

	var query = {
		TableName: "user",
		Key: {
			"_id": "mytest",
		},
	};

	docClient.get(query, function(err, data) {
		if (err) {
			throw err;
			res.send("err")
		}
		res.send(data);
	});
})



//USER SECTION

//Get all user info
app.get('/user/:id', function(req, res) {
	//var userId = req.params.id;
	var socialId = req.params.socialId;

	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		console.log("Database connected");


		const verifyToken = new Promise(function(resolve, reject){
			client.verifyIdToken(
				socialId,
				CLIENT_ID,
				function (e, login){
					if (login) {
						var payload = login.getPayload();
						var googleId = payload['sub'];
						resolve(googleId);
					} else {
						reject("invalid token");
					}
				}
			)
		})

		verifyToken.then(function(userId){
			var query = {
				TableName: "user",
				Key: {
					"_id": userId
				}
			};

			docClient.get(params, function(err, data) {
				if (err) throw err;
				d
			});

			var dbo = db.db("studysmart");
			dbo.collection("user").find(query).toArray(function(err, result) {
				if (err) throw err;
				var resjson = result[0];

				if(result.length == 0){
					db.close();
					var errjson = {
						error: "No user found",
					}
					res.json(errjson);
				}

				db.close();
				res.error = null;
				res.json(resjson);
			});
		}).catch(function(err){
			console.log(err);
			var resjson = {
				error: "Authentication error",
				newUser: false,
				id: null
			}

			db.close();
			res.json(resjson);
		});
	});
});


//Use this for sign in
app.post('/user/:id', function(req, res) {
	//var userId = req.params.id;
	var socialId = req.params.socialId;

	const verifyToken = new Promise(function(resolve, reject){
		client.verifyIdToken(
			socialId,
			CLIENT_ID,
			function (e, login){
				if (login) {
					var payload = login.getPayload();
					var googleId = payload['sub'];
					resolve(googleId);
				} else {
					reject("invalid token");
				}
			}
		)
	})

	verifyToken.then(function(userId){
		var query = {_id: userId};
		var dbo = db.db("studysmart");
		dbo.collection("user").find(query).toArray(function(err, result) {
			if (err) throw err;
			var resjson = result[0];

			if(result.length == 0){
				var newUser = {
					_id: userId,
					socialId: socialId,
					classes: [],
					testPoints: 0
				}

				dbo.collection("user").insertOneAndUpdate(newUser, function(err, result) {
					if (err) throw err;
					var resjson = {
						error: null,
						newUser: true,
						id: socialId
					}

					db.close();
					res.json(resjson);
				});
			}
			else{
				var toupdate = {$set: {socialId: socialId}};
				dbo.collection("user").findOneAndUpdate(query, toupdate, function(err, result) {
					if (err) throw err;
					var resjson = {
						error: null,
						newUser: false,
						id: socialId
					}

					db.close();
					res.json(resjson);
				});
			}
		});

	}).catch(function(err){
		console.log(err);
		var resjson = {
			error: "Authentication error",
			newUser: false,
			id: null
		}

		db.close();
		res.json(resjson);
	});
});



//CLASSES SECTION

//Get all class info, search by name or id
app.get('/class', function(req, res) {

});


//Get class chat (or the last few messages). Start socket connection, and allow user to post chats
app.get('/classchat/:id', function(req, res) {
	
});


//Create a new class (and class chat), check if name conflict
app.post('/class', function(req, res) {
	
});


//LOCATIONS SECTION

//Get locations, possibly all or some locations
app.get('/locations', function(req, res) {

});


//Get location info
app.get('/location/:id', function(req, res) {

});


//Post location info
app.post('/location', function(req, res) {

});


//Post libinfo
app.post('/libinfo', function(req, res) {
	var infoArr = req.body;
	var arrLength = infoArr.length;
	var completed = 0;

	infoArr.forEach((info) => {
		var entry = {
			TableName: "lib_info",
			Item: {
				name: info.name,
				location: info.location,
				department: info.department,
			},
		};

		docClient.put(entry, function(err, data) {
			completed++;
			if (err) {
				throw err;
			}
			if(completed == arrLength){
				res.send("done");
			}
		});
	})
});


app.listen(process.env.PORT || 3000);