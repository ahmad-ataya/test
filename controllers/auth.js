var express = require('express');
var router = express.Router();
var jwt = require('jwt-simple');





router.post('/signup',function(req, res) {
    if(!req.body.email || !req.body.password)
        return res.status(400).json({message : 'email And password required'});

    req.body.email.toLowerCase();
    Models.user.create(req.body, function(err, data) {
        if (err)
            return res.status(500).json(err);
        return res.status(201).json(data);
    });
});


router.get('/login',function(req,res){
    res.render('login');
})


router.post('/login', function(req, res) {
    Models.user.getUserByEmail(req.body.email, function(err, user) {
        if (err)
            return res.render('login',{errorMessage : err.message});
        if (!user || !user.verifyPassword(req.body.password))
            return res.render('login',{errorMessage: 'email or password not  correct'});



        var milliseconds = new Date().getTime() + (GLOBALCONFIG.jwtExpiredDateHour * 3600 * 1000);
        var token = jwt.encode({
            id: user.id,
            name: user.name,
            expiredDate: milliseconds
        }, GLOBALCONFIG.secretJwt);
        // res.set('Authorization', 'bearer ' + token);
        res.cookie('jwt',token);
        return res.redirect('/');
    });
});

module.exports = router;
