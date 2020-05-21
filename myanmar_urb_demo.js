//// Basic demonstration of remote sensing classification capability in Earth Engine  /////
/*
This script is only an example of what the process might look like. Due to a small amount of 
trainning data, the classifiers are not very accurate and no actual accuracy assessment was done.
*/


//// ---- Technical Layout and Outline ----- /// 
/* Performing basic supervised and unsupervised classification for a coastal region of Myanmar
-- This process is broken up into four main parts:

- PART 1 -
Designate Region of Interest (ROI) and import desired imagery

- PART 2 -
Manipulate imagery to exaggerate desired landscape signatures

- PART 3 -
Train, run, and interpret supervised and unsupervised classification models

- PART 4 -
Assess the accuracy of your classification and perform landscape change analysis over time (Charts, statistical analysis, etc.)
(This last part is more time consuming than the others, examples of this can be found within the provided New Zealand forest change analysis script)
*/

/// --------------------------------------------------------------------   PART 1, Designating ROIs and Pulling Imagery ---------------------------------------------  ///

//// Identify and Create Region of Interest  //// 
var naypyitaw = ee.Geometry.Rectangle([95.53574396461688, 20.123004186105618, 96.85302810784462 
, 19.007424248388286]);


var coastal_region = ee.Geometry.Rectangle([92.48235041869117, 20.711405044554624, 92.84901911986304 
, 20.350021402545362]); // This is the region used for classification below, it is the same area as 'smaller_area' geometry which is used by most clipping functions

Map.addLayer(coastal_region, {}, 'Coastal Region of Interest');

/// Naypyitaw /////
//// Pull Recent Sentinal-2 Surface Reflection at 10-m Optical Imagery /// 

var s2_dataset = ee.ImageCollection("COPERNICUS/S2_SR").filterDate('2019-09-18', '2019-11-28');

var s2_image = s2_dataset.median().select(['B4', 'B3', 'B2']);

var sentParams = {
  bands: ['B4', 'B3', 'B2'],
  min: 100,
  max: 3000
};

var sentinel_clipped = s2_dataset.median().clip(naypyitaw);


var sent_image = sentinel_clipped.select('B4', 'B3', 'B2', 'B5', 'B7', 'B8', 'B6');

// Uncomment these to show sample region around Naypitaw 
//Map.addLayer(sentinel_clipped, sentParams, 'sent2');
//Map.addLayer(sentinel_clipped, {min: 900, max: 4050, bands: ['B7', 'B6', 'B5']}, 'Red Edge');


/// ------- Coastal Region Imagery ------- //

//// Pull Recent Sentinal-2 Surface Reflection at 10-m Optical Imagery /// 
// This is helpful for visual interpretation of the landscape at higher, cloudless resolution 
var s2_dataset19 = ee.ImageCollection("COPERNICUS/S2_SR").filterDate('2019-11-18', '2019-12-28');
var s2_image19 = s2_dataset19.median().select(['B4', 'B3', 'B2']);

var sentSRParams = {
  bands: ['B4', 'B3', 'B2'],
  min: 100,
  max: 3000
};

var sentinel_clipped19 = s2_dataset19.median().clip(smaller_area);

var sent_image = sentinel_clipped.select('B4', 'B3', 'B2', 'B5', 'B7', 'B8', 'B6');

Map.addLayer(sentinel_clipped19, sentSRParams, 'sent2 SR 2019');


// SENTINEL 2 TOP OF ATM FOR COASTAL REGION -- USED IN CLASSIFICATION 

// Finding best images with least clouds -- Nov/dec good for dry season
// Function to mask clouds using the Sentinel-2 QA band
function maskS2clouds(image) {
  var qa = image.select('QA60');

  // Bits 10 and 11 are clouds and cirrus, respectively.
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;

  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
      .and(qa.bitwiseAnd(cirrusBitMask).eq(0));

  return image.updateMask(mask).divide(10000);
}

