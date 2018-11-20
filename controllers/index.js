var express = require('express');
var router = express.Router();
var passport = require('passport');


router.use('/auth', require('./auth'));
router.get('/newSms',function(req,res){
    return res.render('index')
})


router.use(passport.authenticate('jwt', {session : false,failureRedirect : '/auth/login',failureMessage : {message :'pleaseTryAgain'}}));
router.use(function(req,res,next){// refreshToken
	// res.set('Authorization',req.get('Authorization'));
	return  next();
});


router.get('/', function(req, res, next) {
	Models.sms.find({completed : false},function(err,allSms){
        if(err)
            return res.json(err); 
        return res.render('view', {active : 'view', user: req.user, allSms : allSms });
    }); 
});

router.get('/completed', function(req, res, next) {
    Models.sms.find({completed : true}).populate('completedBy').exec(function(err,allSms){
        if(err)
            return res.json(err); 
  		return res.render('view', {active : 'completed', user: req.user, allSms : allSms });
    }); 
});

router.post('/sms/completed', function(req, res, next) {
	if(!req.body.smsId)
		return res.status(400).json({message : 'id is required'});
    var updateData = {completed : true,completedBy :req.user.id,completedAt : Date.now()};
    Models.sms.update({_id: ObjectId(req.body.smsId)},updateData,function(err,result){
        if(err)
            return res.status(500).json(err); 
        io.emit("smsComplited",{smsId : req.body.smsId});
        return res.status(200).json({message : 'done'});
    }); 
});

router.post('/sms/addNote', function(req, res, next) {
    if(!req.body.smsId)
        return res.status(400).json({message : 'id is required'});
    var updateData = {$push: {notes:req.body.note}};
    Models.sms.update({_id: ObjectId(req.body.smsId)},updateData,function(err,result){
        if(err)
            return res.status(500).json(err); 

  		return res.status(200).json({message : 'done'});
    }); 
});
module.exports = router;
