define(["./array-extensions"], function(arrayExtensions) {
  return new function() {
    var that = this;

    this.Jaro = function() {
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
  	};
  	this.Levenstein = function() {
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
  	};
    this.EuclideanDistance = function(attributes) {
      var query = arrayExtensions.query;

      this.getDistance = function(first, second) {
        var length = attributes.length,
            distances;

        distances = query.select(attributes, function(a) { return a.getDistance(first[a.name], second[a.name]);});
        return Math.sqrt(query.aggregate(distances, 0, function(accumulate, d) {return accumulate + d*d;}));
      };
    };
    this.Attribute = function(name, func) {
      this.name = name;
      this.getDistance = func;
    };
    this.DBSCANAlgorithm = function(points, distance, eps, minPoints) {
      var CLUSTER_ID_NOISE = -1,
          CLUSTER_ID_UNCLASSIFIED = 0,
          nextClusterId = 1,
          clusters = [],
          adjacencyMatrix;

      this.cluster = function() {
        var clusterId = getNextClusterId(),
            allClusters = [],
            isClusterCreated,
            label,
            cPoints;
        
        for (i in points) {
          if (isUnclassified(points[i]) ) {
            isClusterCreated = createCluster(points[i], clusterId);

            if (isClusterCreated) {
                // Generate id for the next cluster                    
                clusterId = getNextClusterId();
            }
          }
        }
        
        // Convert sets of points into clusters...        
        for (i in clusters) {
          label = i.toString();
          cPoints = clusters[i];
            
          if (cPoints != null && cPoints.length > 0) {            
            allClusters.push(cPoints);
          }
        }
        
        return allClusters;
      };

      var createCluster = function(p, clusterId) {
        var isClusterCreated = false,
            nPoints = findNeighbors(p, eps),
            nPoint,
            nnPoint,
            nnPoints;

        if (nPoints.length < minPoints) {
          // Assign point into "Noise" group.
          // It will have a chance to become a border point later on.
          assignPointToCluster(p, CLUSTER_ID_NOISE);

          // return false to indicate that we didn't create any cluster
          isClusterCreated = false;        
        } else {          
           // All points are reachable from the core point...
          assignPointsToCluster(nPoints, clusterId);
          
          // Remove point itself.
          var index = nPoints.indexOf(p);
          nPoints.splice(index, 1);
          
          // Process the rest of the neighbors...
          while (nPoints.length > 0) {
              // pick the first neighbor
            nPoint = nPoints.pop();
            
            // process neighbor
            nnPoints = findNeighbors(nPoint, eps);
            
            if (nnPoints.length >= minPoints) {
              // nPoint is another core point.  
              for (var nn_i in nnPoints ) {
                nnPoint = nnPoints[nn_i];
                if (isNoise(nnPoint)) {                    
                  /* It's a border point. We know that it doesn't have 
                     * enough neighbors to be a core point. Just add it 
                     * to the cluster.
                     */
                  assignPointToCluster(nnPoint, clusterId);              
                } else if (isUnclassified(nnPoint)) {                
                    /*
                   * We don't know if this point has enough neighbors
                   * to be a core point... add it to the list of points
                   * to be checked.
                   */
                  nPoints.push(nnPoint);
                  /*
                   * And assign it to the cluster
                   */
                  assignPointToCluster(nnPoint, clusterId);
                }
              }
            } else {
                // do nothing. The neighbor is just a border point.
            }
          }        
          // return true to indicate that we did create a cluster
          isClusterCreated = true;
        }

        return isClusterCreated;
      };

      var findNeighbors = function(p, threshold) {
        var neighbors = [],
            i = points.indexOf(p);

        for (var j = 0, n = points.length; j < n; j++) {
            if (adjacencyMatrix[i][j] <= threshold) {
                neighbors.push(points[j]);
            }
        }
        return neighbors;
      };

      var init = function(points) {
        for (var index in points) {
            // Assign all points into "Unclassified" group
            assignPointToCluster(points[index], CLUSTER_ID_UNCLASSIFIED);
        }
      };

      var calculateAdjacencyMatrix = function(distance, points) {
        var n = points.length,
            nDimentionArray = new arrayExtensions.NDimentionArray(0), 
            matrix;

        console.log("calculating adjacency matrix...");
        matrix = nDimentionArray.create(n, n);
        for(var i = 0; i < n; i++) {
          for(var j = i + 1; j < n; j++) {
            matrix[i][j] = distance.getDistance(points[i], points[j]);
            matrix[j][i] = matrix[i][j];
          }
          matrix[i][i] = 0.0;
          console.log(Math.ceil(i / n * 100) + "% completed.");
        }
        console.log("calculating adjacency matrix completed.");
        return matrix;
      };

      var removePointFromCluster = function(point, clusterId) {
        var removed = false,
            points = clusters[clusterId],
            index;

        if (points != undefined) {
          if ((index = points.indexOf(point)) != -1) {
            points.splice(index, 1);
            removed = true;
          }
        }

        return removed;
      };

      var assignPointsToCluster = function(points, clusterId) {
        for (var i in points) {
              assignPointToCluster(points[i], clusterId);
          }
      };

      var assignPointToCluster = function(point, clusterId) {
        var points;

        // Remove point from the group that it currently belongs to...
        if (isNoise(point)) {
          removePointFromCluster(point, CLUSTER_ID_NOISE);
        } else if (isUnclassified(point)) {
          removePointFromCluster(point, CLUSTER_ID_UNCLASSIFIED);
        } else {
          if (clusterId != CLUSTER_ID_UNCLASSIFIED) {
            throw new that.RuntimeException(
                      "Trying to move point that has already been" + 
                      " assigned to some other cluster. Point: " + point + ", clusterId=" + clusterId);
          }
          else {
              // do nothing. we are registering a brand new point in UNCLASSIFIED set.
          }
        }
        
        points = clusters[clusterId];
        if (points == undefined) {
          points = [];
          clusters[clusterId] = points;
        }
        points.push(point);
      };

      var isPointInCluster = function(point, clusterId) {
          var inCluster = false,
              points = clusters[clusterId];

          if (points != undefined) {
            inCluster = points.indexOf(point) != -1;
          }

          return inCluster;
      }

      var isUnclassified = function(point) {
        return isPointInCluster(point, CLUSTER_ID_UNCLASSIFIED);
      } 

      var isNoise = function(point) {
        return isPointInCluster(point, CLUSTER_ID_NOISE);
      };

      var getNextClusterId = function() {
        return nextClusterId++;
      };

      init(points);
      adjacencyMatrix = calculateAdjacencyMatrix(distance, points);
    };

    this.RuntimeException = function(message) {
      this.message = message;
    };
  };
});