// take median reflectance over course of a few months in the dry season, do so at 2 year intervals for time series analysis
var sentinel_TOA_19 = ee.ImageCollection('COPERNICUS/S2')
                  .filterDate('2019-10-01', '2019-12-30')
                  // Pre-filter to get less cloudy granules.
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
                  .map(maskS2clouds);


var sentinel_TOA_17 = ee.ImageCollection('COPERNICUS/S2')
                  .filterDate('2017-10-01', '2017-12-30')
                  // Pre-filter to get less cloudy granules.
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
                  .map(maskS2clouds);

var sentinel_TOA_15 = ee.ImageCollection('COPERNICUS/S2')
                  .filterDate('2015-10-01', '2015-12-30')
                  // Pre-filter to get less cloudy granules.
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
                  .map(maskS2clouds);

// set visualization parametsers
var TOA_VIS = {
  min: 0.0,
  max: 0.3,
  bands: ['B4', 'B3', 'B2'],
};

// clip to area of interest // 
var toa_clipped19 = sentinel_TOA_19.median().clip(smaller_area);
var toa_clipped17 = sentinel_TOA_17.median().clip(smaller_area);
var toa_clipped15 = sentinel_TOA_15.median().clip(smaller_area);

// take a look to ensure they arn't too cloudy
Map.addLayer(toa_clipped19, TOA_VIS, 'Top of ATM, VIS 19');
Map.addLayer(toa_clipped17, TOA_VIS, 'Top of ATM, VIS 17');
Map.addLayer(toa_clipped15, TOA_VIS, 'Top of ATM, VIS 15');

// looks like there are some clouds in the 2015 dataset, 
// ----- lets mask them out to null values ----
// I chose to do this by identifying the pixels above a threshold of 0.2 in the Red Wavelength reflectance. 
// Clouds have a significantly higher reflectance in the red wavelengths than the other landscape pixels

// Areas in the "clouds 15" layer that are black are the identified clouds, we then just mask them out of the original TOA layer and now have a virtually cloudless landscape
var cloud_reflect_red = toa_clipped15.select('B4').gt(0.20).eq(0);

// You can use this same thresholding method to target specific characteristics of the landscape and exaggerate or reduce them
var masked_15 = toa_clipped15.updateMask(cloud_reflect_red);

Map.addLayer(cloud_reflect_red, {}, 'clouds 15');
Map.addLayer(masked_15, TOA_VIS, 'Masked 2015');

// Datasets Look good! lets manipulate this imagery, then run some supervised classification and perform time series analysis

// ------------------------------------------------------ END OF PART 1, PULLING IMAGERY -----------------------------------------------------------//




// ------------------ EXTRA SEGMENT EXPLORING FOREST EXTENT WITH RADAR, NOT INCLUDED IN OUTLINE OR CLASSIFICATION --------- //

/// Radar Forest Degredation Index ///
// RFDI is an excellent index for exploring the physical extent of tree cover through structural radar signature analysis. It can get tricky 
// when looking at the raw pulsar radar data but I'd be more than happy to explain the processes at work and the science behind C-band 
// radar remote sensing. It can easily be added to the classification input compositions but was left out to improve processing time here. 

// Pulsar visualization parameters // 
var pulsarHhVis = {
  min: 0.0,
  max: 10000.0,
};

//HH polarization imagery pulling
var puls_dataset15 = ee.ImageCollection('JAXA/ALOS/PALSAR/YEARLY/SAR')
                  .filter(ee.Filter.date('2015-01-01', '2016-01-01'));
var pulsarHh15 = puls_dataset15.select('HH');

var puls_dataset16 = ee.ImageCollection('JAXA/ALOS/PALSAR/YEARLY/SAR')
                  .filter(ee.Filter.date('2016-01-01', '2017-01-01'));
var pulsarHh16 = puls_dataset16.select('HH');

