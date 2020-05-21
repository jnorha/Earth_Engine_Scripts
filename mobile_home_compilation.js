//// Test Polygon /////////
var test_site_01 = ee.Geometry.Rectangle([-103.86987851973656, 40.29447137720893, -103.70542692061547 
, 40.187284626848566]);

var test_site_02 = ee.Geometry.Rectangle([-104.88178817679801, 39.775329359494734, -105.06100265433707 
, 39.88527260160156]);

Map.addLayer(test_site_01, {}, 'test site 1');
Map.addLayer(test_site_02, {color: '#33a9d6'}, 'test site 2');

////// Satellite and Aerial Images  ////////////////


function maskL8sr(image) {
  // Bits 3 and 5 are cloud shadow and cloud, respectively.
  var cloudShadowBitMask = (1 << 3);
  var cloudsBitMask = (1 << 5);
  // Get the pixel QA band.
  var qa = image.select('pixel_qa');
  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
                 .and(qa.bitwiseAnd(cloudsBitMask).eq(0));
  return image.updateMask(mask);
}

var L8_dataset = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
                  .filterDate('2019-01-01', '2019-12-31')
                  .map(maskL8sr);

var visParams = {
  bands: ['B4', 'B3', 'B2'],
  min: 0,
  max: 3000,
  gamma: 1.4,
};

var landsat_clipped = L8_dataset.median().clip(Colorado);

//Map.addLayer(landsat_clipped, visParams, 'L8');

var s2_dataset = ee.ImageCollection("COPERNICUS/S2_SR").filterDate('2019-04-01', '2019-07-30');

var s2_dataset_AT = ee.ImageCollection('COPERNICUS/S2')
                  .filterDate('2018-01-01', '2018-06-30')
                  // Pre-filter to get less cloudy granules.
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20));

var s2_image = s2_dataset.median().select(['B4', 'B3', 'B2']);
var s2_image_at = s2_dataset_AT.median().select(['B4', 'B3', 'B2']);

var sentParams = {
  bands: ['B4', 'B3', 'B2'],
  min: 100,
  max: 3000

};

var sentRedParams = {
  bands: ['B7', 'B6', 'B5']
};


var sentinal_clipped = s2_dataset.median().clip(test_site_01);
var sentinal_clipped_AT = s2_dataset_AT.median().clip(test_site_01);

var sentinal_clipped_enc = s2_dataset.median().clip(test_site_02);


Map.addLayer(sentinal_clipped_enc, sentParams, 'sent2');


/// Exploring sentinel reflectances
// Map.addLayer(sentinal_clipped, sentRedParams, 'sent2 red edge 3, 2, 1');
// Map.addLayer(sentinal_clipped, {bands: ['B8']}, 'Sent2 NIR');
// Map.addLayer(sentinal_clipped, {bands: ['B8A']}, 'Sent2 REd Edge 4');
// Map.addLayer(sentinal_clipped, {bands: ['B11']}, 'Sent2 SWIR1');
// Map.addLayer(sentinal_clipped, {bands: ['B11']}, 'Sent2 SWIR2');


var naip_dataset = ee.ImageCollection('USDA/NAIP/DOQQ')
                  .filter(ee.Filter.date('2017-01-01', '2018-12-31'));
                  
var trueColor = naip_dataset.select(['R', 'G', 'B']);
var training_NAIP = naip_dataset.select(['R', 'G', 'N']);


var naip_image = trueColor.reduce(ee.Reducer.median()).clip(test_01);
var naip_image_02 = training_NAIP.reduce(ee.Reducer.median()).clip(test_01);

var trueColorVis = {
  min: 0.0,
  max: 255.0,
};

var naip_clipped = trueColor.mean().clip(test_site_01);

//Map.addLayer(naip_clipped, trueColorVis, 'Naip 2018');

var naip_red = naip_dataset.select(['R']);

var threshParams = {
  min:150,
  max:255.0
};

var red_median = naip_red.reduce(ee.Reducer.median());
var red_select = red_median.select('R_median');

var red_lowpass = naip_red.mean().gt(206).clip(test_site_01);
var red_highpass = naip_red.mean().gt(220).clip(test_site_01);

// var mh_reflectance = red_select.expression(
//     '190 < RED < 225', {
//       'RED': naip_red.select(['R']).mean(),
// });

var mobile_reflectance = red_lowpass.expression(
  'Lowpass - Highpass', {
    'Lowpass': red_lowpass,
    'Highpass': red_highpass
  });


// Map.addLayer(naip_red.mean().clip(Colorado), threshParams, "NAIP red");
// Map.addLayer(red_highpass, [], "NAIP high lim red");
// Map.addLayer(red_lowpass, [], "NAIP low lim red");
// Map.addLayer(mobile_reflectance, [], 'Mobile Reflectance');


// Map.addLayer(adams_county_mhp, {color: '#f0eba8'}, 'adams parks');
// Map.addLayer(mhp_points_2018, {color: '#f50565'}, 'US MHP points');

// Export the image, specifying scale and region. // 
// Export.image.toDrive({
//   image: naip_image,
//   description: 'NaipToDriveExample',
//   scale: 1,
//   region: test_01,
//   maxPixels: 1e13
// });

// Export.image.toDrive({
//   image: sentinal_clipped,
//   description: 'S2ToDriveExample',
//   scale: 10,
//   region: test_01
// });

//print(trueColor)


/// Training polygons ////
Map.addLayer(mhp_uspoints, {color: 'red'}, 'Mobile HP Points');

