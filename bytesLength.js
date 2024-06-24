function countBytesInString() {
  const maxLength = 100 * 1024
  const db = {
    1: '@emp.team',
    2: '@emp.team'
  }
  const encode = JSON.stringify(db)
  let blob = Utilities.newBlob(encode)
  blob = Utilities.gzip(blob)
  CacheService.getScriptCache().put('db', blob, 21600)
  const restoredBlob = CacheService.getScriptCache().get('db')

  const uncompressBlob = Utilities.newBlob(restoredBlob).getDataAsString()
  Logger.log(blob.getBytes().length)
  Logger.log(zipBlob.getBytes().length)
  return byteArray.length;
}

function byteArrayToString(byteArray) {
  var base64String = Utilities.base64Encode(byteArray);

  var text = Utilities.newBlob(Utilities.base64Decode(base64String)).getDataAsString();

  return text;
}