var puls_dataset17 = ee.ImageCollection('JAXA/ALOS/PALSAR/YEARLY/SAR')
                  .filter(ee.Filter.date('2017-01-01', '2018-01-01'));
var pulsarHh17 = puls_dataset17.select('HH');

//HV polarization
var pulsarHv15 = puls_dataset15.select('HV');

var pulsarHv16 = puls_dataset16.select('HV');

var pulsarHv17 = puls_dataset17.select('HV');


// Conversion to gamma factors, basically reduction of convoluted radar signatures to usable integers
var to_gammaHV = function(image)
{
  var gamma_naught = image.expression(
    '10 * (logDNsquared / 2.303) - 83.0', 
    {
      'logDNsquared': image.select('HV').pow(2).log()
    });
    
image = image.addBands(gamma_naught.rename('gamma_naught')); 
    
return image;
};

var to_gammaHH = function(image)
{
  var gamma_naught = image.expression(
    '10 * (logDNsquared / 2.303) - 83.0', 
    {
      'logDNsquared': image.select('HH').pow(2).log()
    });
    
image = image.addBands(gamma_naught.rename('gamma_naught')); 
    
return image;
};

// Gamma Visualization parameters //

var gamParams = {
  bands: ['gamma_naught'],
  min: -28.139,
  max: 2.4094,
  gamma: 1,
};

//Mapping gamma conversion function to pulsar imagery for 2015, 2016, and 2017
var gamma_pulsarHv15 = pulsarHv15.map(to_gammaHV);
var gamma_pulsarHv16 = pulsarHv16.map(to_gammaHV);
var gamma_pulsarHv17 = pulsarHv17.map(to_gammaHV);

var gamma_pulsarHh15 = pulsarHh15.map(to_gammaHH);
var gamma_pulsarHh16 = pulsarHh16.map(to_gammaHH);
var gamma_pulsarHh17 = pulsarHh17.map(to_gammaHH);

var gamma15Hv = gamma_pulsarHv15.select('gamma_naught').mean().rename('gamma_Hv');
var gamma15Hh = gamma_pulsarHh15.select('gamma_naught').mean().rename('gamma_Hh');

var gamma16Hv = gamma_pulsarHv16.select('gamma_naught').mean().rename('gamma_Hv');
var gamma16Hh = gamma_pulsarHh16.select('gamma_naught').mean().rename('gamma_Hh');

var gamma17Hv = gamma_pulsarHv17.select('gamma_naught').mean().rename('gamma_Hv');
var gamma17Hh = gamma_pulsarHh17.select('gamma_naught').mean().rename('gamma_Hh');

// Compiling imagery to Image collections
var gamma15_compiled = gamma15Hv.addBands(gamma15Hh.select('gamma_Hh'));
var gamma16_compiled = gamma16Hv.addBands(gamma16Hh.select('gamma_Hh'));
var gamma17_compiled = gamma17Hv.addBands(gamma17Hh.select('gamma_Hh'));

// Creating RFDI calculation function
var RDFI = function(image)
{
  var RDFI = image.expression(
    '(gamma_Hh - gamma_Hv) / (gamma_Hh + gamma_Hv)', 
    {
      'gamma_Hh': image.select('gamma_Hh'),
      'gamma_Hv': image.select('gamma_Hv')
    });
    
image = image.addBands(RDFI.rename('RDFI')); 
    
return image;
};

// mapping RFDI index to desired gamma imagery 
var pulsar15 = RDFI(gamma15_compiled).clip(smaller_area);
var pulsar16 = RDFI(gamma16_compiled).clip(smaller_area);
var pulsar17 = RDFI(gamma17_compiled).clip(smaller_area);

