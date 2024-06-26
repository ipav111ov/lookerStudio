function collectEmailsDb() {
  const emailsDb = {};
  collectEmailsFromEmailsDbSheet(emailsDb);
  collectEmailsFromEmplanner(emailsDb);
  CacheService.getScriptCache().put('emailsDb', JSON.stringify(emailsDb), 21600)
  return emailsDb
}

function collectEmailsFromEmailsDbSheet(emailDb) {
  const sheetNames = ['drafters', 'managers'];
  const columnIndexes = {
    uid: 1,
    email: 5,
  };
  const ssEmailsDb = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1rqC11ps2SQXn1hGYjMTyDP2jT3WcfjAoGgb5Dmw_LgM/edit#gid=1297859229');

  for (const sheetName of sheetNames) {
    const sheet = ssEmailsDb.getSheetByName(sheetName);
    const sheetValues = sheet.getDataRange().getValues().slice(1);

    for (const row of sheetValues) {
      const uid = modifyUid(row[columnIndexes.uid]);
      const email = row[columnIndexes.email];
      if (uid && email) {
        emailDb[uid] = email
      };
    };
  };

  const sheet = ssEmailsDb.getSheetByName('other');
  const sheetValues = sheet.getDataRange().getValues();

  for (const row of sheetValues) {

    if (row[0] && row[7] && row[7] != 'No email') {
      emailDb[row[0]] = row[7]
    }
  }
  return emailDb
};

function collectEmailsFromEmplanner(emailDb) {
  Logger.log('Start fetching...')
  let page = 1;
  const options = {
    'method': "get",
    'headers': {
      'Content-Type': 'application/json',
      'Cookie': 'session=eyJhbGciOiJIUzUxMiJ9.eyJkYXRhIjp7Imp3dCI6ImV5SmhiR2NpT2lKU1V6VXhNaUo5LmV5SjFjMlZ5U1VRaU9pSTJNemszTnpNNE1XRmxNell5WVRSbU56VTNaREF6TURnaUxDSmxiV0ZwYkNJNkltbHdZWFl4TVRGdmRrQm5iV0ZwYkM1amIyMGlMQ0p5YjJ4bGN5STZXeUpFVWtGR1ZFVlNJaXdpUlZOWVgxSkZWa2xGVjBWU0lsMHNJbU55WldGMFpXUkJkQ0k2TVRjeE56WTNNelE1TnpFd09IMC5XRTNETHA2OVloZ0QwTkVGb1NqSGt3S0FRWVJPRUFsLXZMc2Ruelc4V3JJWHRxNFhoeFhMMTV2NlpYa1pjdVYwSDZXZDdNZVpjeDRrMlhUS2dBeFNDVjBkSXZ4ZE5uS0FTOV82LWxqYW54ZzZJRW1ZbFZReWFLdTlQQVZyOTdVYUdCZ0h2d2tHdlVQVFdfM3cwdkNlLXFDX0E4UE9Gbi1mdHJpRUJzR1dJRC1XWV95TWMtUXVuUFZacUNQMnlLdW5tQ1FQNnFlOUY1NG9pcWh1YjVEWE5lMk5MNHFHdDB2S19lQ3RqVTJjNUI3M0FHeFRhdXlQSkFCZDA1bEl5bDFQYnh3d0g2c2hqWTlEQ1dvWDNfV2R0ZDJ4YzA0dFFxLVRxX2pTckVFaFlLNEFuNkFWSzhMWkhGQXQwQ3FlNU9yOFZwdG1yWG52ekZVdjktVEE0RS1LaXcifSwiZXhwIjoxNzE5NzI3NDQ3LCJuYmYiOjE3MTkxMjI2NDcsImlhdCI6MTcxOTEyMjY0N30.xqNUVhGp1PrCIcMlC6F9MWhp3bsvZKZuG9h0jAVvvv-Y5ee2QvGqkZEy5F15wj-wiLFFaAyGhOtj4CYJm_Z8ww'
    },
    'muteHttpExceptions': true
  }

  while (page <= 100) {
    const link = `https://app.emplanner.team/rest/v3/user?p.page=${page}&p.pageSize=50&p.sortBy=firstName&p.order=asc&productionAccess=HAVE_ACCESS`

    try {
      const response = UrlFetchApp.fetch(link, options);
      const json = JSON.parse(response);

      if (json.details.list.length === 0) {
        Logger.log('Fetching completed')
        return emailDb
      }

      for (const member in json.details.list) {
        const uid = modifyUid(json.details.list[member].extraId);
        const email = json.details.list[member].corporateEmail;
        if (uid && email) {
          emailDb[uid] = email;
        };
      };
      Utilities.sleep(5000);
      page++;
    }
    catch (e) {
      Logger.log('Error:' + e);
    };
  };
  return
};