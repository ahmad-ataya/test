var express = require('express');
var router = express.Router();
var passport = require('passport');


router.use('/auth', require('./auth'));
router.use('/banks', require('./banks'));
router.get('/newSms',function(req,res){
    return res.render('index')
});


router.use(passport.authenticate('jwt', {session : false,failureRedirect : '/auth/login',failureMessage : {message :'pleaseTryAgain'}}));
router.use(function(req,res,next){// refreshToken
    // res.set('Authorization',req.get('Authorization'));
    return  next();
});



router.get('/', function(req, res, next) {
    Models.banks.find({},function(err,banks){
        if(err)
            return res.json(err);
        Models.user.find({isRepresentative : true},function(err,allRep){
        if(err)
            return res.json(err);
            var where = {status : 'pending'};
            if(req.query.bank) where.senderName = req.query.bank;
            if(req.query.rep) {
                where.status = 'assigned'
                where.toRepresentative = req.query.rep;
            }
            
            Models.sms.find(where,function(err,allSms){
                if(err)
                    return res.json(err);
                var activePage  = req.query.bank || req.query.rep || 'view';
                var mainActive = req.query.rep?'rep':'dash';
                return res.render('view', {mainActive : mainActive, active : activePage, user: req.user, allSms : allSms, banks:banks, representative : allRep});
            }); 
        });
    });
});

router.get('/completed', function(req, res, next) {
    Models.banks.find({},function(err,banks){
        if(err)
            return res.json(err);
        Models.user.find({isRepresentative : true},function(err,allRep){
        if(err)
            return res.json(err);
            Models.sms.find({status : 'completed'}).populate('completedBy').exec(function(err,allSms){
                if(err)
                    return res.json(err); 
                return res.render('view', {mainActive : 'dash',active : 'completed', user: req.user, allSms : allSms, banks:banks, representative : allRep});
            }); 
        });
    });
});

router.get('/refund', function(req, res, next) {
    Models.banks.find({},function(err,banks){
        if(err)
            return res.json(err);
        Models.user.find({isRepresentative : true},function(err,allRep){
        if(err)
            return res.json(err);
            Models.sms.find({status : 'refund'}).populate('refundBy').exec(function(err,allSms){
                if(err)
                    return res.json(err); 
                io.emit("smsComplited",{smsId : req.body.smsId});
                return res.render('view', {mainActive : 'dash',active : 'refund', user: req.user, allSms : allSms, banks:banks, representative : allRep });
            }); 
        });
    });
});

router.post('/sms/completed', function(req, res, next) {
    if(!req.body.smsId)
        return res.status(400).json({message : 'id is required'});
    var updateData = {status : 'completed',completedBy :req.user.id,completedAt : Date.now()};
    Models.sms.update({_id: ObjectId(req.body.smsId)},updateData,function(err,result){
        if(err)
            return res.status(500).json(err); 
        io.emit("smsComplited",{smsId : req.body.smsId});
        return res.status(200).json({message : 'done'});
    }); 
});
router.post('/sms/refund', function(req, res, next) {
    if(!req.body.smsId)
        return res.status(400).json({message : 'id is required'});
    var updateData = {status : 'refund',refundBy :req.user.id,refundAt : Date.now()};
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

router.post('/sms/assign', function(req, res, next) {
    if(!req.body.smsId || !req.body.repId)
        return res.status(400).json({message : 'smsId and repId is required'});
    var updateData = {$set: {toRepresentative:req.body.repId}, status : 'assigned'};
    Models.sms.update({_id: ObjectId(req.body.smsId)},updateData,function(err,result){
        if(err)
            return res.status(500).json(err); 
        console.log(err,result);
        return res.status(200).json({message : 'done'});
    }); 
});
module.exports = router;
