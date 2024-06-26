function main() {
  // getModifiedFeedbackForDb()
  uploadDataToDb('email');
};


function connectToSql() {
  const url = PropertiesService.getScriptProperties().getProperty('MSurl');
  const user = PropertiesService.getScriptProperties().getProperty('MSuser');
  const password = PropertiesService.getScriptProperties().getProperty('MSpass');

  try {
    const connection = Jdbc.getConnection(url, user, password);
    Logger.log('Connected to database');
    return connection;
  } catch (e) {
    Logger.log('Error connecting: ' + e.message);
  };
};


function addStatement(stmt, row) {
  stmt.setInt(1, row[0]);
  stmt.setString(2, getDateForSql(new Date(row[1])));
  stmt.setInt(3, row[2]);
  stmt.setString(4, row[3]);
  stmt.setString(5, row[4]);
  stmt.setInt(6, row[5]);
  stmt.setInt(7, row[6]);
  stmt.setInt(8, row[7]);
  stmt.setInt(9, row[8]);
  stmt.setInt(10, row[9]);
  stmt.setInt(11, row[10]);
  stmt.setInt(12, row[11]);
  stmt.addBatch();
};

function addStatementEmail(stmt, row) {
  stmt.setInt(1, row[0]);
  stmt.setString(2, row[1]);
  stmt.addBatch();
};


function cleanFeedback_temp() {
  const msSqlToDelete =
    `
MERGE INTO feedback AS target
USING feedback_temp AS s
ON(target.uid_member = s.uid_member AND target.date_order = s.date_order AND target.id_order = s.id_order)
WHEN NOT MATCHED BY TARGET THEN
INSERT(uid_member, date_order, id_order, type_order, square, cameras, spent_time, mark, is_recipient, is_creator, is_shared, is_converter)
VALUES(s.uid_member, s.date_order, s.id_order, s.type_order, s.square, s.cameras, s.spent_time, s.mark, s.is_recipient, s.is_creator, s.is_shared, s.is_converter);
   
DELETE FROM feedback_temp
FROM feedback_temp JOIN feedback
ON feedback_temp.uid_member = feedback.uid_member
    AND feedback_temp.date_order = feedback.date_order
    AND feedback_temp.id_order = feedback.id_order; 
`

  const mySqlToDelete = `
REPLACE или IGNORE INTO feedback (uid_member, date_order, id_order, type_order, square, cameras, spent_time, mark, is_recipient, is_creator, is_shared, is_converter) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
`
  try {
    const conn = connectToSql();
    const stmt = conn.prepareStatement(msSqlToDelete)
    stmt.execute();
    Logger.log('feedback_temp cleaned')
  } catch (e) {
    Logger.log('Error' + e.message)
  }
}


