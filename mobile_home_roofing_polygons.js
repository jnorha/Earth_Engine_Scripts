//// Test Polygon /////////
var test_site_01 = ee.Geometry.Rectangle([-103.86987851973656, 40.29447137720893, -103.70542692061547 
, 40.187284626848566]);

var test_site_02 = ee.Geometry.Rectangle([-104.88178817679801, 39.775329359494734, -105.06100265433707 
, 39.88527260160156]);

//Map.addLayer(test_site_01, {}, 'test site 1');
//Map.addLayer(test_site_02, {color: '#33a9d6'}, 'test site 2');


////////////// Import NAIP and explore ////////////////////////

var naip_dataset = ee.ImageCollection('USDA/NAIP/DOQQ')
                  .filter(ee.Filter.date('2017-01-01', '2018-12-31'));
                  
var trueColor = naip_dataset.select(['R', 'G', 'B']);
var naip_dif = naip_dataset.select(['R', 'G', 'N']);


var naip_truecol = trueColor.reduce(ee.Reducer.median()).clip(test_site_02);
var naip_image_02 = naip_dif.reduce(ee.Reducer.median()).clip(test_site_02);

var trueColorVis = {
  bands: ['R_median', 'G_median', 'B_median'],
  min: 0.0,
  max: 255.0,
};

var emphVis = {
  bands: ['R_median', 'G_median', 'N_median'],
  min: 0.0,
  max: 255.0,
};


Map.addLayer(naip_truecol, trueColorVis, 'Naip 2018');
Map.addLayer(naip_image_02, emphVis, 'Naip ref 2018');

// SAVI exploration // 

var naip_savi = naip_truecol.expression(
  '((Red - Green)/(Red + Green + 0.5)) * 1.5', {
    'Red': naip_truecol.select('R_median'),
    'Green': naip_truecol.select('G_median')
  });

var naip_ndvi = naip_image_02.expression(
  '((NIR - Red)/(NIR + Red))', {
    'Red': naip_image_02.select('R_median'),
    'NIR': naip_image_02.select('N_median')
  });


// Map.addLayer(naip_ndvi, {}, 'naip ndvi'); 

// SAVI doesnt help much /// 
////////// Do selective math and create vector polygons ////////////

var naip_red = naip_dataset.select('R').reduce(ee.Reducer.median());
var naip_red_clipped = naip_red.clip(test_site_02);
var naip_blue = naip_dataset.select('B').reduce(ee.Reducer.median());
var naip_blue_clipped = naip_blue.clip(test_site_02);


var blue_lowpass_01 = naip_blue.lt(180).clip(test_site_02);

var red_lowpass = naip_red.gt(189).clip(test_site_02);
var red_highpass = naip_red.gt(215).clip(test_site_02);

// var mh_reflectance = red_select.expression(
//     '190 < RED < 225', {
//       'RED': naip_red.select(['R']).mean(),
// });

var mobile_reflectance_metal = red_lowpass.expression(
  'Lowpass - Highpass - B_lowpass', {
    'Lowpass': red_lowpass,
    'Highpass': red_highpass,
    'B_lowpass': blue_lowpass_01
    
  });
  

var only_mh_metal = mobile_reflectance_metal.eq(1);


// Map.addLayer(red_highpass, {}, "NAIP high lim red");
// Map.addLayer(red_lowpass, {}, "NAIP low lim red"); 

//Map.addLayer(mobile_reflectance_metal, {}, 'Mobile ME Reflectance');

//Map.addLayer(only_mh_metal, {}, 'Mobile Homes MT');


// create polygon vectors // 

var vectors_red = only_mh_metal.updateMask(only_mh_metal)
      .reduceToVectors({
        reducer: ee.Reducer.countEvery(), 
        geometry: test_site_02, 
        scale: 5,
        maxPixels: 1e10});  


Map.addLayer(vectors_red, {}, 'MH vectors');

/// WOHOO it works ///
//Time to filter by polygon size // 

