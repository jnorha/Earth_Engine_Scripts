
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
                  .filterBounds(mhp)
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

var s2_image = s2_dataset.median().select(['B4', 'B3', 'B2']);

var sentParams = {
  bands: ['B4', 'B3', 'B2'],
  min: 100,
  max: 3000

};

var sentinal_clipped = s2_dataset.median().clip(Colorado);

// Map.addLayer(sentinal_clipped, sentParams, 'sent2');

var naip_dataset = ee.ImageCollection('USDA/NAIP/DOQQ')
                  .filter(ee.Filter.date('2017-01-01', '2018-12-31'));
                  
var trueColor = naip_dataset.select(['R', 'G', 'B']);

var naip_image = trueColor.reduce(ee.Reducer.median()).clip(test_01);

var trueColorVis = {
  min: 0.0,
  max: 255.0,
};

var naip_clipped = trueColor.mean().clip(test_01);

Map.addLayer(naip_clipped, trueColorVis, 'Naip 2018');

var naip_red = naip_dataset.select(['R']);

var threshParams = {
  min:150,
  max:255.0
};

var red_median = naip_red.reduce(ee.Reducer.median());
var red_select = red_median.select('R_median');

var red_lowpass = naip_red.mean().gt(206).clip(test_01);
var red_highpass = naip_red.mean().gt(220).clip(test_01);

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
Export.image.toDrive({
  image: naip_image,
  description: 'NaipToDriveExample',
  scale: 1,
  region: test_01,
  maxPixels: 1e13
});

// Export.image.toDrive({
//   image: s2_image,
//   description: 'S2ToDriveExample',
//   scale: 10,
//   region: test_01
// });

//print(trueColor)
