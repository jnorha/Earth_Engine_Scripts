// This is a collection which pulls cloudmasked Landsat data and attempts a rough classification

//***setting up masked OLI datasets***
//cloud mask based on pixel quality
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

var dataset16 = ee.ImageCollection("LANDSAT/LC08/C01/T1_SR")
                  .filterDate('2016-05-01', '2016-08-31')
                  .map(maskL8sr)
                  .select(['B2','B3','B4','B5','B6','B7'])
                  .filterBounds(sierra_forest);
                  
var dataset15 = ee.ImageCollection("LANDSAT/LC08/C01/T1_SR")
                  .filterDate('2015-05-01', '2015-08-31')
                  .map(maskL8sr)
                  .select(['B2','B3','B4','B5','B6','B7'])
                  .filterBounds(sierra_forest);
                  
var dataset17 = ee.ImageCollection("LANDSAT/LC08/C01/T1_SR")
                  .filterDate('2017-05-01', '2017-08-31')
                  .map(maskL8sr)
                  .select(['B2','B3','B4','B5','B6','B7'])
                  .filterBounds(sierra_forest);
                  


//***Visual Parameters***
var visParams = {
  bands: ['B4', 'B3', 'B2'],
  min: 0,
  max: 3000,
  gamma: 1.4,
};

var visParams_TCAP = {bands: ['brightness', 'greenness', 'wetness']};


var ndviParams = {min: -1, max: 1, palette: ['blue', 'white', 'green']};

var saviParams = {min: -1, max: 1, palette: ['orange', 'white', 'teal']};

//adjust max and min by need through stretch


//***Tasseled Cap***

//array of coefficients for Landsat 8 for reference
// [
//   [0.3029, 0.2786, 0.4733, 0.5599, 0.508, 0.1872],
//   [-0.2941, -0.243, -0.5424, 0.7276, 0.0713, -0.1608],
//   [0.1511, 0.1973, 0.3283, 0.3407, -0.7117, -0.4559],
//   [-0.8239, 0.0849, 0.4396, -0.0580, 0.2013, -0.2773],
//   [-0.3294, 0.0557, 0.1056, 0.1855, -0.4349, 0.8085],
//   [0.1079, -0.9023, 0.4119, 0.0575, -0.0259, 0.0252]
// ]

//creating an expression based function
var TCAP = function(image)
{
  var brightness = image.expression(
    '(BLUE * 0.3029) + (GREEN * 0.2786) + (RED * 0.4733) + (NIR1 * 0.5599) + (SWIR1 * 0.508) + (SWIR2 * 0.1872)', 
    {
      'GREEN': image.select('B3'),
      'RED': image.select('B4'),
      'BLUE': image.select('B2'),
      'NIR1': image.select('B5'),
      'SWIR1': image.select('B6'),
      'SWIR2': image.select('B7')
    });

image = image.addBands(brightness.rename('brightness'));

  var greenness = image.expression(
    '(BLUE * -0.2941) + (GREEN * -0.243) + (RED * -0.5424) + (NIR1 * 0.7276) + (SWIR1 * 0.0713) + (SWIR2 * -0.1608)', 
    {
      'GREEN': image.select('B3'),
      'RED': image.select('B4'),
      'BLUE': image.select('B2'),
      'NIR1': image.select('B5'),
      'SWIR1': image.select('B6'),
      'SWIR2': image.select('B7')
    });

image = image.addBands(greenness.rename('greenness'));

  var wetness = image.expression(
    '(BLUE * 0.1511) + (GREEN * 0.1973) + (RED * 0.3283) + (NIR1 * 0.3407) + (SWIR1 * -0.7117) + (SWIR2 * -0.4559)', 
    {
      'GREEN': image.select('B3'),
      'RED': image.select('B4'),
      'BLUE': image.select('B2'),
      'NIR1': image.select('B5'),
      'SWIR1': image.select('B6'),
      'SWIR2': image.select('B7')
    });

image = image.addBands(wetness.rename('wetness'));

return image;
};

// var OLI = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR').filterBounds(sierra_forest).filterDate('2016-05-01', '2016-08-31').filterMetadata('CLOUD_COVER', 'less_than', 10).map(TCAP);
//alternative Operational Land Imager dataset with cloudmasked data, use dataset15 or dataset17 for alt. years

var OLI16 = dataset16.map(TCAP);

