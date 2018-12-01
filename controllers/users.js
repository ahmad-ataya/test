var express = require('express');
var router = express.Router();

router.get('/',function(req,res){
	Models.user.find(req.query,function(err,data){
		return res.json(data);
	})
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
