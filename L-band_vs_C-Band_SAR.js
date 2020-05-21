
var sierra_forest = ee.Geometry.Rectangle([-120.58648313085916, 38.17155589627505, -118.62542356054666 
, 36.65769112025847]);

Map.addLayer(sierra_forest, {}, 'test site 1');

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

var ann2016 = ee.Filter.date('2016-01-01', '2016-12-31');

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

//raw images
var visParams = {
  bands: ['B4', 'B3', 'B2'],
  min: 0,
  max: 3000,
  gamma: 1.4,
};

Map.addLayer(dataset15, visParams, 'raw landsat 15');
Map.addLayer(dataset16, visParams, 'raw landsat 16');
Map.addLayer(dataset17, visParams, 'raw landsat 17');




//wetness

var TCAP = function(image)
{
  var brightness = image.expression(
    '(BLUE * 0.3029) + (GREEN * 0.2786) + (RED * 0.4733) + (NIR1 * 0.5599) + (SWIR1 * 0.508) + (SWIR2 + 0.1872)', 
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
    '(BLUE * -0.2941) + (GREEN * -0.243) + (RED * -0.5424) + (NIR1 * 0.7276) + (SWIR1 * 0.0713) + (SWIR2 + -0.1608)', 
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
    '(BLUE * 0.1511) + (GREEN * 0.1973) + (RED * 0.3283) + (NIR1 * 0.3407) + (SWIR1 * -0.7117) + (SWIR2 + -0.4559)', 
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

var OLI16 = dataset16.map(TCAP);
var OLI15 = dataset15.map(TCAP);
var OLI17 = dataset17.map(TCAP);

var wetnessChange_years = ee.Image.cat(
        OLI15.select('wetness').mean(),
        OLI16.select('wetness').mean(),
        OLI17.select('wetness').mean());



var greenness16 = OLI16.select('greenness');

Map.addLayer(wetnessChange_years, {min: -605.82, max: 4312.7}, 'Wetness Years');
Map.addLayer(greenness16, {min: 114.42, max: 5003.1, palette: ['white', 'green']}, 'Tasseled Cap Greenness 16');

//***SAR***

//Sentinel1

//set up dates
var ann17 = ee.Filter.date('2017-01-01', '2017-12-31');
var ann15 = ee.Filter.date('2015-01-01', '2015-12-31');
var ann16 = ee.Filter.date('2016-01-01', '2016-12-31');

//VV
var imgVV = ee.ImageCollection('COPERNICUS/S1_GRD').filterBounds(sierra_forest)
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
        .filter(ee.Filter.eq('instrumentMode', 'IW'))
        .select('VV')
        .map(function(image) {
          var edge = image.lt(-30.0);
          var maskedImage = image.mask().and(edge.not());
          return image.updateMask(maskedImage);
        });
        
var descVV = imgVV.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'));
var ascVV = imgVV.filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'));

var descVVChange_years = ee.Image.cat(
        descVV.filter(ann15).mean(),
        descVV.filter(ann16).mean(),
        descVV.filter(ann17).mean());

// Map.addLayer(descVVChange_years, {min: -25, max: 5}, 'Years Mean descVV SENT', true);

//VV+VH dual
var sentinel1 = ee.ImageCollection('COPERNICUS/S1_GRD');

var imgVH = ee.ImageCollection('COPERNICUS/S1_GRD').filterBounds(sierra_forest)
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
        .filter(ee.Filter.eq('instrumentMode', 'IW'))
        .select('VH')
        .map(function(image) {
          var edge = image.lt(-30.0);
          var maskedImage = image.mask().and(edge.not());
          return image.updateMask(maskedImage);
        });
        
//specify ascending and descending
var descVH = imgVH.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'));
var ascVH = imgVH.filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'));

var descVHChange_years = ee.Image.cat(
        descVH.filter(ann15).mean(),
        descVH.filter(ann16).mean(),
        descVH.filter(ann17).mean());

// Map.addLayer(descVHChange_years, {min: -25, max: 5}, 'Years Mean descVH SENT', true);

//Pulsar

var pulsarHhVis = {
  min: 0.0,
  max: 10000.0,
};

//HH
var puls_dataset15 = ee.ImageCollection('JAXA/ALOS/PALSAR/YEARLY/SAR')
                  .filter(ee.Filter.date('2015-01-01', '2016-01-01'));
var pulsarHh15 = puls_dataset15.select('HH');

var puls_dataset16 = ee.ImageCollection('JAXA/ALOS/PALSAR/YEARLY/SAR')
                  .filter(ee.Filter.date('2016-01-01', '2017-01-01'));
var pulsarHh16 = puls_dataset16.select('HH');

var puls_dataset17 = ee.ImageCollection('JAXA/ALOS/PALSAR/YEARLY/SAR')
                  .filter(ee.Filter.date('2017-01-01', '2018-01-01'));
var pulsarHh17 = puls_dataset17.select('HH');

//HV
var pulsarHv15 = puls_dataset15.select('HV');

var pulsarHv16 = puls_dataset16.select('HV');

var pulsarHv17 = puls_dataset17.select('HV');


//Pulsar conversion to gamma naught

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

var gamParams = {
  bands: ['gamma_naught'],
  min: -28.139,
  max: 2.4094,
  gamma: 1,
};

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


var gamma15_compiled = gamma15Hv.addBands(gamma15Hh.select('gamma_Hh'));
var gamma16_compiled = gamma16Hv.addBands(gamma16Hh.select('gamma_Hh'));
var gamma17_compiled = gamma17Hv.addBands(gamma17Hh.select('gamma_Hh'));



// Map.addLayer(sarHh15.mean(), pulsarHhVis, 'PULSAR-L HH 2015');
Map.addLayer(gamma_pulsarHh16, gamParams, 'PULSAR-L HH 2016');
// Map.addLayer(sarHh17.mean(), pulsarHhVis, 'SAR-L HH 2017');

var pulsarHHChange_years = ee.Image.cat(
        gamma_pulsarHh15.mean(),
        gamma_pulsarHh16.mean(),
        gamma_pulsarHh17.mean());

// Map.addLayer(pulsarHHChange_years, pulsarHhVis, 'Pulsar annual change HH', true);

//Pulsar forest maps

var puls_for_dataset = ee.ImageCollection('JAXA/ALOS/PALSAR/YEARLY/FNF')
                  .filterDate('2016-01-01', '2017-01-01');
var forestNonForest = puls_for_dataset.select('fnf');
var forestNonForestVis = {
  min: 1.0,
  max: 3.0,
  palette: ['006400', 'FEFF99', '0000FF'],
};

// Map.addLayer(forestNonForest, forestNonForestVis, 'Pulsar Forest/Non-Forest 16');


//Image Differencing

//***Sentinel, Normalized

var ascVH16 = ascVH.filter(ann16).mean();
var descVH16 = descVH.filter(ann16).mean();

var asc_descVH16 = ascVH16.addBands(descVH16.rename('descVH16'));

var asc_desc_VH_Ndif16 = asc_descVH16.expression(
  '(asc16 - desc16) / (asc16 - desc16)',
  {
    'asc16': ascVH16,
    'desc16': descVH16
  });
  
//Map.addLayer(asc_desc_VH_Ndif16, {min: -25, max: 25}, 'Norm Difference C-band VH 16', true);

var ascVH15 = ascVH.filter(ann15).mean();
var descVH15 = descVH.filter(ann15).mean();

var asc_descVH15 = ascVH15.addBands(descVH15.rename('descVH15'));

var asc_desc_VH_Ndif15 = asc_descVH15.expression(
  '(asc15 - desc15) / (asc15 + desc15)',
  {
    'asc15': ascVH15,
    'desc15': descVH15
  });

// Map.addLayer(asc_desc_VH_Ndif15, {min: -25, max: 25}, 'Norm Difference VH 15', true);

var ascVH17 = ascVH.filter(ann17).mean();
var descVH17 = descVH.filter(ann17).mean();

var asc_descVH17 = ascVH17.addBands(descVH17.rename('desc17'));

var asc_desc_VH_Ndif17 = asc_descVH17.expression(
  '(asc15 - desc15) / (asc15 + desc15)',
  {
    'asc15': ascVH15,
    'desc15': descVH15
  });

// Map.addLayer(asc_desc_VH_Ndif17, {min: -25, max: 25}, 'Norm Difference VH 17', true);


//***Sentinel, Asc - DEM <-- (asc - desc)

var asc_desc_VH_dif16 = asc_descVH16.expression(
  'asc16 - (asc16 - desc16)',
  {
    'asc16': ascVH16,
    'desc16': descVH16
  });
  
Map.addLayer(asc_desc_VH_dif16, {min: -25, max: 25}, 'Difference C-band VH 16', true);


var asc_desc_VH_dif15 = asc_descVH15.expression(
  'asc15 - (asc15 + desc15)',
  {
    'asc15': ascVH15,
    'desc15': descVH15
  });

// Map.addLayer(asc_desc_VH_dif15, {min: -25, max: 25}, 'Difference VH 15', true);

var asc_desc_VH_dif17 = asc_descVH17.expression(
  'asc15 - (asc15 + desc15)',
  {
    'asc15': ascVH15,
    'desc15': descVH15
  });

// Map.addLayer(asc_desc_VH_dif17, {min: -25, max: 25}, 'Difference VH 17', true);


//***PULSAR L band 
var gamma_pulseHH16 = gamma_pulsarHh16.filter(ann16).mean();
var gamma_pulseHV16 = gamma_pulsarHv16.filter(ann16).mean();

//Map.addLayer(gamma_pulsarHv16, gamParams, 'gamma naught L-HV 16');
//Map.addLayer(gamma_pulsarHh16, gamParams, 'gamma naught L-HH 16');



var gamma_pulsar_HH_HV16 = gamma_pulseHH16.addBands(gamma_pulseHV16.rename('gamma_pulseHV16'));

var pulsar_RDFI16 = gamma_pulsar_HH_HV16.expression(
  '(pulseHH16 - pulseHV16) / (pulseHH16 + pulseHV16)',
  {
    'pulseHH16': gamma_pulseHH16,
    'pulseHV16': gamma_pulseHV16
  });

print(pulsar_RDFI16);

//Map.addLayer(pulsar_RDFI16, {min: 0, max: 1, bands:'gamma_naught'}, 'RDFI 16 v1', true);



/// RADAR Forest Degredation INDEX


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

var pulsar15 = RDFI(gamma15_compiled);
var pulsar16 = RDFI(gamma16_compiled);
var pulsar17 = RDFI(gamma17_compiled);

Map.addLayer(pulsar15, {min:-0.4, max:-0.1, bands: 'RDFI', palette: ['ffffcc', 'cc3300']}, 'RDFI 15 v2');
Map.addLayer(pulsar16, {min:-0.4, max:-0.1, bands: 'RDFI', palette: ['ffffcc', 'cc3300']}, 'RDFI 16 v2');
Map.addLayer(pulsar17, {min:-0.4, max:-0.1, bands: 'RDFI', palette: ['ffffcc', 'cc3300']}, 'RDFI 17 v2');