function uploadDataToDb(type) {
  let conn;
  try {
    conn = connectToSql();
    conn.setAutoCommit(false);

    if (type === 'email') {
      const sheetName = 'emailsForDb';
      const sheet = ss.getSheetByName(sheetName);
      const sheetToLog = ss.getSheetByName('batchSpeedLog');
      sheetToLog.clear();

      const lastRowTotal = sheet.getLastRow();
      const lastColumn = sheet.getLastColumn();
      let dataIndex = 0;
      Logger.log('Uploading data...');

      while (dataIndex < lastRowTotal) {
        let batchSizeCount = 0;

        let startBatch = new Date()

        let start = new Date()
        const currentLastRow = sheet.getLastRow();
        const logCurrentLastRow = (new Date() - start) / 1000;

        let data;
        start = new Date()
        if (currentLastRow >= batchSize) {
          data = sheet.getRange((currentLastRow - batchSize) + 1, 1, batchSize, lastColumn).getValues();
        } else {
          data = sheet.getRange(2, 1, currentLastRow - 1, lastColumn).getValues();
          Logger.log('Last batch')
        }
        const logValues = (new Date() - start) / 1000;
        start = new Date()
        const stmt = conn.prepareStatement('INSERT INTO emails (uid_member, email) VALUES (?, ?)');
        const logStmt = (new Date() - start) / 1000;

        while (batchSizeCount < batchSize && batchSizeCount < data.length) {

          start = new Date()
          addStatementEmail(stmt, data[batchSizeCount]);
          const logAddStatement = (new Date() - start) / 1000;
          Logger.log(logAddStatement)

          batchSizeCount++;
          dataIndex++;
        }
        const logBatchTime = (new Date() - start) / 1000;


        start = new Date()
        stmt.executeBatch();
        const logExecute = (new Date() - start) / 1000;


        start = new Date()
        stmt.close();
        const logClose = (new Date() - start) / 1000;


        start = new Date()
        conn.commit();
        const logCommit = (new Date() - start) / 1000;

        if (data.length >= batchSize) {
          start = new Date()
          sheet.getRange((currentLastRow - batchSize) + 1, 1, batchSize, lastColumn).clear();
          const logDelete = (new Date() - start) / 1000;
          const logUpload = (new Date() - startBatch) / 1000;
          sheetToLog.appendRow([logUpload])
          Logger.log(`${dataIndex} rows uploaded to Database`);
        }

        else {
          start = new Date()
          sheet.getRange(2, 1, data.length, lastColumn).clear();
          const logDelete = (new Date() - start) / 1000;
          const logUpload = (new Date() - startBatch) / 1000;
          sheetToLog.appendRow([logUpload])
          Logger.log(`${dataIndex} rows uploaded to Database`);
        }
      }
    }

    else {
      const sheetName = 'feedbackForDb'
      const sheet = ss.getSheetByName(sheetName);

      const sheetToLog = ss.getSheetByName('batchSpeedLog');
      sheetToLog.clear();

      const lastRowTotal = sheet.getLastRow();
      const lastColumn = sheet.getLastColumn();
      let dataIndex = 0;
      Logger.log('Uploading data...');

      while (dataIndex < lastRowTotal) {
        let batchSizeCount = 0;

        let startBatch = new Date()

        let start = new Date()
        const currentLastRow = sheet.getLastRow();
        const logCurrentLastRow = (new Date() - start) / 1000;

        let data;
        start = new Date()
        if (currentLastRow >= batchSize) {
          data = sheet.getRange((currentLastRow - batchSize) + 1, 1, batchSize, lastColumn).getValues();
        } else {
          data = sheet.getRange(2, 1, currentLastRow - 1, lastColumn).getValues();
          Logger.log('Last batch')
        }
        const logValues = (new Date() - start) / 1000;
        start = new Date()
        const stmt = conn.prepareStatement('INSERT INTO feedback_temp (uid_member, date_order, id_order, type_order, square, cameras, spent_time, mark, is_recipient, is_creator, is_shared, is_converter) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        const logStmt = (new Date() - start) / 1000;

        while (batchSizeCount <= batchSize && batchSizeCount < data.length) {

          start = new Date()
          addStatement(stmt, data[batchSizeCount]);
          const logAddStatement = (new Date() - start) / 1000;
          Logger.log(logAddStatement)

          batchSizeCount++;
          dataIndex++;
        }
        const logBatchTime = (new Date() - start) / 1000;


        start = new Date()
        stmt.executeBatch();
        const logExecute = (new Date() - start) / 1000;


        start = new Date()
        stmt.close();
        const logClose = (new Date() - start) / 1000;


        start = new Date()
        conn.commit();
        const logCommit = (new Date() - start) / 1000;



        if (data.length >= batchSize) {
          start = new Date()
          sheet.getRange((currentLastRow - batchSize) + 1, 1, batchSize, lastColumn).clear();
          const logDelete = (new Date() - start) / 1000;
          const logUpload = (new Date() - startBatch) / 1000;
          sheetToLog.appendRow([logUpload])
          Logger.log(`${dataIndex} rows uploaded to Database`);
        }

        else {
          start = new Date()
          sheet.getRange(2, 1, data.length, lastColumn).clear();
          const logDelete = (new Date() - start) / 1000;
          const logUpload = (new Date() - startBatch) / 1000;
          sheetToLog.appendRow([logUpload])
          Logger.log(`${dataIndex} rows uploaded to Database`);
        }
      }
    }
    Logger.log('Feedback uploaded to Database');
  }
  catch (e) {
    if (conn) {
      conn.rollback();
    }
    Logger.log('Error: ' + e.message);
  } finally {
    if (conn) {
      conn.close();
    };
  };
};