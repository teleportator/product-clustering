var requirejs = require("requirejs");

requirejs.config({ nodeRequire: require });

requirejs(
	['express', "./modules/cluster", "./modules/distance", "./modules/array-extensions"],
	function(express, cluster, distance, arrayExtensions) {
		var express = require('express');
		var app = express();

		app.configure(function(){
			app.use(express.responseTime())
			app.use(express.bodyParser());
		});

		app.get('/', function(req, res){
		  res.send('hello world');
		});
		app.post('/', function(req, res){
			var data = req.body.data,
					columns = req.body.columns,
					euclideanDistance, attributes, attributeFactory, row,
					clusters;

			if (data && columns) {
				row = data[0];
				attributeFactory = new cluster.AttributeFactory();
				attributes = arrayExtensions.select(columns, function(column) {
					return attributeFactory.create(column, typeof row[column]);
				});
				euclideanDistance = new distance.EuclideanDistance(attributes);
				clusters = new cluster.DBSCANAlgorithm(data, euclideanDistance, 0.15, 2).cluster();
				res.send(clusters);
			} else {
				res.send(400);
			}
		});

		app.listen(1337);	
	}
);