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

// Map.addLayer(ascChange_years, {min: -25, max: 5}, 'Years Mean descVV', true);

var asc16 = asc.filter(summer16).mean();
var desc16 = desc.filter(summer16).mean();

var asc_desc16 = asc16.addBands(desc16.rename('desc16'));

var asc_desc_dif16 = asc_desc16.expression(
  '(asc16 - desc16) / (asc16 + desc16)',
  {
    'asc16': asc16,
    'desc16': desc16
  });
  
print(asc_desc_dif16);
Map.addLayer(asc_desc_dif16, {min: -25, max: 25}, 'Difference 16', true);

var asc15 = asc.filter(summer15).mean();
var desc15 = desc.filter(summer15).mean();

var asc_desc15 = asc15.addBands(desc15.rename('desc15'));

var asc_desc_dif15 = asc_desc15.expression(
  '(asc15 - desc15) / (asc15 + desc15)',
  {
    'asc15': asc15,
    'desc15': desc15
  });

Map.addLayer(asc_desc_dif15, {min: -25, max: 25}, 'Difference 15', true);

var asc17 = asc.filter(summer17).mean();
var desc17 = desc.filter(summer17).mean();

var asc_desc17 = asc17.addBands(desc17.rename('desc17'));

var asc_desc_dif17 = asc_desc17.expression(
  '(asc15 - desc15) / (asc15 + desc15)',
  {
    'asc15': asc15,
    'desc15': desc15
  });

Map.addLayer(asc_desc_dif17, {min: -25, max: 25}, 'Difference 17', true);

var difChange_years = ee.Image.cat(
        asc_desc_dif15,
        asc_desc_dif16,
        asc_desc_dif17);

Map.addLayer(difChange_years, {min: -25, max: 25}, 'Annual Dif', true);