var train_poly = ee.FeatureCollection([
  // ee.Feature(mhp, {'class': 0}),
  ee.Feature(mhp_02, {'class': 0}),
  // ee.Feature(not_mhp, {'class': 1}),
  ee.Feature(not_mhp_02, {'class': 1})
  ]);

var sent_bands_enc = sentinal_clipped_enc.select('B4', 'B8', 'B11', 'B5', 'B3', 'B2');
var sent_bands_AT = sentinal_clipped_AT.select('B4', 'B3', 'B2');

// Export.image.toDrive({
//   image: sent_bands_enc,
//   description: 'S2ToDriveExample',
//   scale: 10,
//   region: test_site_02
// });


var training = sent_bands_enc.sampleRegions({
  collection: train_poly,
  properties: ['class'],
  scale: 10,
  tileScale: 3
});

var cluster_training = sent_bands_enc.select('B4', 'B3', 'B2').sample({
  region: geometry,
  scale: 100,
  numPixels: 1e8
});



var RF_training = sent_bands_enc.sample({
  numPixels: 5000,
  seed: 0,
  scale: 10,
  tileScale: 3
});

var training_02 = naip_image_02.sampleRegions({
  collection: train_poly,
  properties: ['class'],
  scale: 4,
  tileScale: 16
});


var svm_classifier_01 = ee.Classifier.svm({
  kernelType: 'RBF',
  gamma: 0.5,
  cost: 10,
});

/// cluster classifier /// 

// Instantiate the clusterer and train it.
var clusterer = ee.Clusterer.wekaKMeans(3).train(cluster_training);

// Cluster the input using the trained clusterer.
var clustresult = sent_bands_enc.cluster(clusterer);

var training_clus = clustresult.sampleRegions({
  collection: train_poly,
  properties: ['class'],
  scale: 10,
  tileScale: 3
});

var trained_svm_clust = svm_classifier_01.train(training_clus, 'class');

var svm_classified_02 = clustresult.classify(trained_svm_clust);

// Display the clusters with random colors.
//Map.addLayer(svm_classified_02, {}, 'cluster classified');



var RF_classifier = ee.Classifier.smileRandomForest(10)
    .train({
      features: RF_training,
      classProperty: 'class',
      inputProperties: ['B2', 'B3', 'B4']
    });

//Try running it with only red 
var trained_svm_01 = svm_classifier_01.train(training, 'class', ['B4', 'B3', 'B2', 'B5']);

var trained_svm_naip = svm_classifier_01.train(training_02, 'class', ['R_median', 'N_median', 'G_median']);

var svm_classified_01 = sent_bands_enc.classify(trained_svm_01);
var svm_classified_01_naip = naip_image_02.classify(trained_svm_naip);

var rf_classified_01 = sent_bands_enc.classify(RF_classifier);

//Map.addLayer(svm_classified_01.clip(test_site_02), {min:0, max: 1, palette: ['red', 'tan']}, 'Mobile Home Parks SVM Sent');
// Map.addLayer(rf_classified_01, {min:0, max: 1, palette: ['red', 'tan']}, 'Mobile Home Parks RF Sent ATM');

///// Test area 01 worked well at correctly identifying training polygons, time to try and apply model to new area with known MHPs ///
/// upload Adams county asset and test classification of S2 surface reflectance in greater adams area using model_01


/// put sentinel/NAIP vis on new test area // 
var sentinal_clipped_02_AT = s2_dataset_AT.median().clip(test_site_02);
var sent_bands_02 = sentinal_clipped_02_AT.select('B4', 'B8', 'B11', 'B5');
// var naip_bands_02 = training_NAIP.reduce(ee.Reducer.median()).clip(test_02); 

//Map.addLayer(sentinal_clipped_02_AT, sentParams, 'S2 Test area 2');

// apply trained classifier to new area and display // 

var svm_classified_02 = sent_bands_02.classify(trained_svm_01);
// var svm_classified_02_naip = naip_bands_02.classify(trained_svm_naip);

// Map.addLayer(svm_classified_02, {min:0, max: 1, palette: ['red', 'tan']}, 'Mobile Home Parks SVM Area 2 Sent ATM');


/// clusters to vectors /// 

var desired_clusters = clustresult.select('cluster').gt(0).lt(1);
var image1 = ee.Image(1);

var cluster_to_vector = image1.subtract(desired_clusters);

//Map.addLayer(cluster_to_vector, {}, 'desired Clusters');


var vectors = cluster_to_vector.updateMask(cluster_to_vector)
      .reduceToVectors({
        reducer: ee.Reducer.countEvery(), 
        geometry: test_site_02, 
        scale: 10,
        maxPixels: 1e8});

// Map.addLayer(vectors, {}, 'cluster vectors');

var mobile_poly_01 = vectors.filter(ee.Filter.gt('count', 3));
var desired_vectors = mobile_poly_01.filter(ee.Filter.lt('count', 30));

//Map.addLayer(desired_vectors, {color: 'green'}, 'desired vectors');

// needs to be last to have polys on top of scene
Map.addLayer(adams_mhps, {color: 'blue'}, 'Adams Mobile HOMEPARKS');




// // Export an ee.FeatureCollection as an Earth Engine asset.
// Export.table.toAsset({
//   collection: mhp,
//   description:'exportToTableAssetExample',
//   assetId: 'mhp',
// });

// // Export an ee.FeatureCollection as an Earth Engine asset.
// Export.table.toAsset({
//   collection: not_mhp,
//   description:'exportToTableAssetExample',
//   assetId: 'not_mhp',
// });
