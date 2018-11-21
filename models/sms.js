
var smsSchema = new mongoose.Schema({
	senderName : String,
	text : String,
    status: {
        type: String,
        required: true,
        default: 'pending',
        enum : ['pending','completed','refund']
    },
    notes : [String],
    phone : {type : String},

    completedBy : {type: ObjectId, ref: "User"},
    completedAt : {type: Date},

    refundBy : {type: ObjectId, ref: "User"},
    refundAt : {type: Date},

    creationDate : {type: Date, default: Date.now}
});



module.exports = mongoose.model('Sms', smsSchema);
