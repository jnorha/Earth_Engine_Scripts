// Load the Sentinel-1 ImageCollection.
var sentinel1 = ee.ImageCollection('COPERNICUS/S1_GRD');

var imgVV = ee.ImageCollection('COPERNICUS/S1_GRD').filterBounds(sierra_forest)
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
        .filter(ee.Filter.eq('instrumentMode', 'IW'))
        .select('VV')
        .map(function(image) {
          var edge = image.lt(-30.0);
          var maskedImage = image.mask().and(edge.not());
          return image.updateMask(maskedImage);
        });

var desc = imgVV.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'));
var asc = imgVV.filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'));

var spring = ee.Filter.date('2015-03-01', '2015-04-20');
var lateSpring = ee.Filter.date('2015-04-21', '2015-06-10');
var summer = ee.Filter.date('2015-06-11', '2015-08-31');

var descChange = ee.Image.cat(
        desc.filter(spring).mean(),
        desc.filter(lateSpring).mean(),
        desc.filter(summer).mean());

var ascChange = ee.Image.cat(
        asc.filter(spring).mean(),
        asc.filter(lateSpring).mean(),
        asc.filter(summer).mean());

var clip_ascchange = ascChange.clip(sierra_forest);
var clip_descchange = descChange.clip(sierra_forest);

// Map.addLayer(clip_ascchange, {min: -25, max: 5}, 'Multi-T Mean ASC', true);
// Map.addLayer(clip_descchange, {min: -25, max: 5}, 'Multi-T Mean DESC', true);

var spring16 = ee.Filter.date('2016-03-01', '2016-04-20');
var latespring16 = ee.Filter.date('2016-04-21', '2016-06-10');
var summer16 = ee.Filter.date('2016-06-11', '2016-08-31');

var desc_s = desc.filter(spring16).mean();
var desc_ls = desc.filter(latespring16).mean();
var desc_sum = desc.filter(summer16).mean();

var clip_desc16s = desc_s.clip(sierra_forest);
var clip_desc16_ls = desc_ls.clip(sierra_forest);
var clip_desc16_sum = desc_sum.clip(sierra_forest);

// Map.addLayer(clip_desc16s, {min: -25, max: 5}, 'Mean desc spring', true);
// Map.addLayer(clip_desc16_ls, {min: -25, max: 5}, 'Mean desc late spring', true);
// Map.addLayer(clip_desc16_sum, {min: -25, max: 5}, 'Mean desc summer', true);

// putting spring into blue, late spring into green, and summer into red
var descChange16 = ee.Image.cat(
        desc.filter(spring16).mean(),
        desc.filter(latespring16).mean(),
        desc.filter(summer16).mean());

// print(descChange16);

var clip_deschang16 = descChange16.clip(sierra_forest);
        
// Map.addLayer(descChange16, {min: -25, max: 5}, 'Multi-T Mean descVV', true);

var imgHH = ee.ImageCollection('COPERNICUS/S1_GRD').filterBounds(sierra_forest)
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'HH'))
        .filter(ee.Filter.eq('instrumentMode', 'IW'))
        .select('HH')
        .map(function(image) {
          var edge = image.lt(-30.0);
          var maskedImage = image.mask().and(edge.not());
          return image.updateMask(maskedImage);
        });

var descHH = imgHH.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'));
var ascHH = imgHH.filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'));

var descChangeHH = ee.Image.cat(
        descHH.filter(spring16).mean(),
        descHH.filter(latespring16).mean(),
        descHH.filter(summer16).mean());

var clip_deschang16HH = descChangeHH.clip(sierra_forest);

// Map.addLayer(clip_deschang16HH, {min: -25, max: 5}, 'Multi-T Mean descHH', true);

var imgdual = ee.ImageCollection('COPERNICUS/S1_GRD').filterBounds(sierra_forest)
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
        .filter(ee.Filter.eq('instrumentMode', 'IW'))
        .select('VH')
        .map(function(image) {
          var edge = image.lt(-30.0);
          var maskedImage = image.mask().and(edge.not());
          return image.updateMask(maskedImage);
        });

var descdual = imgdual.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'));
// var ascHH = imgHH.filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'));

