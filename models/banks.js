
var banksSchema = new mongoose.Schema({
    title : {type : String, required : true},
	senderName : {type : String, required : true},
    phone : {type : String},
    creationDate : {type: Date, default: Date.now}
});



module.exports = mongoose.model('banks', banksSchema);
