var should = require("should")
  , iconv = require('iconv-lite')
  , async = require('async')
var AsyncRequest = require('../async-request')
  , Channelmgr = require('../channelmgr')

describe('Channelmgr', function(){
	it('select a domain,do nothing', function(endIt){
		this.timeout(150000);
		 var domain = 'baidu.com'
         Channelmgr.select(domain,function(err,oCell){
			 console.log('oCell:',JSON.stringify(oCell))
	         endIt()
         })
         
	})
	it('receive,no error', function(endIt){
		this.timeout(150000);
		 var domain = 'baidu.com'
         Channelmgr.select(domain,function(err,oCell){
			 console.log('select:',JSON.stringify(oCell))
			 Channelmgr.receive(null,oCell.host,oCell.port,oCell.level,function(err,oCell){
				 console.log('receive:',JSON.stringify(oCell))
		         endIt()
	         })
         })
	})
	it('receive,no error,5times', function(endIt){
		this.timeout(150000);
		 var domain = 'baidu.com'
		 var tasks = [];
		 for (var i = 0; i < 15; i++) {
	         tasks.push(i)
	     }
	     
     	Channelmgr.select(domain,function(err,oCell){
			console.log('select:',JSON.stringify(oCell))
			async.concatSeries(tasks,function(i,cb){
				 Channelmgr.receive(null,oCell.host,oCell.port,oCell.level,function(err){
			         cb()
		         })
	        },function(err,rets){
		     	endIt()
		    })
         })
	})
	it('receive,with error,5times', function(endIt){
		this.timeout(150000);
		 var domain = 'baidu.com'
		 var tasks = [];
		 for (var i = 0; i < 15; i++) {
	         tasks.push(i)
	     }
	     
     	Channelmgr.select(domain,function(err,oCell){
			console.log('select:',JSON.stringify(oCell))
			async.concatSeries(tasks,function(i,cb){
				 Channelmgr.receive({},oCell.host,oCell.port,oCell.level,function(err){
			         cb()
		         })
	        },function(err,rets){
		     	endIt()
		    })
         })
	})
});