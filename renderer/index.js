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

document.querySelector('#saveFile').addEventListener('click', async () => {
    await saveFile();
});

const getS3 = async () => {
    try {
        const accessKey = document.getElementById('input-accessKey').value;
        const secretKey = document.getElementById('input-secretKey').value;
        const bucket = document.getElementById('input-bucket').value;
        const key = document.getElementById('input-key').value;

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

        const preview = document.getElementById('preview');

        for (let s3Object of s3Objects) {
            let getparams = { Bucket: bucket, Key: s3Object.Key };
            let data = await s3.getObject(getparams).promise();
            var result = zlib.gunzipSync(data.Body).toString('utf-8');
            preview.textContent += result;
            preview.textContent += '\n';
        }
        ipcRenderer.send('savesetting', {
            accessKey: accessKey,
            secretKey: secretKey,
            bucket: bucket,
            key: key,
        });
    } catch (e) {
        console.error(e);
        alert('s3 error.\n' + e);
    }
};

//saveFileボタンが押されたとき
const saveFile = async () => {
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
        const preview = document.getElementById('preview');
        const data = preview.textContent;
        console.log(data);
        writeFile(fileName, data);
    }
};

//fileを保存（Pathと内容を指定）
const writeFile = async (path, data) => {
    fs.writeFile(path, data, error => {
        if (error != null) {
            alert('save error.');
            return;
        }
    });
};
