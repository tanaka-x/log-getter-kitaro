const { ipcRenderer } = require('electron');
const { BrowserWindow, dialog } = require('electron').remote;
const fs = require('fs');
const aws = require('aws-sdk');
const zlib = require('zlib');

ipcRenderer.on('init', (event, setting) => {
    document.getElementById('input-accessKey').value = setting.accessKey
        ? setting.accessKey
        : '';
    document.getElementById('input-secretKey').value = setting.secretKey
        ? setting.secretKey
        : '';
    document.getElementById('input-bucket').value = setting.bucket
        ? setting.bucket
        : '';
    document.getElementById('input-key').value = setting.key ? setting.key : '';
});

document.querySelector('#getS3').addEventListener('click', async () => {
    await getS3();
});

const getS3 = async () => {
    try {
        const accessKey = document.getElementById('input-accessKey').value;
        const secretKey = document.getElementById('input-secretKey').value;
        const bucket = document.getElementById('input-bucket').value;
        const key = document.getElementById('input-key').value;

        document.getElementById('input-accessKey').disabled = true;
        document.getElementById('input-secretKey').disabled = true;
        document.getElementById('input-bucket').disabled = true;
        document.getElementById('input-key').disabled = true;

        aws.config.update({
            region: 'ap-northeast-1',
            credentials: new aws.Credentials(accessKey, secretKey),
        });

        const s3 = new aws.S3();

        const listparams = {
            Bucket: bucket,
            Prefix: key,
            MaxKeys: 100,
        };
        const s3listObjects = await s3.listObjectsV2(listparams).promise();
        const s3Objects = s3listObjects.Contents.filter(
            s3Object => s3Object.Size > 0,
        );

        let preview = document.getElementById('preview');
        preview.textContent = 'start\n';
        let savetext = '';

        for (const [index, s3Object] of s3Objects.entries()) {
            let getparams = { Bucket: bucket, Key: s3Object.Key };
            let data = await s3.getObject(getparams).promise();
            var result = zlib.gunzipSync(data.Body).toString('utf-8');
            preview.textContent += index + 1 + '/' + s3Objects.length + '\n';
            preview.scrollTop = preview.scrollHeight;
            savetext += result;
            savetext += '\n';
        }

        preview.textContent += 'complete!';
        preview.scrollTop = preview.scrollHeight;
        await saveFile(savetext);

        ipcRenderer.send('savesetting', {
            accessKey: accessKey,
            secretKey: secretKey,
            bucket: bucket,
            key: key,
        });
    } catch (e) {
        console.error(e);
        alert('s3 error.\n' + e);
    } finally {
        document.getElementById('input-accessKey').disabled = false;
        document.getElementById('input-secretKey').disabled = false;
        document.getElementById('input-bucket').disabled = false;
        document.getElementById('input-key').disabled = false;
    }
};

//saveFileボタンが押されたとき
const saveFile = async savetext => {
    try {
        const win = BrowserWindow.getFocusedWindow();
        const fileName = dialog.showSaveDialogSync(win, {
            properties: ['openFile'],
            filters: [
                {
                    name: 'Document',
                    extensions: ['txt'],
                },
            ],
        });
        if (fileName) {
            fs.writeFileSync(fileName, savetext, { flags: 'w' });
        }
    } catch (e) {
        alert('save error.');
        return;
    }
};
