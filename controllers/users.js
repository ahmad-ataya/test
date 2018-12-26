var express = require('express');
var router = express.Router();
/*
router.use('/',function(req,res,next){
	if(!req.user || !req.user.isAdmin)
        return res.status(500).json({message : 'permssionDenied'});
    return next();
});
*/
router.get('/',function(req,res){
	Models.user.find(req.query,function(err,data){
		return res.json(data);
	})
});

router.post('/',function(req, res) {
    if(!req.body.email || !req.body.password)
        return res.status(400).json({message : 'email And password required'});

    req.body.email.toLowerCase();
    Models.user.create(req.body, function(err, data) {
        if (err)
            return res.status(500).json(err);
        return res.status(201).json(data);
    });
});



router.put('/:id',function(req,res){
	Models.user.findOne({_id : req.params.id},function(err,user){
		if(err)
			return res.status(500).json(err);
		if(!user)
			return res.status(400).json({message : 'user does not exist'});

		user[req.body.key] = req.body.value;
		user.save((err)=> {
			if(err)
				return res.status(500).json(err);
			return res.status(202).json(user);
		})
	});
});

router.delete('/:id',function(req,res){
	Models.user.remove({_id : req.params.id},function(err,result){
		if(err)
			return res.status(500).json(err);
		return res.json(result);
	});
});

module.exports = router;