// Adding Layers to the map
Map.addLayer(pulsar15, {min:-0.4, max:-0.1, bands: 'RDFI', palette: ['ffffcc', 'cc3300']}, 'RFDI 15 v2');
Map.addLayer(pulsar16, {min:-0.4, max:-0.1, bands: 'RDFI', palette: ['ffffcc', 'cc3300']}, 'RFDI 16 v2');
Map.addLayer(pulsar17, {min:-0.4, max:-0.1, bands: 'RDFI', palette: ['ffffcc', 'cc3300']}, 'RFDI 17 v2');

// ----------------------- END OF PULSAR/RFDI EXTRA SEGMENT -------------- //




// ----------------------------------- PART 2, MANIPULATING IMAGERY TO EXAGGERATE DESIRED URBAN CLASS SIGNATURES ------------------------------------ ///

//// Set Up Indices for identifying classes /// 

// I have scripts for NDVI, SAVI, EVI and Tasseled Cap transforms on hand and have customized a few of them them to 
// these particular Sentinel datasets. They are extremely helpful in identifying different satellite classes and key 
// layers for training the Support Vector Machine Classifier, however the ones i have may not be opotimized yet. needs more testing

///NDVI///

// this NDVI can be run on any Sentinel 2 Imagery
var NDVI = function(image)
{
  var NDVI = image.expression(
    '(NIR - RED) / (NIR + RED)', 
    {
      'NIR': image.select('B8'),
      'RED': image.select('B4')
    });
    
image = image.addBands(NDVI.rename('NDVI')); 
    
return image;
};

// This SAVI index can also be run on any sentinel datasets
var SAVI = function(img)
{
var SAVI = img.expression(
  "((NIR - RED)/(NIR + RED + (0.5))) * (1.5)",
  {
    'NIR': img.select('B8'),
    'RED': img.select('B4')
  });
  
img = img.addBands(SAVI.rename('SAVI')); 
    
return img;
};

// other indices can and should be added in a full length project, Tasseled Cap for instance greately exaggerates the 'Brightness' of urban landscape and infrastructure
// This would aid the supervised classifiers in differentiating landscape classes

// Eh, lets add TC bands real quick -- its a fairly convoluted index that needs some background explanation to be fully understood but it 
//exaggerates 3 main components of landscape reflectance: brightness, wetness, and greenness

// ---there are different sets of correct TCAP coefficients which are unique to each satellite sensor,
//this is where I found the correct ones for Sentinel-2 Top of ATM: 
// #Sentinel 2 variables:
// #[(1 0.0356, 2 0.0822, 3 0.1360, 4 0.2611, 5 0.2964, 6 0.3338, 7 0.3877, 8 0.3895, 9 0.0949, 10 0.0009, 11 0.3882, 12 0.1366, 8a 0.4750) - brightness
// # (1 -0.0635, 2 -0.1128, 3 -0.1680, 4 -0.3480, 5 -0.3303, 6 0.0852, 7 0.3302, 8 0.3165, 9 0.0467, 10 -0.0009, 11 -0.4578, 12 -0.4064, 8A 0.3625) - greenness
// # (1 0.0649, 2 0.1363, 3 0.2802, 4 0.3072, 5 0.5288, 6 0.1379, 7 -0.0001, 8 -0.0807, 9 -0.0302, 10 0.0003, 11 -0.4064, 12 -0.5602, 8A -0.1389)]] - wetness
// #https://www.researchgate.net/publication/329184434_ORTHOGONAL_TRANSFORMATION_OF_SEGMENTED_IMAGES_FROM_THE_SATELLITE_SENTINEL-2

