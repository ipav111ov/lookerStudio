const batchSize = 100;
const ss = SpreadsheetApp.openById('1PX1CT1XL7dz5_T_wbFdOaeIqCWDig2HpPJxWtRVh9Io');

function emails() {
  const teams = getTeams();
  prepareEmailsForDb(teams)
  getEmailsForDb()
}
function getTeams() {
  const sheetName = 'TeamsList';
  Logger.log('Creating teams...');
  const sheetTeams = ss.getSheetByName(sheetName);
  const valuesTeams = sheetTeams.getDataRange().getValues().slice(4);
  const emailsDb = JSON.parse(CacheService.getScriptCache().get('emailsDb')) || collectEmailsDb();

  const columns = {
    leaderName: 0,
    leaderUid: 1,
    memberName: 2,
    memberUid: 3,
  };
  const teams = {};
  let currentLeaderUid = "";
  let membersArr = []

  for (const row of valuesTeams) {
    if (row[columns.leaderName] === 'Total' || row[columns.leaderName] === 'Total Included') {
      continue
    };
    if (row[columns.leaderUid]) {
      const leaderUid = modifyUid(row[columns.leaderUid])
      currentLeaderUid = leaderUid;
      teams[currentLeaderUid] = {};
    };
    if (row[columns.memberUid]) {
      const memberUid = modifyUid(row[columns.memberUid])
      teams[currentLeaderUid][memberUid] = emailsDb[memberUid]
    }
  };
  Logger.log('Checking duplicates...');
  findDuplicates(membersArr)
  Logger.log('Teams created\n');

  return teams
};

function findDuplicates(array) {
  const duplicates = [];
  const seen = {};

  for (let i = 0; i < array.length; i++) {
    const currentItem = array[i];
    if (seen[currentItem]) {
      if (!duplicates.includes[currentItem]) {
        duplicates.push(currentItem)
      }
    } else {
      seen[currentItem] = true;
    };
  }
  duplicates.length > 0 ? Logger.log(`Found dulpicates - ${duplicates}`) : Logger.log(`No dublicates`);
  return duplicates;
};

function prepareEmailsForDb(teams) {
  const sheetName = 'emails';
  Logger.log('Collecting emails for Database...');
  let teamsArray = [['email', 'members']];
  let adminEmailsArray = ['glivalcis@gmail.com', 'ilia.pavlov@emaplanner.team'];
  let allMembersUidArray = [];

  for (const leader of Object.keys(teams)) {
    const emailMembersArray = [];
    emailMembersArray[0] = teams[leader][leader];
    const memberArray = []
    const membersArray = Object.keys(teams[leader]).map((member) => {

      if (leader !== member) {
        memberArray.push([teams[leader][member], member])
      }
      return member
    })

    emailMembersArray[1] = membersArray.join();
    allMembersUidArray.push(membersArray)
    teamsArray.push(emailMembersArray);
    teamsArray = teamsArray.concat(memberArray)
  };

  for (const adminEmail of adminEmailsArray) {
    // teamsArray.push([adminEmail, allMembersUidArray.join()])
    teamsArray.push(['admin email', allMembersUidArray.join()])
  };


  if (!ss.getSheetByName(sheetName)) {
    ss.insertSheet(sheetName)
  }
  const sheet = ss.getSheetByName(sheetName);
  sheet.clear()
  sheet.getRange(1, 1, teamsArray.length, teamsArray[0].length).setValues(teamsArray)
  Logger.log('Emails collected')
  return teamsArray
};

