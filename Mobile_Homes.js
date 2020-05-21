var mobile_homes = ee.Geometry.Polygon([
  [[-106.3930622261023,35.11193475491469]
, [-106.3554345355659,35.110135130079904]
, [-106.35483372074657,35.12533496143687]
, [-106.3915263400703,35.125545562735915]
, [-106.3930622261023,35.11193475491469]]
]);

Map.addLayer(mobile_homes);
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
                  .filterDate('2016-01-01', '2016-12-31')
                  .filterBounds(mobile_homes)
                  .map(maskL8sr);

var visParams = {
  bands: ['B4', 'B3', 'B2'],
  min: 0,
  max: 3000,
  gamma: 1.4,
};

Map.addLayer(L8_dataset.median(), visParams, 'L8');

var s2_dataset = ee.ImageCollection("COPERNICUS/S2_SR").filterDate('2018-01-01', '2018-12-30').filterBounds(mobile_homes);

var sentParams = {
  bands: ['B4', 'B3', 'B2'],
  min: 100,
  max: 3000

};

Map.addLayer(s2_dataset.median(), sentParams, 'sent2');

var naip_dataset = ee.ImageCollection('USDA/NAIP/DOQQ')
                  .filter(ee.Filter.date('2016-01-01', '2016-12-31'))
                  .filterBounds(mobile_homes);
                  
var trueColor = naip_dataset.select(['R', 'G', 'B']);
var trueColorVis = {
  min: 0.0,
  max: 255.0,
};

Map.addLayer(trueColor, trueColorVis, 'Naip 2016');

Map.setCenter(-106.37579233994859,35.12093537028482
);
