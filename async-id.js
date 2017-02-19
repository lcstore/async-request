exports.asyncId = (function(){
    var _id = 0;
    return {
    	get:function(){
    		return _id;
    	},
    	next:function(){
    		return ++_id;
    	}
    }
})();