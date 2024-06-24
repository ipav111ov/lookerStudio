function getValuesFromSS() {
  // const isTest = false
  const isTest = true
  const link = isTest ? '1hUGkZXYAvDO7eEaCHKbpnvjhTooW8_pB' : '13TcMSfrJkhsVRM0i6oTMK6_k0ybtxVFk'
  const folder = DriveApp.getFolderById(link);
  const files = folder.getFiles();
  let result = [];
  while (files.hasNext()) {
    const file = files.next();
    let currentValues = SpreadsheetApp.openById(file.getId()).getSheets()[0].getDataRange().getValues()
    currentValues = currentValues[1][0] == '' ? currentValues.slice(2) : currentValues.slice(1)
    result = result.concat(currentValues)
  }
  return result;
}



