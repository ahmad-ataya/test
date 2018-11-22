
var smsSchema = new mongoose.Schema({
	senderName : String,
	text : String,
    status: {
        type: String,
        required: true,
        default: 'pending',
        enum : ['pending','completed','refund','assigned']
    },
    notes : [String],
    phone : {type : String},

    completedBy : {type: ObjectId, ref: "User"},
    completedAt : {type: Date},

    toRepresentative : {type : ObjectId, ref : "user"},

    refundBy : {type: ObjectId, ref: "User"},
    refundAt : {type: Date},

    from : String,
    creationDate : {type: Date, default: Date.now}
});

smsSchema.index({ status: 1 });

module.exports = mongoose.model('Sms', smsSchema);
