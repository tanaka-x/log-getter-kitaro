// アプリケーション作成用のモジュールを読み込み
const path = require('path');
const { app, ipcMain } = require('electron');
const Window = require('./Window');
const Datastore = require('./DataStore');

// ホットリロード機能を有効化
require('electron-reload')(__dirname);

// メインウィンドウ
let mainWindow;

const setting = new Datastore({ name: 'settingfile' });

const createWindow = () => {
    mainWindow = new Window({
        file: path.join('renderer', 'index.html'),
    });

    // initialize with todos
    mainWindow.once('show', () => {
        mainWindow.webContents.send('init', {
            accessKey: setting.accessKey,
            secretKey: setting.secretKey,
            bucket: setting.bucket,
            key: setting.key,
        });
    });

    ipcMain.on('savesetting', (event, param) => {
        setting.saveTodos(
            param.accessKey,
            param.secretKey,
            param.bucket,
            param.key,
        );
    });

    // デベロッパーツールの起動
    //mainWindow.webContents.openDevTools();

    // メインウィンドウが閉じられたときの処理
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};

// 初期化が完了した時の処理
app.on('ready', createWindow);

// 全てのウィンドウが閉じたときの処理
app.on('window-all-closed', () => {
    // macOSのとき以外はアプリケーションを終了させます
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
// アプリケーションがアクティブになった時の処理(Macだと、Dockがクリックされた時）
app.on('activate', () => {
    // メインウィンドウが消えている場合は再度メインウィンドウを作成する
    if (mainWindow === null) {
        createWindow();
    }
});
