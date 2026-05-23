# GDRemoteUpload
A simple and easy way to remote-upload files frome links to Google Drive

## Setup steps 
1. Open https://script.google.com and sign-in to your Google account 
2. Click **New project**
3. **Delete** all the default code in the editor 
4. Open the **Code.gs** from this project using a text editor and copy all the contents
5. Paste the contents into the Google Apps Script editor
6. Create a new file using the **+** button and name it **GDRemoteUpload.html**
7. Open the **GDRemoteUpload.html** from this project and paste it into the online editor of the new file you created
8. Click **Deploy** => **New Deployment**
9. Choose **Web Apps** as type
10. Set:
    - **Execute as:** Me
    - **Who has access:** Me (only accessible whenyou're logged in) or Anyone (accessible even if you're loggedout)
11. Click **Deploy**
12. You'll get Web App URL; open the link and use it

## Usage
1. Enter or paste a link to a file
2. Enter an optional name if needed. Original file name will be used as default.
3. Enter the ID of the folder which you want to save the file there. as default the file will be save in the root of your drive.
4. Click on Upload and wait. Dependig on file size, uploading process can take up to minutes.
5. On successful upload you will receive the download link from GD or you can check the Google Drive separately.
6. If the size of the file goes more than 50 MB, the file will be splitted in parts. in this case you need to download all parts and the use the FileJoiner.bat to join the parts and receive the main file.
