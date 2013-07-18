define(["./array", "./exceptions", "./distance"], function(array, exceptions, distance) {
  return new function() {
    var that = this;

    this.AttributeFactory = function() {
      var levenstein = new distance.Levenstein(),
          distanceMap = {
            "string": function(first, second) { return 1 - levenstein.score(first, second); },
            "number": function(first, second) { return first == second ? 0 : 1; }
          };

      this.create = function(name, type) {
        return new that.Attribute(name, distanceMap[type]);
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
            nDimentionArray = new array.NDimentionArray(0), 
            matrix;

        matrix = nDimentionArray.create(n, n);
        for(var i = 0; i < n; i++) {
          for(var j = i + 1; j < n; j++) {
            matrix[i][j] = distance.getDistance(points[i], points[j]);
            matrix[j][i] = matrix[i][j];
          }
          matrix[i][i] = 0.0;
        }
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
            throw new exceptions.RuntimeException(
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
  };
});