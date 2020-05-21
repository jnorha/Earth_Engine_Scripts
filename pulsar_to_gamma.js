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

print(pulsarHv16);

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

var gamma_pulsarHv16 = pulsarHv16.map(to_gamma);

var gamParams = {
  bands: ['gamma_naught'],
  min: -37,
  max: -11,
  gamma: 1,
};

print(gamma_pulsarHv16);

Map.addLayer(gamma_pulsarHv16, gamParams, 'gamma maybe?');



 
