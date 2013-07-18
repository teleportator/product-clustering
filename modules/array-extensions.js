define({
	where: function(array, predicate) {
	  var index, result = [];
	  for (index in array) {
	    if (predicate(array[index], index)) {
	      result.push(array[index]);
	    }
	  }
	  return result;
	},
	select: function(array, selector) {
	  var index, result = [];
	  for (index in array) {
	    result.push(selector(array[index], index));
	  }
	  return result;
	},
	aggregate: function(array, seed, func) {
	  var index, result = seed;
	  for (index in array) {
	    result = func(result, array[index]);
	  }
	  return result;
	}
});