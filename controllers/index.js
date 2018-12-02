var express = require('express');
var router = express.Router();
var passport = require('passport');
var dataTableQuery = require('../libraries/datatables-query')(Models.sms);

var cron = require('node-cron');
 
cron.schedule('*/59 * * * *', () => {  // every 59 hours 
    var dateNow = new Date();
    var before24Date = new Date(dateNow.setDate(dateNow.getDate()-1));
    // var before24Date = dateNow;

    Models.sms.find({status : 'pending', creationDate  : {$lt : before24Date } },'id',function(err,smsWithoutOrders){
        Models.sms.update({status : 'pending', creationDate  : {$lt : before24Date } },{status : 'withoutOrders'},{multi: true},function(err,result){
            console.log(result);
        });
        io.emit('smsWithoutOrders',smsWithoutOrders);
    }); 
});

router.use('/auth', require('./auth'));
router.use('/banks', require('./banks'));
router.use('/users', require('./users'));
router.get('/newSms',function(req,res){
    return res.render('index')
});

router.get('/getAll',function(req,res){
    Models.sms.find(req.query,function(err,allSms){
        if(err)
            return res.json(err);
        return  res.json(allSms);
    }); 
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

            var activePage  = 'view';
            var mainActive = req.query.rep?'rep':'dash';
            return res.render('view', {mainActive : mainActive, active : activePage, user: req.user, banks:banks, representative : allRep,bank : req.query.bank,rep : req.query.rep});
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
            return res.render('view', {mainActive : 'dash',active : 'completed', user: req.user, banks:banks, representative : allRep,rep:req.query.rep,bank:req.query.bank}); 
        });
    });
});

router.post('/ajaxList', function(req, res, next) {
    // populate
        var populate = '';
        if(req.body.activePage == 'completed')
            populate = 'completedBy';
        else if(req.body.activePage == 'refund')
            populate = 'refundBy';
        else if(req.body.bank)
            populate = 'toRepresentative';
        req.body.populate = populate;
    // activePage
        if(req.body.activePage == 'view')
            req.body.activePage = 'pending';
    
    req.body.extraWhere = { status : req.body.activePage};
    if(req.body.rep){
        req.body.extraWhere.toRepresentative = req.body.rep; 
        req.body.extraWhere.status = 'assigned';
    }
    if(req.body.bank){
        req.body.extraWhere.senderName = req.body.bank; 
        delete req.body.extraWhere.status;
    }
    req.body.extraSelect = { status : 1};

    // console.log(req.bo)

    dataTableQuery.run(req.body).then(function (data) {
        return res.status(200).json(data);
    }, function (err) {
        return res.status(500).json(err);
    });
});

router.get('/withoutOrders', function(req, res, next) {
    Models.banks.find({},function(err,banks){
        if(err)
            return res.json(err);
        Models.user.find({isRepresentative : true},function(err,allRep){
            if(err)
                return res.json(err);
            return res.render('view', {mainActive : 'dash',active : 'withoutOrders', user: req.user,  banks:banks, representative : allRep,rep:req.query.rep,bank : req.query.bank});
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
            return res.render('view', {mainActive : 'dash',active : 'refund', user: req.user,  banks:banks, representative : allRep,rep:req.query.rep,bank : req.query.bank });
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

router.post('/sms/uncompleted', function(req, res, next) {
    if(!req.body.smsId)
        return res.status(400).json({message : 'id is required'});
    var updateData = {status : 'pending'};
    Models.sms.update({_id: ObjectId(req.body.smsId)},updateData,function(err,result){
        if(err)
            return res.status(500).json(err);

        Models.sms.findOne({_id: ObjectId(req.body.smsId)},function(err,sms){
            if(err)
                return res.status(500).json(err);

            io.emit("newSms",sms);
            return res.status(200).json({message : 'done'});
        }); 
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
