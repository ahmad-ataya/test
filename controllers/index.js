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

router.post('/newSms',function(req,res,next){
    console.log(req.body);
    if(!req.body.data)
        return res.status(200).json({response : 0, message : 'data not  found'});
    try{req.body.data = JSON.parse(req.body.data)}
    catch(e){return res.status(200).json({response : 0,message : 'can not parse'})}

    // if(!Array.isArray(req.body.data))
    //     req.body.data = [req.body.data];

    async.each(req.body.data, function(data, callback) {
        Models.sms.findOne({mobileId : data.id, senderName: data.senderName},function(err,oldSms){
            if(err)
                return callback(err);
            if(oldSms){
                console.log("repeateSms : ",oldSms,data);
                return callback(); 
            }

            Models.sms.create({
                mobileId : data.id,
                senderName : data.senderName,
                text : data.text,
                phone : data.phone,
                from : data.from,
                deviceEmitTime : data.deviceEmitTime,
                creationDate : data.creationDate?new Date(data.creationDate) : undefined,
                serviceCenterTime : data.serviceCenterTime
            },function(err,sms){
                if(err)
                    return callback(err);
                // if(data.from)
                //     socket.emit('newSms',sms);
                io.emit('newSms',sms);
                return callback(); 
            });
        });
    }, function(err) {
        if(err)
            return  res.status(200).json({response : 0,message : err});
        return  res.status(200).json({response : 1});
    });
});

router.use('/auth', require('./auth'));

//router.use('/users', require('./users'));


router.use(passport.authenticate('jwt', {session : false,failureRedirect : '/auth/login',failureMessage : {message :'pleaseTryAgain'}}));
router.use(function(req,res,next){// refreshToken
    // res.set('Authorization',req.get('Authorization'));
    return  next();
});
// ************************************************* isAdmin ********************************************************
    router.use('/banks', require('./banks'));
    router.use('/users', require('./users'));
    router.get('/testSms',function(req,res){
        if(!req.user || !req.user.isAdmin)
            return res.status(500).json({message : 'permssionDenied'});
        return res.render('index')
    });
    router.get('/getAll',function(req,res){
        if(!req.user || !req.user.isAdmin)
            return res.status(500).json({message : 'permssionDenied'});
        Models.sms.find(req.query,function(err,allSms){
            if(err)
                return res.json(err);
            return  res.json(allSms);
        }); 
    });
// ************************************************* isAdmin ********************************************************


router.get('/', function(req, res, next) {
    Models.banks.find({},function(err,banks){
        if(err)
            return res.json(err);
        Models.user.find({isRepresentative : true},function(err,allRep){
        if(err)
            return res.json(err);

            var activePage  = 'view';
            var mainActive = req.query.rep?'rep':'dash';
            return res.render('view', {mainActive : mainActive, active : activePage, user: req.user, banks:banks, representative : allRep,bank : req.query.bank,rep : req.query.rep,ifBankAll : req.query.ifBankAll});
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
            return res.render('view', {mainActive : 'dash',active : 'completed', user: req.user, banks:banks, representative : allRep,rep:req.query.rep,bank:req.query.bank,ifBankAll : req.query.ifBankAll}); 
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

    if(req.body.columns[1].search.value){
        var searchValues = req.body.columns[1].search.value.split('|');
        var searchValues2 = [];
        _.each(searchValues,(v)=>{searchValues2.push(v.trim())});
        console.log(searchValues2);
        req.body.extraWhere.senderName = {$in : searchValues2}
    }

    if(req.body.rep){
        req.body.extraWhere.toRepresentative = req.body.rep; 
        req.body.extraWhere.status = 'assigned';
    }
    if(req.body.bank)
        req.body.extraWhere.senderName = new RegExp('^'+req.body.bank+'$','i'); ; 
    if(req.body.ifBankAll)
        delete req.body.extraWhere.status;
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
            return res.render('view', {mainActive : 'dash',active : 'withoutOrders', user: req.user,  banks:banks, representative : allRep,rep:req.query.rep,bank : req.query.bank,ifBankAll : req.query.ifBankAll});
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
            return res.render('view', {mainActive : 'dash',active : 'refund', user: req.user,  banks:banks, representative : allRep,rep:req.query.rep,bank : req.query.bank,ifBankAll : req.query.ifBankAll });
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


router.delete('/sms/:smsId/notes/:note',function(req,res,next){
    Models.sms.findOne({_id: ObjectId(req.params.smsId)},function(err,sms){
        if(err)
            return res.status(500).json(err);

        if(!sms)
            return res.status(404).json({message : 'smsNotFound'});
        var index = sms.notes.indexOf(req.params.note);
        console.log(index);
        if (index > -1)
            sms.notes.splice(index, 1);
        console.log(sms.notes);

        sms.save((err)=>{
            if(err)
                return res.status(500).json(err);
            return res.status(202).json({message : 'done',notes : sms.notes});

        });
    }); 
});
module.exports = router;
