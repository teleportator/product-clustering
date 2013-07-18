define({
	NDimentionArray: function(seed) {
    this.create = function() {
      var dimentions = arguments.length,
          result = [],
          length = arguments[0],
          index;

      if (dimentions == 0) {
        return seed;
      }    
      
      for (index = 0; index < length; index++) {
        result.push(this.create.apply(this, Array.prototype.slice.call(arguments, 1, dimentions)));
      }

      return result;
    };
  }
});