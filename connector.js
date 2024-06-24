const cc = DataStudioApp.createCommunityConnector();


function getAuthType() {
  return cc.newAuthTypeResponse()
    .setAuthType(cc.AuthType.NONE)
    .build();
};
function resetAuth() {
  const userProperties = PropertiesService.getUserProperties();
  userProperties.deleteProperty('key');
};

function isAuthValid() {
  const userProperties = PropertiesService.getUserProperties();
  const key = userProperties.getProperty('key');
  Logger.log(userProperties.getKeys());
  const resp = UrlFetchApp.fetch(`http://api.openweathermap.org/data/2.5/forecast?id=524901&appid=${key}`, { 'muteHttpExceptions': true });
  return resp.getResponseCode() == 200;
};

function setCredentials(request) {
  const key = request.key;
  const resp = UrlFetchApp.fetch(`http://api.openweathermap.org/data/2.5/forecast?id=524901&appid=${key}`, { 'muteHttpExceptions': true })
  if (resp.getResponseCode() != 200) {
    return cc.newSetCredentialsResponse()
      .setIsValid(false)
      .build();
  } else {
    const userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty('key', key);
    return cc.newSetCredentialsResponse()
      .setIsValid(true)
      .build();
  };
};

function getConfig() {
  const config = cc.getConfig();
  const option1 = config.newOptionBuilder()
    .setLabel(`Lattidue1`)
    .setValue('35');
  const option2 = config.newOptionBuilder()
    .setLabel('Lattidue2')
    .setValue('55');
  const option3 = config.newOptionBuilder()
    .setLabel('Lattidue4')
    .setValue('34');
  const option4 = config.newOptionBuilder()
    .setLabel('Lattidue4')
    .setValue('56');

  const option5 = config.newOptionBuilder()
    .setLabel('Longitude1')
    .setValue('35');
  const option6 = config.newOptionBuilder()
    .setLabel('Longitude2')
    .setValue('55');
  const option7 = config.newOptionBuilder()
    .setLabel('Longitude3')
    .setValue('34');
  const option8 = config.newOptionBuilder()
    .setLabel('Longitude4')
    .setValue('56');

  config.newSelectSingle()
    .setId('lattidue')
    .setName('Select Lattidue')
    .addOption(option1)
    .addOption(option2)
    .addOption(option3)
    .addOption(option4);

  config.newInfo()
    .setText(lattidue);

  config.newSelectSingle()
    .setId('longitude')
    .setName(`${Session.getEffectiveUser()}`)
    .addOption(option5)
    .addOption(option6)
    .addOption(option7)
    .addOption(option8);

  config.newInfo()
    .setText('longitude');

  return config.build()
};

function isAdminUser() {
  return true
}

function getFields() {
  const fields = cc.getFields();
  fields.newMetric()
    .setId('population')
    .setName('Population')
    .setDescription('Population of the city')
    .setType(cc.FieldType.NUMBER);
  fields.newDimension()
    .setId('timeZone')
    .setName('Time Zone')
    .setDescription('Time Zone of the city')
    .setType(cc.FieldType.TEXT);
  fields.newMetric()
    .setId('temperature')
    .setName('Temperature')
    .setDescription('Temperature of the city')
    .setType(cc.FieldType.NUMBER);
  return fields
}
function getSchema() {
  return cc.newGetSchemaResponse()
    .setFields(getFields())
    .build();
};


function getData(request) {
  const userProperties = PropertiesService.getUserProperties();
  const key = userProperties.getProperty('key');
  const long = request.configParams.longitude
  const lat = request.configParams.lattidue
  let resp = UrlFetchApp.fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${long}&appid=${key}`, { 'muteHttpExceptions': true })
  Logger.log(resp.getContentText())
  return cc.newGetDataResponse()
    .setFields(getFields())
    .addRow([10000, '+6', 11])
    .build();
};