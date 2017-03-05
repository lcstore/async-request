var levelup = require('level')
  , db = levelup('./channelDB')
  , should = require("should")

  describe('LevelDB', function(){
 //  	it('Put and Get', function(endIt){
 //  		var key = 'key1';
	// 	db.put(key,'1',function(err){
 //           console.log('err:'+err)
 //           db.get(key, function (err, value) {
	// 	    if (err) return console.log('Ooops!', err) // likely the key was not found
	// 	    // ta da!
	// 	    console.log('key='+key+',value=' + value)
	// 	    endIt();
	// 	  })
	// 	})
	// })

	// it('Put and Del', function(endIt){
 //  		var key = 'keyDel';
	// 	db.put(key,'1',function(err){
 //           console.log('err:'+err)
 //           db.get(key, function (err, value) {
	// 	    if (err) return console.log('Ooops!', err) // likely the key was not found
	// 	    // ta da!
	// 	    console.log('key='+key+',value=' + value)
	// 	    db.del(key, function (err) {
	// 		  if (err){
	// 		  	console.warn('del:'+key+',cause:'+err)
	// 		  }
	// 		  console.log('del success,to get value')
	// 		  db.get(key,function(err,value){
	// 		  	(err.type).should.eql('NotFoundError')
	// 		  	console.log('value not exist')
	// 		  	endIt();
	// 		  })
	// 		});
		    
	// 	  })
	// 	})
	// })
	// it('batch Put and Read', function(endIt){
	//   	db.batch()
	// 	  .put('k2', '16 February 1941')
	// 	  .put('k3', 'Kim Young-sook')
	// 	  .put('z8', 'Kim Young-sook')
	// 	  .put('d4', 'Clown')
	// 	  .write(function () { 
	// 	  	console.log('Done!') 
	// 	  	var options = {};
	// 	  	options.gt = 'cl.0.0.'
	// 	  	// options.gt = 'cp.85.12345'
	// 	  	// options.lt = 'k3'
	// 	  	options.limit = 100;

	// 	  	db.createReadStream(options)
	// 		  .on('data', function (data) {
	// 		    console.log(data.key, '=', data.value)
	// 		  })
	// 		  .on('error', function (err) {
	// 		    console.log('Oh my!', err)
	// 		  })
	// 		  .on('close', function () {
	// 		    console.log('Stream closed')
	// 		    endIt();
	// 		  })
	// 		  .on('end', function () {
	// 		    console.log('Stream ended')
	// 		  })
	//  })})
	// it('batch  Read', function(endIt){
	// 	  	var options = {};
	// 	  	options.gt = 'cl.1.80.2016916528'
	// 	  	// options.gt = 'cp.85.12345'
	// 	  	// options.lt = 'cl.2'
	// 	  	options.limit = 100;
 //            var count = 0;
	// 	  	db.createReadStream(options)
	// 		  .on('data', function (data) {
	// 		  	count++
	// 		    console.log(data.key, '=', data.value)
	// 		  })
	// 		  .on('error', function (err) {
	// 		    console.log('Oh my!', err)
	// 		  })
	// 		  .on('close', function () {
	// 		    console.log('Stream closed')
	// 		    endIt();
	// 		  })
	// 		  .on('end', function () {
	// 		    console.log('Stream ended,count:'+count)
	// 		  })
	//   })

	it('get key', function(endIt){
		  var key = 'cl.1.80.2016916528'
	      db.get(key, function (err, value) {
		    console.log('key='+key+',value=' + value)
		    endIt();
		  })
	  })

  });