// Sentinel 2, TOA Specific Tasseled Cap
var TCAP = function(image)
{
  var brightness = image.expression(
    '(B1 * 0.0356) + (B2 * 0.0822) + (B3 * 0.1360) + (B4 * 0.2611) + (B5 * 0.2964) + (B6 * 0.3338) + (B7 * 0.3877) + (B8 * 0.3895) + (B9 * 0.0949) + (B10 * 0.0009) + (B11 * 0.3882) + (B12 * 0.1366) + (B8A * 0.4750)', 
    {
      'B1': image.select('B1'),
      'B2': image.select('B2'),
      'B3': image.select('B3'),
      'B4': image.select('B4'),
      'B5': image.select('B5'),
      'B6': image.select('B6'),
      'B7': image.select('B7'),
      'B8': image.select('B8'),
      'B8A': image.select('B8A'),
      'B9': image.select('B9'),
      'B10': image.select('B10'),
      'B11': image.select('B11'),
      'B12': image.select('B12'),
    });

image = image.addBands(brightness.rename('brightness'));

  var greenness = image.expression(
    '(B1 * -0.0635) + (B2 * -0.1128) + (B3 * -0.1680) + (B4 * -0.3480) + (B5 * -0.3303) + (B6 * 0.0852) + (B7 * 0.3302) + (B8 * 0.3165) + (B9 * 0.0467) + (B10 * -0.0009) + (B11 * -0.4578) + (B12 * -0.4064) + (B8A * 0.3625)', 
    {
      'B1': image.select('B1'),
      'B2': image.select('B2'),
      'B3': image.select('B3'),
      'B4': image.select('B4'),
      'B5': image.select('B5'),
      'B6': image.select('B6'),
      'B7': image.select('B7'),
      'B8': image.select('B8'),
      'B8A': image.select('B8A'),
      'B9': image.select('B9'),
      'B10': image.select('B10'),
      'B11': image.select('B11'),
      'B12': image.select('B12'),
    });

image = image.addBands(greenness.rename('greenness'));

  var wetness = image.expression(
    '(B1 * 0.0649) + (B2 * 0.1363) + (B3 * 0.2802) + (B4 * 0.3072) + (B5 * 0.5288) + (B6 * 0.1379) + (B7 + -0.0001) + (B8 + -0.0807) + (B9 + -0.0302) + (B10 + 0.0003) + (B11 + -0.4064) + (B12 + -0.5602) + (B8A + -0.1389)', 
    {
      'B1': image.select('B1'),
      'B2': image.select('B2'),
      'B3': image.select('B3'),
      'B4': image.select('B4'),
      'B5': image.select('B5'),
      'B6': image.select('B6'),
      'B7': image.select('B7'),
      'B8': image.select('B8'),
      'B8A': image.select('B8A'),
      'B9': image.select('B9'),
      'B10': image.select('B10'),
      'B11': image.select('B11'),
      'B12': image.select('B12'),
    });

image = image.addBands(wetness.rename('wetness'));

return image;
};


/// Now lets Apply these functions ///
// high res visualization dataset (not used in classification composits)
var ndviadded19 = NDVI(sentinel_clipped19);
var input_19 = SAVI(ndviadded19).clip(local_subset);

// Apply to time series Datasets 
//--2019--//
var ndviband_added_toa_19 = NDVI(toa_clipped19);
var saviband_added_ndvi_19 = SAVI(ndviband_added_toa_19);
// add tc bands and then we'll have all the bands we need to run classifications
var allbands_input_19 = TCAP(saviband_added_ndvi_19);

//-- 2017 -- // 
var ndviband_added_toa_17 = NDVI(toa_clipped17);
var saviband_added_ndvi_17 = SAVI(ndviband_added_toa_17);
// add tc bands and then we'll have all the bands we need to run classifications
var allbands_input_17 = TCAP(saviband_added_ndvi_17);

// -- 2015 -- //
var ndviband_added_toa_15 = NDVI(masked_15);
var saviband_added_ndvi_15 = SAVI(ndviband_added_toa_15);
// add tc bands and then we'll have all the bands we need to run classifications
var allbands_input_15 = TCAP(saviband_added_ndvi_15);


