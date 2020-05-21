//create area and original image

var visParams = {bands:['B4', 'B3', 'B2'], max:0.3};
var nirParams = {bands:['B5', 'B4', 'B3'], max:0.3};
// var improvParams = {bands:['B4', 'B3', 'B2'], gain:0.2};

var raw_landsat14 = landsat8_raw.filterBounds(new_zealand2)
                              .filterDate('2014-01-01', '2014-03-30')
                              .min();
// print(landsat8_raw.filterBounds(new_zealand2).filterDate('2014-01-01', '2014-01-26'));                              
                              
var raw_landsat15 = landsat8_raw.filterBounds(new_zealand2)
                              .filterDate('2015-01-01', '2015-03-30')
                              .min();
                              
var raw_landsat18 = landsat8_raw.filterBounds(new_zealand2)
                              .filterDate('2018-01-01', '2018-03-30')
                              .min();
                              
// // Create a cloud-free, most recent value composite.
// var recentValueComposite = raw_landsat_cloud.qualityMosaic('system:time_start');

// // Create a greenest pixel composite.
// var greenestPixelComposite = raw_landsat_cloud.qualityMosaic('nd');

var clipped_area14 = raw_landsat14.clip(new_zealand2);
var clipped_area15 = raw_landsat15.clip(new_zealand2);
var clipped_area18 = raw_landsat18.clip(new_zealand2);

// Map.addLayer(raw_landsat_cloud, visParams, 'all_time_true_color');
// Map.addLayer(recentValueComposite, visParams, 'true_col');
// Map.addLayer(greenestPixelComposite, nirParams, 'NIR');

// Map.addLayer(clipped_area, visParams, 'true_col');

// Map.addLayer(clipped_area, visParams, 'unfiltered');

//NDVI
//Define three different NDVI function for LANDSAT
function NDVI_V1(img) {
 var nir = img.select("B5");
 var red = img.select("B4");
 var ndvi = nir.subtract(red).divide(nir.add(red));
 return ndvi;
}

function EVI_V2(img) {
 var nir = img.select("B5");
 var red = img.select("B4");
 var green = img.select("B2");
 var blue = img.select("B3");
 var swir = img.select("B6");
 var evi = img.expression(
   "(2.5) * ((B5 - B4)/(B5 + 6 * B4 - (7.5) * B2 + 1))",
   {
     "B5": nir,
     "B4": red,
     "B2": green
   }
 );
 return evi;
}

function SAVI_V3(img) {
 var nir = img.select("B5");
 var red = img.select("B4");
 var green = img.select("B2");
 var blue = img.select("B3");
 var swir = img.select("B6");
 var savi = img.expression(
   "((B5 - B4)/(B5 + B4 + (0.5))) * (1.5)",
   {
     "B5": nir,
     "B4": red
   }
 );
 return savi;
}

//Calculate NDVI
var ndvi14 = NDVI_V1(clipped_area14);
var ndvi15 = NDVI_V1(clipped_area15);
var ndvi18 = NDVI_V1(clipped_area18);

Map.addLayer(clipped_area14, nirParams, 'NIR 14');
Map.addLayer(clipped_area15, nirParams, 'NIR 15');
Map.addLayer(clipped_area18, nirParams, 'NIR 18');

// var evi = EVI_V2(clipped_area);
// var savi = SAVI_V3(clipped_area);

//Define visualization parameters, range of NDVI is -1 to 1

var NDVIParam = {
 min: -0.2,
 max: 0.8,
 palette: 'FFFFFF, CE7E45, DF923D, F1B555, FCD163, 99B718, 74A901, 66A000, 529400,' +
   '3E8601, 207401, 056201, 004C00, 023B01, 012E01, 011D01, 011301'
};

var EVIParam = {
 min: -0.2,
 max: 0.8,
 palette: 'FFFFFF, CE7E45, DF923D, F1B555, FCD163, 99B718, 74A901, 66A000, 529400,' +
   '3E8601, 207401, 056201, 004C00, 023B01, 012E01, 011D01, 011301'
};

var SAVIParam = {
 min: -0.2,
 max: 0.8,
 palette: 'FFFFFF, CE7E45, DF923D, F1B555, FCD163, 99B718, 74A901, 66A000, 529400,' +
   '3E8601, 207401, 056201, 004C00, 023B01, 012E01, 011D01, 011301'
};

