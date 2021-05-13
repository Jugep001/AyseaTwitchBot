const tmi = require('tmi.js');
const express = require("express");
const url = require('url');
const async = require("async");
const request = require('request');
const path = require('path');
const fs = require('fs');
const myURL = new URL('file://' + path.join(__dirname, 'mainWindow.html'));
require('dotenv').config();


const {app, BrowserWindow, Menu, ipcMain} = require('electron');
var uptime = '';
var Elo = '';
var LP = '';
var Wer = '';
var Game = '';
var Games = '';

//set env
process.env.NODE_ENV = 'production';

let mainWIndow;


//toDate function
Date.prototype.addHours= function(h){
    this.setHours(this.getHours()+h);
    return this;
};

//Notification


//Twitch api
var accessToken = '';


function gameRequest(accessToken){
    setTimeout(() => {
    const gameOptions = {
        url: 'https://api.twitch.tv/helix/streams?user_id=81245916',
        method: 'GET',
        headers:{
            'Client-ID': process.env.CLIENT_ID,
            'Authorization': 'Bearer ' + accessToken
        }
    }
    if(!accessToken){
        console.log("No Token");
    }else{
        console.log(gameOptions);
    
    const gameRequest = request.get(gameOptions,(err,res,body) => {
        if(err){
            return console.log(err);
        }
        
        const json_obj = JSON.parse(body);
        if(json_obj.data[0] !== undefined){
            uptime = json_obj.data[0].started_at;
        }
        
    });
    
    };
    
    },2000)
    }
const options = {
    url: 'https://id.twitch.tv/oauth2/token',
    json:true,
    body: {
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    grant_type: 'client_credentials'
    }
};






request.post(options, (err,res,body)=>{
    if(err){
        return console.log(err);
    }
    console.log('Status: ${res.statusCode}');
    console.log(body.access_token);
    gameRequest(body.access_token);
    
});

//MainWindow

//Listen for app to be ready
app.on('ready', function(){
    mainWindow = new BrowserWindow({
        webPreferences:{ //Put this in if you have require errors
            nodeIntegration:true, 
            contextIsolation:false
        }
    });
    //Load html into window
    mainWindow.loadURL(url.format(myURL));

    //Build menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    //Insert menu
    Menu.setApplicationMenu(mainMenu);

    //Quit app when closed
    mainWindow.on('closed', function(){
        app.quit();
    });


});


// Catch Elo:add
ipcMain.on('Elo:add', function(e, Elo_value){

    Elo = Elo_value;
    
});

// Catch Lp:add
ipcMain.on('Lp:add', function(e, Lp_value){

    LP = Lp_value;
    addToJson();

});

// Catch Wer:add
ipcMain.on('Wer:add', function(e, Wer_value){
    
    Wer = Wer_value;

});

// Catch Game:add
ipcMain.on('Game:add', function(e, Game_Value){
    
    Game = Game_Value;

});

// Catch Games:add
ipcMain.on('Games:add', function(e, Games_Value){
    
    Games = Games_Value;

});


//Append to Json
function addToJson(){
    var obj = {
        Elo: Elo,
        LP: LP
     };
    
            var json = JSON.stringify(obj); 
            fs.writeFile('Elo.json', json, 'utf8', function(err) {
                if (err) throw err;
                console.log('complete');
                }
            ); 
       
     
     
}



//Create menu template
const mainMenuTemplate = [
    
    {
        label: 'File',
        submenu:[
           
            {
                label:'Quit',
                accelerator: process.platform == 'darwin' ? 'Command+Q' :
                'Ctrl+Q',
                click(){
                    app.quit();
                }
            }

        ]
    }
];

//If mac, add empty object to menu
if(process.platform == 'darwin'){
    mainMenuTemplate.unshift({});
}

// Add developer tools item if not in production
if(process.env.NODE_ENV !== 'production'){
    mainMenuTemplate.push({
        label: 'Developer Tools',
        submenu:[
            {
                label: 'Toggle DevTools',
                accelerator: process.platform == 'darwin' ? 'Command+I' :
                'Ctrl+I',
                click(item, focusedWindow){
                    focusedWindow.toggleDevTools();
                }
            },
            {
                role: 'reload'
            }

        ]
    });
}


//TMI section
const Botoptions = {
    options: {
        debug: true,
    },
    connection: {
        cluster: 'aws',
        reconnect: true,
    },
    identity: {
        username: 'ayseabot',
        password: process.env.TWITCH_OATH_TOKEN,
        
    },
    channels: ['ayseatv', 'ayseabot'] //You can put more channels here
};

const client = new tmi.client(Botoptions);


client.connect();

client.on('connected', (address, port) => {
    
});

client.on('chat', (channel, user, message, self) => {
    switch (message){
    case '!wer':
        if(Wer === ''){
            client.action('ayseabot', `Aysea spielt mit niemanden`);
        }
        else{
            client.action('ayseabot', `Aysea spielt mit ${Wer}`);
        }
        
        break;
        
    case '!game':
        if(Game === ''){
            client.action('ayseabot', `Aysea spielt gerade nichts`);
        }
        else{
            client.action('ayseabot', `Aysea spielt gerade ${Game}`);
        }
        
        break;
    case '!upcoming':
        if(Games === ''){

            client.action('ayseabot', `Aysea spielt heute nichts`);
            
        }
        else{
            client.action('ayseabot', `Aysea spielt heute ${Games}`);
        }
            
        break;    
    case '!uptime':

        console.log(uptime);

        let time = new Date();
        //time.addHours(1); 
        let uptime_date = new Date(uptime);
        let uptime_difference = time.getTime() - uptime_date.getTime();
        let uptime_difference_date = new Date(uptime_difference);
        let hours = uptime_difference_date.getHours();
        let minutes = uptime_difference_date.getMinutes();
        let seconds = uptime_difference_date.getSeconds();
        
        if(!Number.isNaN(hours)){
            client.action('ayseabot', `Aysea ist seit ${hours} Stunden ${minutes} Minuten und ${seconds} Sekunden on`);
            break;
        }
        else{
            client.action('ayseabot', `Aysea ist gerade nicht on`);
            break;
        }
        break;
    case '!elo':
        fs.readFile('Elo.json', 'utf8', function readFileCallback(err, data){
            if (err){
                alert("Fehlende Datei!");
            } else {
            var Elo_object = JSON.parse(data); //now it an object
            client.action('ayseabot', `Aysea ist momentan ${Elo_object.Elo} mit ${Elo_object.LP} LP!`); 
        }});
        break;
    case '!social':
        var youtube = "YOUTUBE:https://www.youtube.com/channel/UCC-TbbEnKvFLVvcUyEvUn_w";
        var instagram = "INSTAGRAM:https://www.instagram.com/ayseax3/";
        var twitter = "TWITTER:https://twitter.com/Aysea_TV";
        client.action('ayseabot', `${youtube}`);
        client.action('ayseabot', `${instagram}`);
        client.action('ayseabot', `${twitter}`);
        break;
        
    default:
        break;
    }
});



