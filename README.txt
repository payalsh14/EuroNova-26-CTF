EURONOVA CTF - Google Sheets + Apps Script version
===================================================
No Node.js, no server, no hosting. You only need a Google account.
Students register, see their rooms, click a room to go to the official CyLab site, then submit the flag here.
Records are saved in a Google Sheet that the script creates in your Google Drive.

You will copy 3 files into one Google Apps Script project:
  Code.gs     (backend, holds your password and flags)
  index.html  (student page)
  judge.html  (judges' page)


SET UP (about 10 minutes)
-------------------------
1. Go to https://script.google.com and sign in. Click "New project".

2. Backend file
   - You see a file called Code.gs with a few lines of code. Delete everything in it.
   - Open Code.gs from this folder in Notepad (or any text editor), copy everything, paste it into the editor.
   - At the top, change JUDGE_PASSWORD to your own password.
   - Put each room's real flag between the quotes of "flag": "" (6 Juniors rooms, 5 Seniors rooms).
   - Check the Seniors room "Sudo Make Me a Sandwich": its link uses library/766, the same number as "Undo". Fix it if that is a mistake.

3. Student page
   - Click the + next to "Files" (left side), choose HTML, type the name:  index   (no .html, lowercase)
   - Delete what is in it, then paste the whole content of index.html from this folder.

4. Judges page
   - Click + > HTML again, name it:  judge
   - Delete what is in it, then paste the whole content of judge.html from this folder.

5. Click the Save icon (or Ctrl+S).

6. Deploy
   - Click Deploy (top right) > New deployment.
   - Click the gear icon next to "Select type" > Web app.
   - Description: Euronova CTF
   - Execute as:      Me
   - Who has access:  Anyone
   - Click Deploy.
   - Google asks you to authorise. Click "Authorize access", pick your account. If you see "Google hasn't verified this app", click Advanced > "Go to <project name> (unsafe)" > Allow. This is your own script; it is asking to create the records sheet in your Drive.
   - Copy the "Web app" URL (ends in /exec).

7. Your links
   - Students:  the Web app URL
   - Judges:    the same URL with  ?page=judge  added at the end
                example: https://script.google.com/macros/s/XXXX/exec?page=judge

8. Test before the event
   - Open the student link, register, open a room, submit a flag.
   - Open the judges link, sign in, check the student appears. Delete the test record
     (click the row, click "Delete this record", then click again to confirm).


IMPORTANT: AFTER YOU CHANGE ANYTHING
------------------------------------
Saving is not enough. To make a change go live: Deploy > Manage deployments > pencil icon >
Version: "New version" > Deploy. The link stays the same.


WHERE ARE THE RECORDS?
----------------------
In your Google Drive there is a spreadsheet called "Euronova CTF records".
- "Records" tab: readable table (group, student, team, points, solved, time, per-room details).
  It refreshes while the judges' page is open. Use File > Download > CSV for Excel.
- "Data" tab (hidden): the script's working data. Do not edit it. Do not share this spreadsheet
  with students (the hidden tab holds their session keys). The judges' page has an
  "Open Google Sheet" button for you.

Start fresh for a new event: open the spreadsheet, View > Hidden sheets > Data, and delete all rows
below row 1. (Or delete each record from the judges' page.)


GOOD TO KNOW
------------
- Each click takes about 1-2 seconds (Google's servers). It is fine for a school event.
  Google allows about 30 people to be processed at the same moment; others wait a moment in line.
- Ranking = most points, then lowest total solve time. A room's clock starts when the student first
  clicks "Open room" and stops when the correct flag is submitted.
- A student who registers again with the same group + name + team continues their own record.
- Judge sign-in lasts 12 hours. After 8 wrong passwords, sign-in pauses for a minute.
- Flags are only inside Code.gs, which only you can see. They are never sent to students' browsers.