//show images
Map.addLayer(clipped_area14, visParams, "Raw_landsat_minvalues_14");
Map.addLayer(clipped_area15, visParams, "Raw_landsat_minvalues_15");
Map.addLayer(clipped_area18, visParams, "Raw_landsat_minvalues_18");
// Map.addLayer(ndvi14, NDVIParam, "ndvi_14", false);
// Map.addLayer(ndvi15, NDVIParam, "ndvi_15", false);
// Map.addLayer(ndvi18, NDVIParam, "ndvi_18", false);
// Map.addLayer(evi, EVIParam, "evi", false);
// Map.addLayer(savi, SAVIParam, "savi", false);
// Map.centerObject(new_zealand, 9);

//
//--------Analyze the NDVI values of images--------//
// var ndvi_list = L8.filterDate("2016-01-01", "2016-03-30")
//                   .map(function(image) {
//   //cloud mask of landsat8
//   var cloud = ee.Algorithms.Landsat.simpleCloudScore(image).select("cloud");
//   var mask = cloud.lte(20);
//   var ndvi = image.normalizedDifference(['B5', 'B4']).rename('NDVI');
//   return image.addBands(ndvi).updateMask(mask);
// });


// //show NDVI in every image
// var chart1 = ui.Chart.image.series({
// //Image collection
// imageCollection: ndvi_list.select('NDVI'),
// //region of interest
// region: new_zealand,
// //Calculate the mean value
// reducer: ee.Reducer.mean(),
// //resolution
// scale: 30
// }).setOptions({title: 'NDVI IMAGE SERIES'});
// print(chart1);


// //show NDVI values in every day
// var chart2 = ui.Chart.image.doySeries({
// imageCollection: ndvi_list.select('NDVI'),
// region: new_zealand,
// regionReducer: ee.Reducer.mean(),
// scale:30
// }).setOptions({title: "ROI NDVI EACH DAY SERIES"});
// print(chart2);


//-------------------- Unsupervised Classification ------------------//

// var input = clipped_area;

// var region = sample_area

// var training_unclass = input.sample({
//   region: region,
//   scale:30,
//   numPixels: 5000
// });

// var clusterer = ee.Clusterer.wekaKMeans(5).train(training_unclass);

// // Cluster the input using the trained clusterer.
// var result = input.cluster(clusterer);

// // Display the clusters with random colors.
// Map.addLayer(result.randomVisualizer(), {}, 'clusters');


//-------------------Supervised Classification--------------------//

//merge classes into one feature colleciton of values; 0-water 1-NonForest 2-Forest

var landsatCollection = landsat8_raw.filterBounds(new_zealand)
                              .filterDate('2016-01-01', '2016-03-30');

// // Make a cloud-free composite.
// var cloudless2 = ee.Algorithms.Landsat.simpleComposite({
//   collection: landsatCollection,
//   asFloat: true
// });

var trainingpts = water_training.merge(Forest_training).merge(Non_forest_training);

var trainingpoly = ee.FeatureCollection([
  ee.Feature(svm_water),
  ee.Feature(svm_forest),
  ee.Feature(svm_non_forest)
]);

print(trainingpts, 'training collection');

var bands = ['B2', 'B3', 'B4', 'B5', 'B6', 'B7'];

var poly_values14 = raw_landsat14.sampleRegions({
  collection: trainingpoly,
  properties: ['landcover'],
  scale: 30
});

var poly_values15 = raw_landsat15.sampleRegions({
  collection: trainingpoly,
  properties: ['landcover'],
  scale: 30
});

var poly_values18 = raw_landsat18.sampleRegions({
  collection: trainingpoly,
  properties: ['landcover'],
  scale: 30
});



var training2_14 = clipped_area14.select(bands).sampleRegions({
  collection: trainingpts,
  properties: ['landcover'],
  scale: 30
});

var training2_15 = clipped_area15.select(bands).sampleRegions({
  collection: trainingpts,
  properties: ['landcover'],
  scale: 30
});

var training2_18 = clipped_area18.select(bands).sampleRegions({
  collection: trainingpts,
  properties: ['landcover'],
  scale: 30
});

var svm_classifier = ee.Classifier.svm({
  kernelType: 'RBF',
  gamma: 0.5,
  cost: 10
});


// var CARTtrained = ee.Classifier.cart().train(training2, 'landcover', bands);

