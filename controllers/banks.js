var express = require('express');
var router = express.Router();




router.post('/',function(req, res) {
    if(!req.body.title || !req.body.senderName || !req.body.phone)
        return res.status(400).json({message : 'senderName And phone required'});


    Models.banks.create({title : req.body.title, senderName : req.body.senderName, phone : req.body.phone}, function(err, data) {
        if (err)
            return res.status(500).json(err);
        return res.status(201).json(data);
    });
});


// router.get('/',function(req,res){

// })

module.exports = router;