/// -------- Lets take a look at our Input Bands before running classifiers on them. In the Map window under the layer tab, 
// you can toggle the different bands in the little 'gear' menue
// First look through each band as a single band and then run through combinations of 
// the bands within each monitor input of Red, Green and Blue. The relative presence of these colors
// in the image provides an idea of which band is most prominent for that landscape. 
// You can also set up visualization parameters to establish these settings and keep them consistent, but for solely j
// exploration purposes this isnt necessary.

/// --- EXAMPLE of adjusting parameters ---//
//after running this script, you should have each of the 'Input Composite XXXX' layers shown
// Uncheck all Layers except these, go to the gear to the right of the name of one of the layers, click to adjust parameters. Lets do 2015
// check '1 band (Grayscale)' box, select 'greenness' from band dropdown menue. 
// After clicking apply youll notice its either all white or black, we'll have to adjust the histogram of values to account for this. *
// * to adjust the histogram, go to where it says 'Custom' under the Range menue
// Select 'Stretch 3 (sigma)' from this dropdown and then click apply. This will adjust the range of expressed pixels to within 3 standar deviations of the mean (statistical curve)
//This should fix the image and make it easier to interpret. 

// You can then save these parameter values to use later by creating a visualization var for greenness that can be applied to each compsite -- shown below
var green_vis = {
  // The min and max values come from the range parameters
  min: -0.196,
  max: 0.363,
  // band is from the selected band dropdown,
  bands: ['greenness'],
  // you can also adjust the palette for more colors like I've done here
  // In this case, low greenness values are blue and high greenness values are green 
  palette: ['Blue', 'white', 'Green']
};

Map.addLayer(allbands_input_15, {}, 'Input Composite 2015'); // Notice I left the visualization parameters '{}' empty. This is because I'll explore in the map window. These can be specified by defining var's such as visParams as seen above
Map.addLayer(allbands_input_17, {}, 'Input Composite 2017'); 
Map.addLayer(allbands_input_19, {}, 'Input Composite 2019'); 

// Display our greenness params on each annual band, respectively
Map.addLayer(allbands_input_15, green_vis, 'TC greenness 2015'); 
Map.addLayer(allbands_input_17, green_vis, 'TC greenness 2017'); 
Map.addLayer(allbands_input_19, green_vis, 'TC greenness 2019'); 

// Those greenness bands look goooooooood \m/

// ------------------------------------------------- END OF PART 2, MANIPULATING AND PREPARING IMAGERY FOR CLASSIFICATION ---------------------------------------------------//



// ------------------------------------------------- PART 3, TRAINING, RUNNING, AND VISUALIZING CLASSIFICATIONS ------------------------------------------------------------- // 

/// First, let's check out Google's Classification for 2019 (doesnt include all the classes we would need but provides some regional context) ///
var sent_ee_class19 = sentinel_clipped19.select('SCL');

var classviz = {
  min: 4,
  max: 6,
  palette: ['10d22c', 'ffff52', '	0000ff']  // vegetation, bare soils, water
};

Map.addLayer(sent_ee_class19, classviz, 'EE provided classes 2019'); // Doesnt include urban as a class, just vegetation, bare soils, and water respectively


//// Supervized classification - 2 example methods provided ///
// NOTICE: accuracy of each type of classification would be greately improved with more training data. In this demo they are each performed on limited class samples

// Support Vector Machine // 
// SVM classifiers are usually best at capturing the spectral grouping of different landcover classes and designating boundaries with hyperplanes.
// This is best seen with lower numbers of classes (2 to 3). Random Forest machine learning does a better job with more than a few classes and less training data as seen in this quick example

// First lets set up our collection of class features on the landscape. These come from polygons drawn around each class by visual interpretation.
// These class polygons are shown above in the asset table. 
// Each is given a class property 'classo' and a different value
var train_poly = ee.FeatureCollection([
  ee.Feature(urban, {'classo': 1}),
  ee.Feature(agriculture, {'classo': 2}),
  ee.Feature(forest, {'classo': 3}),
  ee.Feature(water, {'classo': 4}),
  ee.Feature(floodplain, {'classo': 5}),
  ]);

