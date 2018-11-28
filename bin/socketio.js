io = require('socket.io');
var socketioJwt = require('socketio-jwt');
var jwt = require('jsonwebtoken');
module.exports = function(server){
	io = io(server);
	io.on('connection', function(socket) {
		// console.log("ASDASD");
	 	socket.on('authenticate',function(data){
	 		jwt.verify(data.token, GLOBALCONFIG.secretJwt, {}, function(err,data){
	 			if(err || !data || !data.id)
	 				return socket.emit('unAutentication');


	 		});
	 	});

	 	socket.on('newSms',function(data){
			try{data = JSON.parse(data)}catch(e){}
			// console.log(data);
	 		Models.sms.create({
	 			senderName : data.senderName,
	 			text : data.text,
	 			phone : data.phone,
	 			from : data.from,
	 			deviceEmitTime : data.deviceEmitTime,
	 			serviceCenterTime : data.serviceCenterTime
	 		},function(err,sms){
	 			if(err)
	 				return console.log(err);
	 			if(data.from)socket.emit('newSms',sms);
	 			// console.log(socket.broadcast)	 			
	 			socket.broadcast.emit('newSms',sms);
	 		})
	 	});
 	});


}