//show TC from designated year on map
Map.addLayer(OLI16.median(), {min: -0.5, max: 0.5, bands: ['brightness']}, 'brightness16');
Map.addLayer(OLI16.median(), {min: -0.5, max: 0.5, bands: ['greenness']}, 'greenness16');
Map.addLayer(OLI16.median(), {min: -0.5, max: 0.5, bands: ['wetness']}, 'wetness16');
Map.addLayer(OLI16.median(), visParams_TCAP, "TCAP band composition");

var OLI15 = dataset15.map(TCAP);
var OLI17 = dataset17.map(TCAP);

var wetnessChange_years = ee.Image.cat(
        OLI15.select('wetness').mean(),
        OLI16.select('wetness').mean(),
        OLI17.select('wetness').mean());
        
// 3 sd stretch with reduced gamma ~.65
Map.addLayer(wetnessChange_years, {min: -0.1, max: 0.1}, 'Wetness Years');

//end Tassel Cap


//***Other Indices***

//create Index functions
// function NDVI_V1(img) {
// var nir = img.select("B5");
// var red = img.select("B4");
// var ndvi = nir.subtract(red).divide(nir.add(red));
// return ndvi;
// }

// function EVI_V2(img) {
// var nir = img.select("B5");
// var red = img.select("B4");
// var green = img.select("B2");
// var blue = img.select("B3");
// var swir = img.select("B6");
// var evi = img.expression(
//   "(2.5) * ((B5 - B4)/(B5 + 6 * B4 - (7.5) * B2 + 1))",
//   {
//     "B5": nir,
//     "B4": red,
//     "B2": green
//   }
// );
// return evi;
// }

// function SAVI_V3(img) {
// var nir = img.select("B5");
// var red = img.select("B4");
// var green = img.select("B2");
// var blue = img.select("B3");
// var swir = img.select("B6");
// var savi = img.expression(
//   "((B5 - B4)/(B5 + B4 + (0.5))) * (1.5)",
//   {
//     "B5": nir,
//     "B4": red
//   }
// );
// return savi;
// }

// // Indices from different years
// var ndvi_15 = NDVI_V1(dataset15);
// var savi_15 = SAVI_V3(dataset15);

// var ndvi_16 = NDVI_V1(dataset16);
// var savi_16 = SAVI_V3(dataset16);

// var ndvi_17 = NDVI_V1(dataset17);
// var savi_17 = SAVI_V3(dataset17);

// Map.addLayer(ndvi_15, ndviParams, 'NDVI 2015');
// Map.addLayer(ndvi_16, ndviParams, 'NDVI 2016');
// Map.addLayer(ndvi_17, ndviParams, 'NDVI 2017');

// Map.addLayer(savi_15, ndviParams, 'SAVI 2015');
// Map.addLayer(savi_16, ndviParams, 'SAVI 2016');
// Map.addLayer(savi_17, ndviParams, 'SAVI 2017');

//end Other Index


//***SAR Annual comparison***
// Load the Sentinel-1 ImageCollection.
var sentinel1 = ee.ImageCollection('COPERNICUS/S1_GRD');

//load dataset for vv polarization
var imgVV = ee.ImageCollection('COPERNICUS/S1_GRD').filterBounds(sierra_forest)
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
        .filter(ee.Filter.eq('instrumentMode', 'IW'))
        .select('VV')
        .map(function(image) {
          var edge = image.lt(-30.0);
          var maskedImage = image.mask().and(edge.not());
          return image.updateMask(maskedImage);
        });

//specify ascending and descending
var desc = imgVV.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'));
var asc = imgVV.filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'));

//set up dates
var summer17 = ee.Filter.date('2017-05-01', '2017-08-31');
var summer15 = ee.Filter.date('2015-05-01', '2015-08-31');
var summer16 = ee.Filter.date('2016-05-01', '2016-08-31');

//ascending compilation
var ascChange_years = ee.Image.cat(
        asc.filter(summer15).mean(),
        asc.filter(summer16).mean(),
        asc.filter(summer17).mean());
        
//descending compilation
var descChange_years = ee.Image.cat(
        desc.filter(summer15).mean(),
        desc.filter(summer16).mean(),
        desc.filter(summer17).mean());

//add that sar biz to the map
//apply a 3 sd stretch with slightly reduced gamma for best viewing
Map.addLayer(descChange_years, {min: -25, max: 5}, 'Years Mean descVV', true);
Map.addLayer(ascChange_years, {min: -25, max: 5}, 'Years Mean ascVV', true);


//end SAR annual comparison

//SHOW raw landsat from each year
Map.addLayer(dataset15, visParams, 'raw landsat 15');
Map.addLayer(dataset16, visParams, 'raw landsat 16');
Map.addLayer(dataset17, visParams, 'raw landsat 17');