// SVM is commented out due to its low accuracy and Large processing time, uncomment variables and layer addition to perform
/// If computation is taking a long time, try increasing the tileScale and scale parameters, or modify classifier below

// var training = input_19.sampleRegions({
//   collection: train_poly,
//   properties: ['classo'],
//   scale: 10,
//   tileScale: 4
// });


// var svm_classifier_01 = ee.Classifier.libsvm({
//   kernelType: 'RBF',
//   gamma: 0.5,
//   cost: 10,
// });

// var classviz2 = {
//   min: 1,
//   max: 5,
//   palette: ['red', 'tan', 'green', 'blue', 'orange'] 
// };

// var trained_svm_01 = svm_classifier_01.train(training, 'classo', ['B4', 'B3', 'B2', 'B8', 'NDVI', 'SAVI']);
// var svm_classified_01 = input_19.classify(trained_svm_01);

// Map.addLayer(svm_classified_01, classviz2, 'SVM Coastal Classification');

/// ---- Looks like our SVM is struggling a bit, This is no doubt due to lack of training data. 
// In a full project I would parse the imagery for 20-30 polygons belonging to each class that capture the diversity of pixel values within each class
// This would likely provide results similar to the New Zealand Forestry script provided in the Proposal which had an estimated accuracy of 87 percent



/// Random Forest Decision Tree classifier for comparison //
// add class values to input image, 
//first convert from vector to raster in training regions
var classimg = train_poly
  .filter(ee.Filter.notNull(['classo']))
  .reduceToImage({
    properties: ['classo'],
    reducer: ee.Reducer.first()
});

// Then add this training class band to each of the inputs
var RF_input15 = allbands_input_15.addBands(classimg.select('first'));
var RF_input17 = allbands_input_17.addBands(classimg.select('first'));
var RF_input19 = allbands_input_19.addBands(classimg.select('first'));

// select number of pixel samples from ground truth areas

// Pixel Sample 2015 //
var RF_training15 = RF_input15.sample({
  numPixels: 5000,
  seed: 0,
  scale: 20,
  tileScale: 2,
  region: train_poly
});

// Pixel Sample 2017 //
var RF_training17 = RF_input17.sample({
  numPixels: 5000,
  seed: 0,
  scale: 20,
  tileScale: 2,
  region: train_poly
});

// Pixel Sample 2019 //
var RF_training19 = RF_input19.sample({
  numPixels: 5000,
  seed: 0,
  scale: 20,
  tileScale: 2,
  region: train_poly
});

// Train a classifier for each year, designate the band pixel values you want it to classify the landscape based on ('inputProperties')
var RF_classifier15 = ee.Classifier.smileRandomForest(10)
    .train({
      features: RF_training15,
      classProperty: 'first',
      inputProperties: ['B4', 'B3', 'B2', 'B8', 'NDVI', 'SAVI', 'greenness', 'wetness', 'brightness']
    });
    
var RF_classifier17 = ee.Classifier.smileRandomForest(10)
    .train({
      features: RF_training17,
      classProperty: 'first',
      inputProperties: ['B4', 'B3', 'B2', 'B8', 'NDVI', 'SAVI', 'greenness', 'wetness', 'brightness']
    });
    
var RF_classifier19 = ee.Classifier.smileRandomForest(10)
    .train({
      features: RF_training19,
      classProperty: 'first',
      inputProperties: ['B4', 'B3', 'B2', 'B8', 'NDVI', 'SAVI', 'greenness', 'wetness', 'brightness']
    });
    

// Apply Random Forest Classifier
var RF_classified15 = RF_input15.classify(RF_classifier15);
var RF_classified17 = RF_input17.classify(RF_classifier17);
var RF_classified19 = RF_input19.classify(RF_classifier19);

