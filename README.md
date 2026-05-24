<div align="center">
  <h1>GDRemoteUpload</h1>
  <p><img width="360" src="https://github.com/AlirezaM1376/GDRemoteUpload/raw/refs/heads/main/GDRemoteUp_dark.jpg" /></p>
  <p>A simple and easy way to remote-upload files frome links to Google Drive</p>
</div>

## Setup instructions
1. Open https://script.google.com and sign-in to your Google account 
2. Click **New project**
3. **Clear** all the default code in the editor 
4. Open the **Code.gs** from this project using a text editor and copy all the contents
5. Paste the contents into the Code.gs in Google Apps Script editor
6. Create a new file using the **+** button and name it **GDRemoteUpload** and clear its default contents
7. Open the **GDRemoteUpload.html** from this project and copy all its contents into the online editor of the new file you created
8. Click **Deploy** => **New Deployment**
10. Choose **Web App** as type
11. Set:
    - **Execute as:** Me
    - **Who has access:** Me (only accessible when you're logged in) or Anyone (accessible even if you're logged out)
12. Click **Deploy**
13. Authorize/Confirm access
14. You'll receive Web App URL; open the URL and use it.

## Usage
1. Enter or paste a link to a file
2. Enter an optional name if needed. Original file name will be used as default.
3. Enter ID of the folder which you want to save the file there. As default the file will be saved in the root of your drive.
4. Click on Upload and wait. Dependig on the file size, uploading process can take up to minutes.
5. On successful upload you will receive the download link from GD or you can check the Google Drive separately.
6. If the size of the file goes more than 50 MB, the file will be splitted in parts. In this case you need to download all parts and then use the FileJoiner.bat to join the parts and receive the main file.


