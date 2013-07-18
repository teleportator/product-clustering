define(["./array-extensions"], function(arrayExtensions) {
	return {
		Jaro: function() {
  	  this.score = function(first, second) {
  	  	var shorter, longer, halflength, m1, m2, transpositions, dist;

  	  	if (first.length > second.length) {
  	  		longer = first.toLowerCase();
  	  		shorter = second.toLowerCase();
  	  	} else {
  	  	  longer = second.toLowerCase();
  	  	  shorter = first.toLowerCase();
  	  	}

  	  	halflength = Math.floor(shorter.length / 2) + 1;

  	  	m1 = this.getSetOfMatchingCharacterWithin(shorter, longer, halflength);
  	  	m2 = this.getSetOfMatchingCharacterWithin(longer, shorter, halflength);

  	  	if (m1.length == 0 || m2.length == 0) {
  	  		return 0.0;
  	  	}
  	  	if (m1.length != m2.length) return 0.0;

  	  	transpositions = this.transpositions(m1, m2);

  	  	dist =
  	  	  (m1.length / shorter.length + m2.length / longer.length + (m1.length - transpositions) / m1.length) / 3.0;
        return dist;
  	  },
  	  this.getSetOfMatchingCharacterWithin = function(first, second, limit) {
  	  	var common = "", found, ch;
        for (var i = 0; i < first.length; i++) {
            ch = first.charAt(i);
            found = false;

            // See if the character is within the limit positions away from the original position of that character.
            for (var j = Math.max(0, i - limit); !found && j < Math.min(i + limit, second.length); j++) {
                if (second.charAt(j) == ch) {
                    found = true;
                    common += ch;
                    second.setCharAt(j,'*');
                }
            }
        }
        return common;
  	  },
  	  this.transpositions = function(first, second) {
  	  	var transpositions = 0;
        for (var i = 0; i < first.length; i++) {
            if (first.charAt(i) != second.charAt(i)) {
                transpositions++;
            }
        }
        transpositions /= 2;
        return transpositions;
  	  }
  	},
  	Levenstein: function() {
      var computeDistance = function(first, second){
      	var n = first.length,
      	    m = second.length,
      	    cost = 0,
      	    distance = [],
      	    row, i, j;

      	if (n == 0) return m;
      	if (m == 0) return n;

      	for (i = 0; i <= n; i++) {
      		distance.push([]);
      		for (j = 0; j <= m; j++){
      			distance[i].push(0);
      		}
      	};

      	for (i = 0; i <= n; distance[i][0] = i++);
      	for (i = 0; i <= m; distance[0][i] = i++);

      	for (i = 1; i <= n; i++){
      		for (j = 1; j <= m; j++){
      			cost = second.substr(j - 1, 1) == first.substr(i - 1, 1) ? 0 : 1;
      			distance[i][j] = Math.min(distance[i - 1][j] + 1, distance[i][j - 1] + 1, distance[i - 1][j - 1] + cost);
      		}
      	}

      	return distance[n][m];
      };

  	  this.score = function(first, second) {
  	  	var dis = computeDistance(first.toLowerCase(), second.toLowerCase());
      var maxLen = first.length;
      if (maxLen < second.length)
      maxLen = second.length;
      if (maxLen == 0) {
        return 1;
      }

      return 1 - dis/maxLen;
  	  }
  	},
    EuclideanDistance: function(attributes) {
      this.getDistance = function(first, second) {
        var distances;

        distances = arrayExtensions.select(attributes, function(a) { return a.getDistance(first[a.name], second[a.name]);});
        return Math.sqrt(arrayExtensions.aggregate(distances, 0, function(accumulate, d) {return accumulate + d*d;}));
      };
    }
	};
})