// Display and check out
Map.addLayer(RF_classified15, {min: 0, max: 6, palette: ['cc0013', 'tan', 'green', 'blue', 'orange']}, 'Random Forest 2015');
Map.addLayer(RF_classified17, {min: 0, max: 6, palette: ['cc0013', 'tan', 'green', 'blue', 'orange']}, 'Random Forest 2017');
Map.addLayer(RF_classified19, {min: 0, max: 6, palette: ['cc0013', 'tan', 'green', 'blue', 'orange']}, 'Random Forest 2019');


/// Unsupervised Clusterer for comparison //

// Make the training dataset to pull pixel data from

// 2015 cluster training
var training_cluster15 = allbands_input_15.sample({
  region: smaller_area,
  scale: 10,
  numPixels: 500,
  tileScale: 10
});

// 2015 cluster training
var training_cluster17 = allbands_input_17.sample({
  region: smaller_area,
  scale: 10,
  numPixels: 500,
  tileScale: 10
});

// 2015 cluster training
var training_cluster19 = allbands_input_19.sample({
  region: smaller_area,
  scale: 10,
  numPixels: 500,
  tileScale: 10
});
//Instantiate the clusterer and train it. This designates there to be 6 seperate clusters based on pixel differences
var clusterer15 = ee.Clusterer.wekaKMeans(6).train(training_cluster15);
var clusterer17 = ee.Clusterer.wekaKMeans(6).train(training_cluster17);
var clusterer19 = ee.Clusterer.wekaKMeans(6).train(training_cluster19);

// Cluster the input using the trained clusterer.
var cl_result_15 = allbands_input_15.cluster(clusterer15);
var cl_result_17 = allbands_input_17.cluster(clusterer17);
var cl_result_19 = allbands_input_19.cluster(clusterer19);

//Display the clusters with random colors. 
//Might take a second to compute and Load // 

Map.addLayer(cl_result_15.randomVisualizer(), {}, 'clusters 2015');
Map.addLayer(cl_result_17.randomVisualizer(), {}, 'clusters 2017');
Map.addLayer(cl_result_19.randomVisualizer(), {}, 'clusters 2019');
// Definitely have to change the palette to keep class visualization consistent, the relative regionality of the classes can be interpreted however

// 2015 and 2017 random forest classifiers look pretty good, they will need additional training data to refine the urban landscape class however

// increasing the training data size to 20-30 polygons per class would improve supervised classifiers. This would also facilitate the creation of charts showing change over time

// ---------------------------------------------------- END OF PART 3, TRAINING, RUNNING AND INTERPRETING CLASSIFICATIONS ------------------------------------------------//



// ---------------------------------------------------- PART 4, ANALYZING CLASS CHANGE OVER TIME, CREATING CHARTS, AND INTERPRETING LAND STATS -------------------------------------// 

/* as mentioned above, this would be the most time consuming portion of the classification process (and likely the part most useful to urban planning)

Examples of this process can be found in the provided script on New Zealand forest change. 

However, I will briefly outline the process here:
- First as many ground truth sample points would be created as possible. This means parsing the imagery and creating 100 or so accurate points for each class: forest, urband, etc.
--- Then these points can be used in a Confusion Matrix to assess the accuracy of each classifier

- Once adequately accurate classification datasets are produced, you can do time change analysis by differencing the layers by value.
--- For example: You could set the urban class raster value to 1 and everything else to 0 for each year. Then subract off the layers of the previous year which would 
--- give you a unique set of values for urban growth, loss and no change

- These difference datasets describing landscape change can then be used to create charts, transformed into vectors/shapefiles containing polygons of the extent of desired class,
- and compared to one another to assess urban change in different areas.
*/ 

// This last part is more time consuming than the others, examples of this can be found within the provided New Zealand forest change analysis script

// ---------------------------------------------------- END OF PART 4, CLASSIFICATION ANALYSIS AND INTERPRETATION ------------------------------------------------------------------ // 