function getModifiedFeedbackForDb() {
  const sheetName = 'feedbackForDb'
  const values = getValuesFromSS();
  const obj = getMapFFedbackUid(values);
  // const arrayForWrite = [['Member', 'Date', 'OrderId', 'Type', 'Square', 'Cameras', 'Time', 'Mark', 'isRecipient', 'isCreator', 'isShared', 'isConverter']];
  const arrayForWrite = [];
  for (const memberUid in obj) {
    for (const orderAsDate in obj[memberUid].orders) {
      const member = memberUid;
      const modifiedMember = modifyUid(member)
      const date = orderAsDate;
      const orderId = obj[member].orders[orderAsDate].orderId;
      const type = obj[member].orders[orderAsDate].type;
      const square = obj[member].orders[orderAsDate].square;
      const cameras = obj[member].orders[orderAsDate].cameras;
      const isRecipient = obj[member].orders[orderAsDate].recipient ? 1 : 0;
      const isCreator = obj[member].orders[orderAsDate].creator ? 1 : 0;
      const isShared = obj[member].orders[orderAsDate].isShared ? 1 : 0;
      const time = isCreator ? obj[member].orders[orderAsDate].reviewST : obj[member].orders[orderAsDate].st;
      const mark = obj[member].orders[orderAsDate].mark;
      const isConverter = obj[member].orders[orderAsDate].isConverter ? 1 : 0;

      const row = [modifiedMember, date, orderId, type, square, cameras, time, mark, isRecipient, isCreator, isShared, isConverter];
      arrayForWrite.push(row);
    }
  }
  if (!ss.getSheetByName(sheetName)) {
    ss.insertSheet(sheetName)
  };
  const sModified = ss.getSheetByName(sheetName);
  sModified.getRange(sModified.getLastRow() + 1, 1, arrayForWrite.length, arrayForWrite[0].length).setValues(arrayForWrite);
  return arrayForWrite
}

function getValuesForBatchForDb(values) {
  if (values.length <= batchSize) {
    if (values[0]) {
      return values
    }
    Logger.log('Feedback is empty')
  } else {
    const valuesForBatch = values.slice((values.length - batchSize), values.length)
    // Logger.log(valuesForBatch.length)
    return valuesForBatch
  }
}


function getEmailsForDb() {
  const sheetName = 'emails'
  const sheetNameForWrite = 'emailsforDb'
  const sheet = ss.getSheetByName(sheetName);
  const values = sheet.getDataRange().getValues().slice(1);
  const outputArray = [['uid_member', 'email']];
  for (const row of values) {
    const email = row[0];
    const members = String(row[1]);
    const membersArray = members ? members.split(',') : [];
    for (const member of membersArray) {
      if (member && email) {
        const pair = [Number(member), email];
        outputArray.push(pair)
      };
    };
  }
  if (!ss.getSheetByName(sheetNameForWrite)) {
    ss.insertSheet(sheetNameForWrite)
    SpreadsheetApp.flush()
  };
  const sModified = ss.getSheetByName(sheetNameForWrite);
  sModified.getRange(sModified.getLastRow() + 1, 1, outputArray.length, outputArray[0].length).setValues(outputArray);
  return outputArray;
}

function modifyUid(uid) {
  return Number(uid.replace(/\s+/g, '').substring(3));
}

// function getEmailsArray1(teams) {
//   let emailsArray = [['email', 'members']]
//   let adminEmailsArray = ['glivalcis@gmail.com', 'ilia.pavlov@emaplanner.team']
//   let allMembersUidArray = [];

//   for (const leader of Object.keys(teams)) {
//     const memberArray = []
//     for (let member in teams[leader]) {
//       member = modifyUid(member);
//       // teamsArray.push([teams[leader][leader], member])
//       // memberArray.push([teams[leader][member], member])
//       emailsArray.push(['leader email', member])
//       memberArray.push(['member email', member])
//       allMembersUidArray.push(member)
//     }
//     emailsArray = emailsArray.concat(memberArray)
//   };

//   for (const adminEmail of adminEmailsArray) {
//     for (const member of allMembersUidArray) {
//       // teamsArray.push([adminEmail, member])
//       emailsArray.push(['admin email', member])
//     };
//   };


//   if (!ss.getSheetByName('emails1')) {
//     ss.insertSheet('emails1')
//   }
//   const sheet = ss.getSheetByName('emails1');
//   sheet.clear()
//   sheet.getRange(1, 1, emailsArray.length, emailsArray[0].length).setValues(emailsArray)

//   return emailsArray
// };

