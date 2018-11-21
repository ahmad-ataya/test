var bcrypt = require('bcryptjs');



var userSchema = new mongoose.Schema({
    name  : String,

    primaryPhone: {
        type: String
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },
    isRepresentative : {
        type  : Boolean,
        default : false
    }
});




userSchema.pre('save', function(next) {
    var self = this;

    if (!this.isModified('password'))
        return next();

    bcrypt.genSalt(10, function(error, salt) {
        if (error)
            return next(error);

        bcrypt.hash(self.password, salt, function(error, hash) {
            if (error)
                return next(error);

            self.password = hash;
            return next();
        });
    });
});

userSchema.statics.getUserByEmail = function(email, cb) {
    this.findOne({ email: new RegExp(["^", email, "$"].join(""), "i") },cb);
}

userSchema.statics.getUser = function(id, cb) {
    this.findOne({ _id: id}, { password: 0}).exec(cb)
}



userSchema.methods.verifyPassword = function(otherPassword) {
    if (!otherPassword || !this.password)
        return false;
    return bcrypt.compareSync(otherPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