var descChangedual = ee.Image.cat(
        descdual.filter(spring16).mean(),
        descdual.filter(latespring16).mean(),
        descdual.filter(summer16).mean());

var clip_deschang16dual = descChangedual.clip(sierra_forest);

// Map.addLayer(clip_deschang16dual, {min: -25, max: 5}, 'Multi-T Mean descdual', true);

//now on to the vegetation+wetness maping

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

var spring_landsat16 = landsat8.filterBounds(sierra_forest)
                              .filterDate('2016-03-01', '2016-04-20')
                              .min();

var latespring_landsat16 = landsat8.filterBounds(sierra_forest)
                              .filterDate('2016-04-21', '2016-06-10')
                              .min();

var summer_landsat16 = landsat8.filterBounds(sierra_forest)
                              .filterDate('2016-06-11', '2016-08-31')
                              .min();

//function appliocation and map additions

var ndvi_spring = NDVI_V1(spring_landsat16);

var ndviParams = {min: -1, max: 1, palette: ['blue', 'white', 'green']};

var saviParams = {min: -1, max: 1, palette: ['orange', 'white', 'teal']};

// Map.addLayer(ndvi_spring, ndviParams, 'NDVI spring');

// var ndvi_latespring = NDVI_V1(latespring_landsat16);
// Map.addLayer(ndvi_latespring, ndviParams, 'NDVI late spring');

// var ndvi_summer = NDVI_V1(summer_landsat16);
// Map.addLayer(ndvi_summer, ndviParams, 'NDVI summer');


// Soil Adjusted Veg index
// var savi_spring = SAVI_V3(spring_landsat16);
// Map.addLayer(savi_spring, saviParams, 'SAVI spring');

// var savi_latespring = SAVI_V3(latespring_landsat16);
// Map.addLayer(savi_latespring, saviParams, 'SAVI late spring');

// var savi_summer = SAVI_V3(summer_landsat16);
// Map.addLayer(savi_summer, saviParams, 'SAVI summer');

//exporting

//Export the image, specifying scale and region.

// Export.image.toDrive({
//   image: descChange16,
//   description: 'SARToDriveExample',
//   scale: 30,
//   region: sierra_forest
// });

// Export.image.toDrive({
//   image: ndvi_spring,
//   description: 'ndvispringToDriveExample',
//   scale: 30,
//   region: sierra_forest
// });

// Export.image.toDrive({
//   image: ndvi_latespring,
//   description: 'ndvilsToDriveExample',
//   scale: 30,
//   region: sierra_forest
// });

// Export.image.toDrive({
//   image: ndvi_summer,
//   description: 'ndvisumToDriveExample',
//   scale: 30,
//   region: sierra_forest
// });


// Export.image.toDrive({
//   image: savi_spring,
//   description: 'savispringToDriveExample',
//   scale: 30,
//   region: sierra_forest
// });

// Export.image.toDrive({
//   image: savi_latespring,
//   description: 'savilsToDriveExample',
//   scale: 30,
//   region: sierra_forest
// });

// Export.image.toDrive({
//   image: savi_summer,
//   description: 'savisummerToDriveExample',
//   scale: 30,
//   region: sierra_forest
// });

// tasseled cap Arrays



