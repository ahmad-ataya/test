var passportJWT = require("passport-jwt");
var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;

// load up the user model
 // get db config file


 var cookieExtractor = function(req) {
    var token = null;
    if (req && req.cookies)
    {
        token = req.cookies['jwt'];
    }
    return token;
};


module.exports = function(passport){
  var opts = {};
  opts.jwtFromRequest = cookieExtractor;
  opts.secretOrKey = GLOBALCONFIG.secretJwt;
  passport.use(new JwtStrategy(opts, (jwt_payload, done) => {

    if (jwt_payload.expiredDate < Date.now()) 
      return done(false, false);
    Models.user.getUser(jwt_payload.id, function(err, user) {
        if (err)
            return done(false, false);
        if (!user) 
            return done(null, false);
        return done(null, user);
      });
  }));
}

