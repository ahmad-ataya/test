var express = require('express');
var router = express.Router();

router.use('/',function(req,res,next){
	if(!req.user || !req.user.isAdmin)
        return res.status(500).json({message : 'permssionDenied'});
    return next();
});


router.post('/',function(req, res) {
    if(!req.body.title || !req.body.senderName || !req.body.phone)
        return res.status(400).json({message : 'senderName And phone required'});


    Models.banks.create({title : req.body.title, senderName : req.body.senderName, phone : req.body.phone}, function(err, data) {
        if (err)
            return res.status(500).json(err);
        return res.status(201).json(data);
    });
});


router.get('/',function(req,res){
	Models.banks.find({},function(err,data){
		return res.json(data);
	})
});

router.get('/',function(req,res){
	Models.banks.find({},function(err,data){
		return res.json(data);
	})
});

router.put('/:id',function(req,res){
	Models.banks.findOne({_id : req.params.id},function(err,bank){
		if(err)
			return res.status(500).json(err);
		if(!bank)
			return res.status(400).json({message : 'bank does not exist'});

		bank[req.body.key] = req.body.value;
		bank.save((err)=> {
			if(err)
				return res.status(500).json(err);
			return res.status(202).json(bank);
		})
	});
});

router.delete('/:id',function(req,res){
	Models.banks.remove({_id : req.params.id},function(err,result){
		if(err)
			return res.status(500).json(err);
		return res.json(result);
	});
});

module.exports = router;