var calculateTasseledCap = function (image){
  var b = image.select("B2", "B3", "B4", "B5", "B6", "B7");
  //Coefficients are only for Landsat 8 TOA
	var brightness_coefficents= ee.Image([0.3029, 0.2786, 0.4733, 0.5599, 0.508, 0.1872]);
  var greenness_coefficents= ee.Image([-0.2941, -0.243, -0.5424, 0.7276, 0.0713, -0.1608]);
  var wetness_coefficents= ee.Image([0.1511, 0.1973, 0.3283, 0.3407, -0.7117, -0.4559]);
  var fourth_coefficents= ee.Image([-0.8239, 0.0849, 0.4396, -0.058, 0.2013, -0.2773]);
  var fifth_coefficents= ee.Image([-0.3294, 0.0557, 0.1056, 0.1855, -0.4349, 0.8085]);
  var sixth_coefficents= ee.Image([0.1079, -0.9023, 0.4119, 0.0575, -0.0259, 0.0252]);

	var brightness = image.expression(
			'(B * BRIGHTNESS)',
			{
				'B':b,
				'BRIGHTNESS': brightness_coefficents
				}
			);
  var greenness = image.expression(
    '(B * GREENNESS)',
			{
				'B':b,
				'GREENNESS': greenness_coefficents
				}
			);
  var wetness = image.expression(
    '(B * WETNESS)',
			{
				'B':b,
				'WETNESS': wetness_coefficents
				}
			);
  var fourth = image.expression(
      '(B * FOURTH)',
        {
          'B':b,
          'FOURTH': fourth_coefficents
          }
        );
  var fifth = image.expression(
      '(B * FIFTH)',
        {
          'B':b,
          'FIFTH': fifth_coefficents
          }
        );
  var sixth = image.expression(
    '(B * SIXTH)',
    {
      'B':b,
      'SIXTH': sixth_coefficents
      }
    );
  brightness = brightness.reduce(ee.call("Reducer.sum"));
	greenness = greenness.reduce(ee.call("Reducer.sum"));
	wetness = wetness.reduce(ee.call("Reducer.sum"));
	fourth = fourth.reduce(ee.call("Reducer.sum"));
	fifth = fifth.reduce(ee.call("Reducer.sum"));
  sixth = sixth.reduce(ee.call("Reducer.sum"));
  var tasseled_cap = ee.Image(brightness).addBands(greenness).addBands(wetness).addBands(fourth).addBands(fifth).addBands(sixth).rename('brightness', 'greenness', 'wetness', 'fourth','fifth','sixth');
  return tasseled_cap;
};

var l8_clipped = landsat8.filterDate('2016-06-11', '2016-08-31').filterMetadata('CLOUD_COVER', 'less_than', 5).filterBounds(sierra_forest);

var landsat8_tasseledcap = l8_clipped.map(calculateTasseledCap);

// Define an Array of Tasseled Cap coefficients. Brightness, Greenness, Wetness, TCT4, TCT5, TCT6 from: 
// Muhammad Hasan Ali Baig, Lifu Zhang, Tong Shuai & Qingxi Tong (2014) Derivation of a tasselled cap transformation based on Landsat 8 at-satellite reflectance, Remote Sensing Letters, 5:5, 423-431, DOI: 10.1080/2150704X.2014.915434
var coefficients = ee.Array([
  [0.3029, 0.2786, 0.4733, 0.5599, 0.508, 0.1872],
  [-0.2941, -0.243, -0.5424, 0.7276, 0.0713, -0.1608],
  [0.1511, 0.1973, 0.3283, 0.3407, -0.7117, -0.4559],
  [-0.8239, 0.0849, 0.4396, -0.0580, 0.2013, -0.2773],
  [-0.3294, 0.0557, 0.1056, 0.1855, -0.4349, 0.8085],
  [0.1079, -0.9023, 0.4119, 0.0575, -0.0259, 0.0252]
]);

// Load a Landsat 8 image, select the bands of interest.
// another good l8 image: LANDSAT/LC08/C01/T1/LC08_042034_20160816
var image = ee.Image('LANDSAT/LC08/C01/T1/LC08_043034_20160823')
  .select(['B2', 'B3', 'B4', 'B5', 'B6', 'B7']);

// Make an Array Image, with a 1-D Array per pixel.
var arrayImage1D = image.toArray();

// Make an Array Image with a 2-D Array per pixel, 6x1.
var arrayImage2D = arrayImage1D.toArray(1);

// Do a matrix multiplication: 6x6 times 6x1.
var componentsImage = ee.Image(coefficients)
  .matrixMultiply(arrayImage2D)
  // Get rid of the extra dimensions.
  .arrayProject([0])
  .arrayFlatten(
    [['brightness', 'greenness', 'wetness', 'fourth', 'fifth', 'sixth']]);

// Display the first three bands of the result and the input imagery.
var vizParamsTC = {
  bands: ['brightness', 'greenness', 'wetness'],
  min: -0.5, max: [0.5, 0.1, 0.1]
};

Map.addLayer(componentsImage, vizParamsTC, 'GEE TC');

