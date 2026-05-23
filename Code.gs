/**
 * GD remote Upload Back-End
 * Remote-Upload to Google Drive using Google Apps Script.
 * Currently bypassing the 50 MB URL Fetch response size by splitting the file.
 * https://github.com/AlirezaM1376/GDRemoteUpload
 */

//---------- Creating & showing the front-end ----------
function doGet() {
  return HtmlService.createHtmlOutputFromFile('GDRemoteUpload')
      .setTitle('Simple GD Remote Upload')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ---------- Proccessing the file link ----------
function processFile(data) {

	var url = data.fileLink;
	var fileName = data.fileName || "";
	var folderId = data.folderId || "";
	
	var maxSizeInBytes = 49.5 * 1024 * 1024; // URL Fetch response max allowed size is 50 MB
	var uploadMethod = 0;
	
	if (!url) {
		return {
			status: 'error',
			message: 'Error: No URL provided!<br>Please enter a URL.'
		};
	}

	try {
		// ---------- STEP 1: Detect File Size ----------
		var sizeOptions = {
			method: "get",
			headers: {"Range": "bytes=0-0"},
			muteHttpExceptions: true,
			followRedirects: true // Follow redirect if needed
		};
		
		var response = UrlFetchApp.fetch(url, sizeOptions);
		if (response.getResponseCode() >= 400) {
			throw new Error("Failed to load the URL.<br>Response code: " + response.getResponseCode());
		}
		
		var headers = response.getHeaders();
		var contentLength = headers['Content-Length'] || headers['content-length'];
		var contentRange = headers["Content-Range"] || headers["content-range"];
		
    var fileSizeInBytes = contentRange ? parseInt(contentRange.split("/")[1], 10) : 0;
		fileName = fileName!=="" ? fileName : generateFileName(url, headers);

		if (fileSizeInBytes > 0) {
			// Converting unit to MB
			var fileSizeInMB = fileSizeInBytes / (1024 * 1024);
			fileSizeMessage = fileSizeInMB.toFixed(2) + ' MB';
			
			// Checking file size. If size > 49 MB => use split file upload method
			if (fileSizeInBytes > maxSizeInBytes) {
				uploadMethod = 1;
			}
			
		} else {
			// If there is no info about file size, we continue the process for now
		}		  
		
		if(!uploadMethod){
			// If file size is under 50 MB save it in GDrive directly
			var downloadOptions = {
				"method": "get",
				"muteHttpExceptions": true,
				"followRedirects": true
			};
			var fullResponse = UrlFetchApp.fetch(url, downloadOptions);
			var blob = fullResponse.getBlob().setName(fileName);
			
      if(folderId!==""){
        var folder = DriveApp.getFolderById(folderId);
        var file = folder.createFile(blob);
      }else{
        var file = DriveApp.createFile(blob);
      }

			var directDownloadUrl = 'https://drive.usercontent.google.com/download?id=' + file.getId() +'&export=download';			
			
			return {
				status: 'success',
				message: 'File uploaded successfully.',
				details: {
					name: fileName,
					size: fileSizeInBytes > 0 ? fileSizeMessage : "Unknown",
					link: directDownloadUrl
				}
			};
	
		}else{
			var chunkSize = 45 * 1024 * 1024; // 45 MB
			var start = 0;
			
			// loop for saving file part by part
			var partCounter= 1;
      
      if(folderId!==""){
        var folder = DriveApp.getFolderById(folderId);
        var subFolder = folder.createFolder(fileName + "_parts_" + new Date().getTime());
      }else{
        var subFolder = DriveApp.createFolder(fileName + "_parts_" + new Date().getTime());
      }

			while (start < fileSizeInBytes) {
				var end = Math.min(start + chunkSize - 1, fileSizeInBytes - 1);
				var rangeHeader = "bytes=" + start + "-" + end;

				var chunkOptions = {
					"method": "get",
					"headers": {
					  "Range": rangeHeader
					},
					"muteHttpExceptions": true,
					"followRedirects": true
				};

				var chunkResponse = UrlFetchApp.fetch(url, chunkOptions);

				if (chunkResponse.getResponseCode() === 206 || chunkResponse.getResponseCode() === 200) {
					var chunkBlob = chunkResponse.getBlob().setName(fileName + ".part" + String(partCounter));
					var file = subFolder.createFile(chunkBlob);
				}else {
					throw new Error("Failed to download part " + partCounter + " of the file.<br>Response code: " + chunkResponse.getResponseCode());
				}

				start += chunkSize;
				partCounter++;
			}
      createBatchFile(subFolder.getId(), fileName);
			var folderLink = 'https://drive.google.com/drive/folders/' + subFolder.getId();
			
			return {
				status: 'success',
				message: 'File uploaded successfully.',
				details: {
          link: folderLink,
					name: fileName,
					size: fileSizeInBytes > 0 ? fileSizeMessage : "Unknown",
          partsCount: partCounter-1
				}
			};
		}

	} catch (err) {
		return {
			status: 'error',
			message: String(err)
		};
	}
}

function generateFileName(url, headers) {

	var fileName = "";

	// --------- 1. Try from URL ----------
	var urlPart = url.split('/').pop().split('?')[0];
	if (urlPart && urlPart.indexOf('.') !== -1) {
		fileName = urlPart;
	}

	// ---------- 2. Try from Content-Disposition ----------
	if (!fileName && headers) {
		var disposition = headers["Content-Disposition"] || headers["content-disposition"];
		if (disposition && disposition.indexOf("filename=") !== -1) {
			fileName = disposition.split("filename=")[1]
			.replace(/['"]/g, "")
			.trim();
		}
	}

	// ---------- 3️. If still empty → Generate base name ----------
	if (!fileName) {
		var randomId = Utilities.getUuid().slice(0, 8);
		var timestamp = new Date().getTime();
		fileName = "file_" + timestamp + "_" + randomId;
	}

	// ---------- 4️. Ensure extension exists ----------
	if (fileName.indexOf('.') === -1 && headers) {

		var contentType = headers["Content-Type"] || headers["content-type"];

		if (contentType) {
			var extension = mimeToExtension(contentType);
			if (extension) {
				fileName += "." + extension;
			} else {
				fileName += ".bin";
			}
		} else {
			fileName += ".bin";
		}
	}

	return fileName;
}

function mimeToExtension(mime) {

	var map = {
		"video/mp4": "mp4",
		"video/x-matroska": "mkv",
		"video/webm": "webm",
		"audio/mpeg": "mp3",
		"audio/wav": "wav",
		"image/jpeg": "jpg",
		"image/png": "png",
		"image/gif": "gif",
		"application/pdf": "pdf",
		"application/zip": "zip",
		"application/json": "json",
		"text/plain": "txt",
		"text/html": "html",
		"application/octet-stream": "bin"
	};

	mime = mime.split(";")[0].trim().toLowerCase();

	return map[mime] || null;
}

function createBatchFile(folderId, fileName) {
  var folder = DriveApp.getFolderById(folderId);
  
  var content = '@echo off\n\n' +
                'SETLOCAL ENABLEDELAYEDEXPANSION\n\n'+
                'SET "baseFileName=' + fileName +'"\n\n' + 
                'SET "sourceFolder=."\n\n' +
                'SET "finalFileName=%baseFileName%"\n\n' +
                'IF EXIST "%sourceFolder%\\%finalFileName%" DEL "%sourceFolder%\\%finalFileName%"\n\n' +
                'ECHO -= GDRemoteUpload File Joiner =-\n\n' +
                'ECHO Target file: %finalFileName%\n\n' +
                'SET /A partCounter=1\n'+
                ':loop\n' +
                'SET "currentPart=%sourceFolder%\\%baseFileName%.part!partCounter!"\n\n' +
                'IF EXIST "!currentPart!" (\n' +
                'ECHO Joining: !currentPart!\n' +
                'IF !partCounter! EQU 1 (\n' +
                'COPY /B "!currentPart!" "%sourceFolder%\\%finalFileName%" > NUL\n' +
                ') ELSE (\n' +
                'COPY /B "%sourceFolder%\\%finalFileName%" + "!currentPart!" "%sourceFolder%\\%finalFileName%" > NUL\n' +
                ')\n' +
                'SET /A partCounter+=1\n' +
                'GOTO loop\n' +
                ') ELSE (\n' +
                'ECHO All parts joined. The final file is available in the same folder.\n' +
                ')\n\n' +
                'ENDLOCAL\n' +
                'pause\n';
  
  var batFileName = "FileJoiner.bat";
  
  folder.createFile(batFileName, content, MimeType.PLAIN_TEXT);
}