// var CARTclassified = clipped_area.select(bands).classify(CARTtrained);

// Make a Random Forest classifier and train it.
// var classifier = ee.Classifier.randomForest().train({
//   features: training,
//   classProperty: 'landcover',
//   inputProperties: bands
// });

var classifier2_14 = ee.Classifier.randomForest().train({
  features: training2_14,
  classProperty: 'landcover',
  inputProperties: bands
});

var classifier2_15 = ee.Classifier.randomForest().train({
  features: training2_15,
  classProperty: 'landcover',
  inputProperties: bands
});

var classifier2_18 = ee.Classifier.randomForest().train({
  features: training2_18,
  classProperty: 'landcover',
  inputProperties: bands
});

var svmtrained_14 = svm_classifier.train(poly_values14, 'landcover', bands);
var svmtrained_15 = svm_classifier.train(poly_values15, 'landcover', bands);
var svmtrained_18 = svm_classifier.train(poly_values18, 'landcover', bands);


//var RF_classification = cloudless2.select(bands).classify(classifier);

var RF_classification2_14 = clipped_area14.select(bands).classify(classifier2_14);
var RF_classification2_15 = clipped_area15.select(bands).classify(classifier2_15);
var RF_classification2_18 = clipped_area18.select(bands).classify(classifier2_18);

var SVM_classified_14 = clipped_area14.classify(svmtrained_14);
var SVM_classified_15 = clipped_area15.classify(svmtrained_15);
var SVM_classified_18 = clipped_area18.classify(svmtrained_18);


var palette = [
  '0000FF', // non-forest (1)  // grey
  'D3D3D3', // water (0)  // blue
  '008000' //  forest (2) // green
];

//Map.addLayer(RF_classification, {min: 0, max: 2, palette: palette}, 'Land Use Classification');
Map.addLayer(RF_classification2_14 , {min: 0, max: 2, palette: palette}, 'Rand Forest 2014');
Map.addLayer(RF_classification2_15 , {min: 0, max: 2, palette: palette}, 'Rand Forest 2015');
Map.addLayer(RF_classification2_18 , {min: 0, max: 2, palette: palette}, 'Rand Forest 2018');

// Map.addLayer(CARTclassified, {min: 0, max: 1, palette: palette},
//   'CARTclassification');
Map.addLayer(SVM_classified_14, {min: 0, max: 2, palette: palette}, 'SVM 2014');
Map.addLayer(SVM_classified_15, {min: 0, max: 2, palette: palette}, 'SVM 2015');
Map.addLayer(SVM_classified_18, {min: 0, max: 2, palette: palette}, 'SVM 2018');

//___----------------------

//----------------Accuracy Assessment------------------//

// Create 1000 random points in the region.
var randomPoints = ee.FeatureCollection.randomPoints(new_zealand2);

var acc_training = trainingpts;

// var trainAccuracy = svmtrained_14.confusionMatrix();

// var testAccuracy = trainingpts.errorMatrix('landcover', 'classification');

// print('SVM error matrix: ', SVM_classified_14.confusionMatrix());
// print('SVM accuracy: ', SVM_classified_14.confusionMatrix().accuracy());

// Define a region of interest as a point.  Change the coordinates
// to get a classification of any place where there is imagery.
var roi = new_zealand2;

// Load Landsat 5 input imagery.
var input = raw_landsat14;
 

// Use MODIS land cover, IGBP classification, for training.
var modis = ee.Image('MODIS/051/MCD12Q1/2011_01_01')
    .select('Land_Cover_Type_1');

// Sample the input imagery to get a FeatureCollection of training data.
var training = input.addBands(modis).sample({
  numPixels: 5000,
  seed: 0,
  scale: 30,
  region: new_zealand2
});

// Make a Random Forest classifier and train it.
var classifier = ee.Classifier.randomForest(10)
    .train(training, 'Land_Cover_Type_1');

// Classify the input imagery.
var classified = input.classify(classifier);

// Get a confusion matrix representing resubstitution accuracy.
var trainAccuracy = classifier2_18.confusionMatrix();
print('Resubstitution error matrix: ', trainAccuracy);
print('Training overall accuracy: ', trainAccuracy.accuracy());

// // Sample the input with a different random seed to get validation data.
// var validation = input.addBands(modis).sample({
//   numPixels: 5000,
//   seed: 1
//   // Filter the result to get rid of any null pixels.
// }).filter(ee.Filter.neq('B1', null));