Map.addLayer(l8_clipped, {bands: ['B4', 'B3', 'B2'], min: 6000, max: 12000}, 'raw');
Map.addLayer(landsat8_tasseledcap, {bands: ['greenness'], min: -0.5, max: 0.5}, 'greenness');
    
// Export.image.toDrive({
//   image: image,
//   description: 'rawToDriveExample',
//   scale: 30,
//   region: sierra_forest
// });


Map.addLayer(landsat8_tasseledcap, vizParamsTC, 'TC_L8');
Map.addLayer(landsat8_tasseledcap, {bands: ['wetness'], min: -0.5, max: 0.5}, 'wetness');
Map.addLayer(landsat8_tasseledcap, {bands: ['brightness'], min: -0.5, max: 0.5}, 'brightness');



// print(landsat8_tasseledcap);




//SAR Annual Differences

// Load the Sentinel-1 ImageCollection.
var sentinel1 = ee.ImageCollection('COPERNICUS/S1_GRD');

var imgVV = ee.ImageCollection('COPERNICUS/S1_GRD').filterBounds(sierra_forest)
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
        .filter(ee.Filter.eq('instrumentMode', 'IW'))
        .select('VV')
        .map(function(image) {
          var edge = image.lt(-30.0);
          var maskedImage = image.mask().and(edge.not());
          return image.updateMask(maskedImage);
        });

var desc = imgVV.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'));
var asc = imgVV.filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'));

var spring = ee.Filter.date('2015-03-01', '2015-04-20');
var lateSpring = ee.Filter.date('2015-04-21', '2015-06-10');
var summer = ee.Filter.date('2015-06-11', '2015-08-31');

var descChange = ee.Image.cat(
        desc.filter(spring).mean(),
        desc.filter(lateSpring).mean(),
        desc.filter(summer).mean());

var ascChange = ee.Image.cat(
        asc.filter(spring).mean(),
        asc.filter(lateSpring).mean(),
        asc.filter(summer).mean());

var clip_ascchange = ascChange.clip(sierra_forest);
var clip_descchange = descChange.clip(sierra_forest);

// Map.addLayer(clip_ascchange, {min: -25, max: 5}, 'Multi-T Mean ASC', true);
// Map.addLayer(clip_descchange, {min: -25, max: 5}, 'Multi-T Mean DESC', true);

var spring16 = ee.Filter.date('2016-03-01', '2016-04-20');
var latespring16 = ee.Filter.date('2016-04-21', '2016-06-10');
var summer16 = ee.Filter.date('2016-06-11', '2016-08-31');

var desc_s = desc.filter(spring16).mean();
var desc_ls = desc.filter(latespring16).mean();
var desc_sum = desc.filter(summer16).mean();

var clip_desc16s = desc_s.clip(sierra_forest);
var clip_desc16_ls = desc_ls.clip(sierra_forest);
var clip_desc16_sum = desc_sum.clip(sierra_forest);

// Map.addLayer(clip_desc16s, {min: -25, max: 5}, 'Mean desc spring', true);
// Map.addLayer(clip_desc16_ls, {min: -25, max: 5}, 'Mean desc late spring', true);
// Map.addLayer(clip_desc16_sum, {min: -25, max: 5}, 'Mean desc summer', true);

// putting spring into blue, late spring into green, and summer into red
var descChange16 = ee.Image.cat(
        desc.filter(spring16).mean(),
        desc.filter(latespring16).mean(),
        desc.filter(summer16).mean());

// print(descChange16);

var clip_deschang16 = descChange16.clip(sierra_forest);
        
// Map.addLayer(descChange16, {min: -25, max: 5}, 'Multi-T Mean descVV', true);

var summer17 = ee.Filter.date('2017-06-01', '2017-08-31');
var summer15 = ee.Filter.date('2015-06-01', '2015-08-31');
var summer16 = ee.Filter.date('2016-06-01', '2016-08-31');

var ascChange_years = ee.Image.cat(
        asc.filter(summer15).mean(),
        asc.filter(summer16).mean(),
        asc.filter(summer17).mean());

Map.addLayer(ascChange_years, {min: -25, max: 5}, 'Years Mean descVV', true);