// Filter to get only larger continental US watersheds.
var mobile_polys_01_red = vectors_red.filter(ee.Filter.gt('count', 2));
var mobile_polys_02_red = mobile_polys_01_red.filter(ee.Filter.lt('count', 10));




Map.addLayer(mobile_polys_02_red, {color: 'Red'}, 'Filtered Polys Red');




// //// Sentinel 1 radar ////  useless so far

// var imgVV = ee.ImageCollection('COPERNICUS/S1_GRD')
//         .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
//         .filter(ee.Filter.eq('instrumentMode', 'IW'))
//         .select('VV')
//         .map(function(image) {
//           var edge = image.lt(-30.0);
//           var maskedImage = image.mask().and(edge.not());
//           return image.updateMask(maskedImage);
//         });

// var desc = imgVV.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'));
// var asc = imgVV.filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'));

// var spring = ee.Filter.date('2015-03-01', '2015-04-20');
// var lateSpring = ee.Filter.date('2015-04-21', '2015-06-10');
// var summer = ee.Filter.date('2015-06-11', '2015-08-31');

// var descChange = ee.Image.cat(
//         desc.filter(spring).mean(),
//         desc.filter(lateSpring).mean(),
//         desc.filter(summer).mean());

// var ascChange = ee.Image.cat(
//         asc.filter(spring).mean(),
//         asc.filter(lateSpring).mean(),
//         asc.filter(summer).mean());

// // Map.addLayer(ascChange, {min: -25, max: 5}, 'Multi-T Mean ASC', true);
// // Map.addLayer(descChange, {min: -25, max: 5}, 'Multi-T Mean DESC', true);
// ///////////////// end radar ///////////////////////


// //// try a cluster classifier ////
// /// cluster classifier /// 
// // Make the training dataset.
// var training =  naip_image_02.sample({
//   region: cluster_sample02,
//   scale: 1,
//   numPixels: 500000
// });
// // Instantiate the clusterer and train it.
// var clusterer = ee.Clusterer.wekaKMeans(2).train(training);

// // Cluster the input using the trained clusterer.
// var clustresult = naip_image_02.cluster(clusterer);

// // Display the clusters with random colors.
// Map.addLayer(clustresult.randomVisualizer(), {}, 'clusters');


///// alright, everything works pretty well at identifying mobile home roofing along with others at this point, 
/////  lets run a proximity analysis to identify the unique clustering of the mobile home polygons //// 



//// Kriging to create a raster based on proximity  ////// 
/// create kriging points 

var getCentroids1 = function(feature) {
  return feature.centroid(ee.ErrorMargin(1));
};

var poly_centers = mobile_polys_02_red.map(getCentroids1);

// // Interpolate SST from the sampled points.
// var interpolated = poly_centers.kriging({
//   propertyName: 'count',
//   shape: 'exponential',
//   range: 2 * 100,
//   sill: 1.0,
//   nugget: 0.1,
//   maxDistance: 10 *1000,
//   reducer: 'mean',
//   tileScale: '15'
// });

// var colors = ['00007F', '0000FF', '0074FF',
//               '0DFFEA', '8CFF41', 'FFDD00',
//               'FF3700', 'C30000', '790000'];
// var vis = {min: 2, max:30 , palette: colors};




// Map.addLayer(interpolated, vis, 'Kriged');



var getCentroids = function(feature) {
  return feature.set({polyCent: feature.centroid()});
};

var bufferPoly = function(feature) {
  return feature.buffer(18);   // substitute in your value of Z here
};

var fcWithCentroids = mobile_polys_02_red.map(getCentroids);

var db_buffer = mobile_polys_02_red.map(bufferPoly);
Map.addLayer(db_buffer, {}, 'Buffered polygons');

/// add ground truth layer ////
// Map.addLayer(adams_mhps, {color: 'blue'}, 'adams parks');
// Map.addLayer(us_points, {}, 'US MH');


// // Export the FeatureCollection to a KML file.
// Export.table.toDrive({
//   collection: db_buffer,
//   description:'vectorsToDriveExample',
//   fileFormat: 'SHP'
// });

