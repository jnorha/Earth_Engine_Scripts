
// var dataset = ee.ImageCollection('JAXA/ALOS/PALSAR/YEARLY/SAR')
//                   .filter(ee.Filter.date('2017-01-01', '2017-03-30'));
// var sarHv = dataset.select('HV');
// var sarHvVis = {
//   min: 0.0,
//   max: 10000.0,
// };
// Map.addLayer(sarHv, sarHvVis, 'SAR HV');

var dataset12 = ee.ImageCollection('JAXA/ALOS/PALSAR/YEARLY/SAR')
                  .filter(ee.Filter.date('2012-01-01', '2013-01-01'));
var sarHh12 = dataset12.select('HH');
var sarHhVis = {
  min: 0.0,
  max: 10000.0,
};
Map.addLayer(sarHh12, sarHhVis, 'SAR-L HH 2012');


var dataset13 = ee.ImageCollection('JAXA/ALOS/PALSAR/YEARLY/SAR')
                  .filter(ee.Filter.date('2013-01-01', '2014-01-01'));
var sarHh13 = dataset13.select('HH');

Map.addLayer(sarHh13, sarHhVis, 'SAR-L HH 2013');

var dataset14 = ee.ImageCollection('JAXA/ALOS/PALSAR/YEARLY/SAR')
                  .filter(ee.Filter.date('2014-01-01', '2015-01-01'));
var sarHh14 = dataset14.select('HH');

Map.addLayer(sarHh14, sarHhVis, 'SAR-L HH 2014');

var dataset15 = ee.ImageCollection('JAXA/ALOS/PALSAR/YEARLY/SAR')
                  .filter(ee.Filter.date('2015-01-01', '2016-01-01'));
var sarHh15 = dataset15.select('HH');

var dataset16 = ee.ImageCollection('JAXA/ALOS/PALSAR/YEARLY/SAR')
                  .filter(ee.Filter.date('2016-01-01', '2017-01-01'));
var sarHh16 = dataset16.select('HH');

var dataset17 = ee.ImageCollection('JAXA/ALOS/PALSAR/YEARLY/SAR')
                  .filter(ee.Filter.date('2017-01-01', '2018-01-01'));
var sarHh17 = dataset17.select('HH');

Map.addLayer(sarHh15, sarHhVis, 'SAR-L HH 2015');
Map.addLayer(sarHh16, sarHhVis, 'SAR-L HH 2016');
Map.addLayer(sarHh17, sarHhVis, 'SAR-L HH 2017');

// // Export the image, specifying scale and region.
// Export.image.toDrive({
//   image: landsat,
//   description: 'imageToDriveExample',
//   scale: 30,
//   region: geometry
// });
