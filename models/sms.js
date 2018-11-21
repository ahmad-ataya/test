
var smsSchema = new mongoose.Schema({
	senderName : String,
	text : String,
    completed: {
        type: Boolean,
        required: true,
        default: false
    },
    notes : ["String"],
    phone : {type : String,default : "-"},
    completedBy : {type: ObjectId, ref: "User"},
    completedAt : {type: Date},
    creationDate : {type: Date, default: Date.now}
});



module.exports = mongoose.model('Sms', smsSchema);