// // Classify the validation data.
// var validated = validation.classify(classifier);

// // Get a confusion matrix representing expected accuracy.
// var testAccuracy = validated.errorMatrix('Land_Cover_Type_1', 'classification');
// print('Validation error matrix: ', testAccuracy);
// print('Validation overall accuracy: ', testAccuracy.accuracy());

// Define a palette for the IGBP classification.
var igbpPalette = [
  'aec3d4', // water
  '152106', '225129', '369b47', '30eb5b', '387242', // forest
  '6a2325', 'c3aa69', 'b76031', 'd9903d', '91af40',  // shrub, grass
  '111149', // wetlands
  'cdb33b', // croplands
  'cc0013', // urban
  '33280d', // crop mosaic
  'd7cdcc', // snow and ice
  'f7e084', // barren
  '6f6f6f'  // tundra
];

// Display the input and the classification.
// Map.centerObject(roi, 10);
// Map.addLayer(input, {bands: ['B3', 'B2', 'B1'], max: 0.4}, 'landsat');
// Map.addLayer(classified, {palette: igbpPalette, min: 0, max: 17}, 'classification last');
    


/// ------------------- Calculating Dynamic forest change over 1 and 4 year intervals ---------------- //

var four_year_dif = SVM_classified_18.subtract(SVM_classified_14);
var one_year_dif = SVM_classified_15.subtract(SVM_classified_14);

Map.addLayer(four_year_dif, {min: -2, max: 2, palette: ['0000FF', 'FF0000', '808080', '00FF00', '000000'] }, 'Difference 4 years');
Map.addLayer(one_year_dif, {min: -2, max: 2, palette: ['0000FF', 'FF0000', '808080', '00FF00', '000000'] }, 'Difference 1 year');




//------------------exporting------------------//

// var meanDictionary = SVM_classified_14.reduceRegion({
//   reducer: ee.Reducer.mean(),
//   geometry: new_zealand2,
//   scale: 30,
//   maxPixels: 1e9
// });

// print(meanDictionary)

// Export.image.toDrive({
//   image:clipped_area14.select(['B4', 'B3', 'B2']),
//   description: 'True_col14',
//   scale: 30,
//   region: new_zealand2,
//   fileFormat: 'GeoTIFF',
//   maxPixels: 2104046364
// });

// Export.image.toDrive({
//   image:clipped_area15.select(['B4', 'B3', 'B2']),
//   description: '2015_truecol',
//   scale: 30,
//   region: new_zealand2,
//   fileFormat: 'GeoTIFF',
//   maxPixels: 2104046364
// });

// Export.image.toDrive({
//   image:clipped_area18.select(['B4', 'B3', 'B2']),
//   description: '2018_truecol',
//   scale: 30,
//   region: new_zealand2,
//   fileFormat: 'GeoTIFF',
//   maxPixels: 2104046364
// });

// Export.table.toDrive({
//   collection: trainingpts,
//   description:'ground_truth_data',
//   fileFormat: 'SHP'
// });

// Export.image.toDrive({
//   image:four_year_dif.toDouble(),
//   description: 'Four_Year_difference',
//   scale: 30,
//   region: new_zealand2,
//   fileFormat: 'GeoTIFF',
//   maxPixels: 2104046364
// });

// Export.image.toDrive({
//   image:one_year_dif.toDouble(),
//   description: 'One_Year_difference',
//   scale: 30,
//   region: new_zealand2,
//   fileFormat: 'GeoTIFF',
//   maxPixels: 2104046364
// });

//make a red boundary
var empty = ee.Image().toByte();
var outline = empty.paint({
 featureCollection:new_zealand,  // 
 color:0, //transparent
 width:3  //width
});
// Map.addLayer(outline, {palette: "ff0000"}, "outline");

// // show the default administrative region, color is blue
// Map.addLayer(new_zealand2, {color:"0000ff"}, "New Zealand", false);

// Map.addLayer(coastline, {}, 'Coastline');


// ----------------- Produce Charts to Show the magnitude of change ------------------- // 

// look at the different values of the change band 
print(ui.Chart.image.series(one_year_dif.select('classification'), sample_area, ee.Reducer.mean(), 30));
print(ui.Chart.image.series(four_year_dif.select('classification'), sample_area, ee.Reducer.mean(), 30));


