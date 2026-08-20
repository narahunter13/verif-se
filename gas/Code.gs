const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID";
const DRIVE_FOLDER_ID = "YOUR_DRIVE_FOLDER_ID";

function sanitizeFileName(value) {
  return value.replace(/[\/\\:*?"<>|]/g, '_').replace(/\s+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

function generateFileName(pjOrganik, namaPpl, kecamatan, kelurahan, sls, namaResponden, ext) {
  ext = ext || 'jpg';
  var parts = [pjOrganik, namaPpl, kecamatan, kelurahan, sls, namaResponden].map(sanitizeFileName);
  return parts.join('_') + '.' + ext;
}

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === "getInitialData") {
    return ContentService.createTextOutput(JSON.stringify(getInitialData()))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Invalid action" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // 1. Save Image to Drive
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const contentType = data.fileType || "image/jpeg";
    const fileName = generateFileName(data.pjOrganik, data.namaPpl, data.kecamatan, data.kelurahan, data.sls, data.namaResponden, 'jpg');
    const blob = Utilities.newBlob(
      Utilities.base64Decode(data.fileBase64), 
      contentType, 
      fileName
    );
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const fileUrl = file.getUrl();
    
    // 2. Append Row to Transaksi_Verifikasi
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Transaksi_Verifikasi");
    const timestamp = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
    
    sheet.appendRow([
      timestamp,
      data.pjOrganik,
      data.namaPpl,
      data.kecamatan,
      data.kelurahan,
      data.sls,
      data.namaResponden,
      fileUrl
    ]);

    return ContentService.createTextOutput(JSON.stringify({ 
      status: "success", 
      fileUrl: fileUrl 
    }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: err.toString() 
    }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getInitialData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // Get Master_Target data
  const masterSheet = ss.getSheetByName("Master_Target");
  const masterData = masterSheet.getDataRange().getValues();
  masterData.shift(); // Remove header
  
  // Get Transaksi_Verifikasi data
  const transSheet = ss.getSheetByName("Transaksi_Verifikasi");
  let transData = [];
  if (transSheet) {
    transData = transSheet.getDataRange().getValues();
    if (transData.length > 0) {
      transData.shift(); // Remove header
    }
  }

  return {
    master: masterData,
    transactions: transData
  };
}

// Optional: Function to setup sheets (run once)
function setupSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // Create Master_Target if not exists
  let masterSheet = ss.getSheetByName("Master_Target");
  if (!masterSheet) {
    masterSheet = ss.insertSheet("Master_Target");
    masterSheet.appendRow(["PJ Organik", "Nama PPL", "Kecamatan", "Kelurahan", "SLS", "Target"]);
  }
  
  // Create Transaksi_Verifikasi if not exists
  let transSheet = ss.getSheetByName("Transaksi_Verifikasi");
  if (!transSheet) {
    transSheet = ss.insertSheet("Transaksi_Verifikasi");
    transSheet.appendRow([
      "Timestamp", "PJ Organik", "Nama PPL", "Kecamatan", "Kelurahan", 
      "SLS", "Nama Responden", "URL Foto"
    ]);
  }
}
