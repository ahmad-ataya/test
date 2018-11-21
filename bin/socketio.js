io = require('socket.io');
var socketioJwt = require('socketio-jwt');
var jwt = require('jsonwebtoken');
module.exports = function(server){
	io = io(server);
	io.sockets.on('connection', function(socket) {
	 	socket.on('authenticate',function(data){
	 		jwt.verify(data.token, GLOBALCONFIG.secretJwt, {}, function(err,data){
	 			if(err || !data || !data.id)
	 				return socket.emit('unAutentication');


	 		});
	 	});

	 	socket.on('newSms',function(data){
//console.log(data.senderName)
//console.log(data)
try{data = JSON.parse(data)}catch(e){}
//console.log(data);
	 		Models.sms.create({
	 			senderName : data.senderName,
	 			text : data.text,
	 			phone : data.phone
	 		},function(err,sms){
	 			if(err)
	 				return console.log(err);
	 			socket.broadcast.emit('newSms',sms);
	 		})
	 	});
 	});


}
