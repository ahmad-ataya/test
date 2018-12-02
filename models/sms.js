
var smsSchema = new mongoose.Schema({
	senderName : String,
	text : String,
    status: {
        type: String,
        required: true,
        default: 'pending',
        enum : ['pending','completed','refund','assigned','withoutOrders']
    },
    notes : [String],
    phone : {type : String},

    deviceEmitTime : String,
    serviceCenterTime : String,

    completedBy : {type: ObjectId, ref: "User"},
    completedAt : {type: Date},

    toRepresentative : {type : ObjectId, ref : "User"},

    refundBy : {type: ObjectId, ref: "User"},
    refundAt : {type: Date},

    from : String,
    creationDate : {type: Date, default: Date.now}
});

smsSchema.index({ status: 1 });
smsSchema.index({ senderName: 1 });

module.exports = mongoose.model('Sms', smsSchema);
