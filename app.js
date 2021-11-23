const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var net = require('net');
const expressip = require('express-ip');

var requestIp = require('request-ip');
var ipFilter = require('express-ip-filter');
var expressDefend = require('express-defend');
var blacklist = require('express-blacklist');


const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 4,
    message: "Prea multe accesari a unei resurse inexistente de catre acest IP, incearca din nou dupa un minut."
});

const limiter2 = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 2,
    message: "Prea multe accesari a unei resurse inexistente de catre acest IP, incearca din nou dupa un minut."
});
var getClientIp = function(req) {
    var ipAddress = req.connection.remoteAddress;
    if (!ipAddress) {
        return '';
    }
    return ipAddress;
};

var fs = require('fs');
var s = require('fs');
var f = require('fs');
var b = require('fs');

const app = express();
const nodemailer = require('nodemailer');
const Email = require('email-templates');
require('dotenv').config();

var transporter  = nodemailer.createTransport({ 
    service:'gmail',
    auth:{ 
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

const port = 9876;
app.use(requestIp.mw({ attributeName: 'clientIp' }))
var urlencodedParser = bodyParser.urlencoded({ extended: false })
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static('public'));
app.use(expressLayouts);

app.use(session({
    key: 'session',
    secret: 'secret',
    resave: false,
    saveUninitialized: true,

}));

var mysql = require('mysql');
var db = mysql.createPool({
    connectionLimit: 50,
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: 'cristina',
    database: 'catalog',

});

app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.static('public'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()) 
app.use(express.urlencoded({ extended: true })) 
app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:`));

app.get('/about', (req, res) => { 
    res.render('about', {name:req.session.username});
});

app.get('/contact', (req, res) => { 
    res.render('contact', {name:req.session.username});
});
app.post('/contact-submit', (req, res)=>
{ 
    const email = new Email({
        transport:transporter,
        preview: false,
        send:true,
        message:{
            from: 'scoala.ta.iasi@gmail.com',
        }
    });

    email.send({ 
        template: 'contact',
        message:{
            to: req.body.email,
        },
        locals: { 
               
                prenume: req.body.prenume,
                telefon: req.body.telefon
            }
    }).then(()=>{console.log('email sent'); res.redirect('contact')
     })
      .catch((err)=>console.error(err));

});

app.get('/', (req, res) => {
  
    var sqlCommand = "SELECT * FROM elevi";
    db.getConnection(function(error) {
        if (error) { console.log("Conexiune la DB: ERROR !" + error.message); } else {
            console.log("Conexiune la DB: SUCCES !");
        }
        db.query(sqlCommand, function(err, result, fields) {

            if (err) {
                console.log("Eroare executare query: " + err.message);
            } else {
                console.log('Afisare efectuata cu succes!');

                f.readFile('utilizatori.json', (err, data) => {
                    if (err) console.log(err);
                    const userData = JSON.parse(data);
                    res.render('index', { elevi: result, sesiune: req.session.utilizator, users: userData });
                });
            }
        });
    });
});

app.get('/autentificare', limiter, (req, res) => {

    req.session.utilizator = undefined;
    res.render('autentificare', { sesiune: req.session.mesajEroare, logat: req.session.utilizator });

});

app.post('/verificare-autentificare', urlencodedParser, (req, res) => {

    s.readFile('utilizatori.json', (err, data) => {
        if (err) console.log(err);
        const userData = JSON.parse(data);
        for (let i = 0; i < userData.length; ++i) {
            if (req.body.utilizator == userData[i].utilizator) {

                console.log('utilizator corect');

                if (req.body.parola == userData[i].parola) {

                    console.log('parola corecta');
                    req.session.mesajEroare = undefined;
                    req.session.utilizator = req.body.utilizator;
    
                    req.session.detaliiUtilizator = "Nume: " + userData[i].nume + " ; Prenume: " + userData[i].prenume + " ; Email: " + userData[i].email + " ;  Telefon: " + userData[i].telefon;
                    req.session.tipUtilizator = userData[i].tip;
                    req.session.cos = " ";
                    req.session.cosCumparaturi = " ";
                    console.log(userData[i].tip);

                    res.redirect(302, '/');
                    return;
                } else {
                    console.log('Parola incorecta');
                    req.session.mesajEroare = "Parola incorecta!";
                    res.redirect(302, '/autentificare');
                    return;
                }
            }
        }
        req.session.mesajEroare = "Nume utilizator incorect!";
        res.redirect(302, '/autentificare');
    });
});

app.get('/delogare', (req, res) => {

    req.session.utilizator = undefined;
    res.redirect(302, '/autentificare');
});

app.get('/creare-bd', (req, res) => {

    var sqlCommand = 'CREATE TABLE IF NOT EXISTS elevi ( id_elev int(2) NOT NULL auto_increment,nume_elev varchar(100) NOT NULL,materia varchar(100) NOT NULL,nota int(3) NOT NULL,data DATE NOT NULL,PRIMARY KEY (id_elev))';
    db.getConnection(function(error) {
        if (error) { console.log("Conexiune la DB: ERROR !" + error.message); } else {
            console.log("Conexiune la DB: SUCCES !");
        }
        db.query(sqlCommand, function(err, result) {

            if (err) {
                console.log("Eroare executare query: " + err.message);
            } else {
                console.log('Tabela creata cu succes!');
                res.redirect(302, '/');
            }
        });
    });
});

app.get('/inserare-bd', (req, res) => {

    var sql = 'INSERT INTO elevi(nume_elev,materia,nota,data) VALUES ?';
    var values = [
        ['Codreanu Cristina', 'Limba Romana', 10, '2020-07-20'],
        ['Codreanu Cristina', 'Limba Romana', 10, '2020-07-28'],
        ['Codreanu Cristina', 'Matematica', 10, '2020-07-24'],
        ['Codreanu Cristina', 'Matematica', 9, '2020-09-12'],
        ['Codreanu Cristina', 'Limba Franceza', 10, '2020-08-20'],
        ['Codreanu Cristina', 'Limba Franceza', 10, '2020-07-20']
        ]
  
    var sqlDel = "DELETE FROM elevi";

    var sqlSelect = "SELECT * FROM elevi";

    db.getConnection(function(error) {
        if (error) { console.log("Conexiune la DB: ERROR !" + error.message); } else {
            console.log("Conexiune la DB: SUCCES !");
        }

        db.query(sqlDel, function(err, result) {

            if (err) {
                console.log("Eroare executare query: " + err.message);
            } else {
                console.log('Stergerea a fost efectuata cu succes!');

            }
        });
        db.query(sql, [values], function(err, result) {

            if (err) {
                console.log("Eroare executare query: " + err.message);
            } else {
                console.log('Inserare efectuata cu succes! Au fost inserate ' + result.affectedRows);

                res.redirect(302, '/');
            }
        });

    });


});



app.get('/afisare-bd', (req, res) => {

    var sqlCommand = "SELECT * FROM elevi";
    db.getConnection(function(error) {
        if (error) { console.log("Conexiune la DB: ERROR !" + error.message); } else {
            console.log("Conexiune la DB: SUCCES !");
        }
        db.query(sqlCommand, function(err, result, fields) {

            if (err) {
                console.log("Eroare executare query: " + err.message);
            } else {
                console.log('Afisare efectuata cu succes!');
                f.readFile('utilizatori.json', (err, data) => {
                    if (err) console.log(err);
                    const userData = JSON.parse(data);

                    res.render('index', { elevi: result, sesiune: req.session.utilizator, users: userData });
                });
            }
        });
    });
});

app.get('/admin', (req, res) => {

    var sqlCommand = "SELECT * FROM elevi";
    db.getConnection(function(error) {
        if (error) { console.log("Conexiune la DB: ERROR !" + error.message); } else {
            console.log("Conexiune la DB: SUCCES !");
        }
        db.query(sqlCommand, function(err, result, fields) {

            if (err) {
                console.log("Eroare executare query: " + err.message);
            } else {

                f.readFile('utilizatori.json', (err, data) => {
                    if (err) console.log(err);
                    const userData = JSON.parse(data);
                    res.render('admin', { elevi: result, sesiune: req.session.utilizator, users: userData });
                });
            }
        });
    });
});

app.post('/adauga_elev', (req, res) => {

    let prod = JSON.stringify(req.body);
    let prodJs = JSON.parse(prod);

    var nume_elev = prodJs.nume_elev;
    var materia = prodJs.materia;
    var nota = prodJs.nota;
    var data = prodJs.data;
     var sqlInserare = "INSERT INTO elevi(nume_elev,materia,nota,data) VALUES ?";
    var values = [
        [nume_elev,materia,nota,data]
    ]
    db.getConnection(function(error) {
        if (error) { console.log("Conexiune la DB: ERROR !" + error.message); } else {
            console.log("Conexiune la DB: SUCCES !");
        }
        db.query(sqlInserare, [values], function(err, result) {
            if (err) {
                console.log("Eroare executare query: " + err.message);
            } else {
                console.log('Inserarea a fost efectuata cu succes!');
                res.redirect(302, '/');
            }
        });
    });
});

app.get('/2', (req, res) => {
  
    var sqlCommand = "SELECT * FROM absente";
    db.getConnection(function(error) {
        if (error) { console.log("Conexiune la DB: ERROR !" + error.message); } else {
            console.log("Conexiune la DB: SUCCES !");
        }
        db.query(sqlCommand, function(err, result, fields) {
            if (err) {
                console.log("Eroare executare query: " + err.message);
            } else {
                console.log('Afisare efectuata cu succes!');
                f.readFile('utilizatori.json', (err, data) => {
                    if (err) console.log(err);
                    const userData = JSON.parse(data);
                    res.render('index2', { absente: result, sesiune: req.session.utilizator, users: userData });
                });
            }
        });
    });
});

app.get('/creare-bd-lista', (req, res) => {

    var sqlCommand = 'CREATE TABLE IF NOT EXISTS absente ( id_elev int(2) NOT NULL auto_increment,nume_elev varchar(100) NOT NULL,materia varchar(100) NOT NULL,data DATE NOT NULL,PRIMARY KEY (id_elev))';
    db.getConnection(function(error) {
        if (error) { console.log("Conexiune la DB: ERROR !" + error.message); } else {
            console.log("Conexiune la DB: SUCCES !");
        }
        db.query(sqlCommand, function(err, result) {
            if (err) {
                console.log("Eroare executare query: " + err.message);
            } else {
                console.log('Tabela creata cu succes!');
                res.redirect(302, '/2');
            }
        });
    });
});

app.get('/inserare-bd-lista', (req, res) => {

    var sql = 'INSERT INTO absente(nume_elev,materia,data) VALUES ?';
    var values = [
        ['Codreanu Andreea','Matematica', '2020-07-22'],
        ['Popa Maria','Biologie','2020-07-23'],
        ['Gheorghe Elena','Fizica', '2020-07-24'],
        ['Radu Alex', 'Matematica','2020-09-12'],
        ['Alexa Matei','Fizica', '2020-08-20'],
        ['Cocuz Roxana','Biologie', '2020-07-20']
        ]
 
    var sqlDel = "DELETE FROM absente";

    var sqlSelect = "SELECT * FROM absente";

    db.getConnection(function(error) {
        if (error) { console.log("Conexiune la DB: ERROR !" + error.message); } else {
            console.log("Conexiune la DB: SUCCES !");
        }

        db.query(sqlDel, function(err, result) {

            if (err) {
                console.log("Eroare executare query: " + err.message);
            } else {
                console.log('Stergerea a fost efectuata cu succes!');

            }
        });
        db.query(sql, [values], function(err, result) {

            if (err) {
                console.log("Eroare executare query: " + err.message);
            } else {
                console.log('Inserare efectuata cu succes! Au fost inserate ' + result.affectedRows);

                res.redirect(302, '/2');
            }
        });

    });


});


app.get('/afisare-bd-lista', (req, res) => {

    var sqlCommand = "SELECT * FROM absente";
    db.getConnection(function(error) {
        if (error) { console.log("Conexiune la DB: ERROR !" + error.message); } else {
            console.log("Conexiune la DB: SUCCES !");
        }
        db.query(sqlCommand, function(err, result, fields) {

            if (err) {
                console.log("Eroare executare query: " + err.message);
            } else {
                console.log('Afisare efectuata cu succes!');
                f.readFile('utilizatori.json', (err, data) => {
                    if (err) console.log(err);
                    const userData = JSON.parse(data);
                    res.render('index2', { absente: result, sesiune: req.session.utilizator, users: userData });
                });
            }
        });
    });
});


app.get('/admin2', (req, res) => {

    var sqlCommand = "SELECT * FROM absente";
    db.getConnection(function(error) {
        if (error) { console.log("Conexiune la DB: ERROR !" + error.message); } else {
            console.log("Conexiune la DB: SUCCES !");
        }
        db.query(sqlCommand, function(err, result, fields) {
            if (err) {
                console.log("Eroare executare query: " + err.message);
            } else {
                f.readFile('utilizatori.json', (err, data) => {
                    if (err) console.log(err);
                    const userData = JSON.parse(data);

                    res.render('admin2', { absente: result, sesiune: req.session.utilizator, users: userData });
                });
            }
        });
    });
});


app.post('/adauga_absenta', (req, res) => {

    let prod = JSON.stringify(req.body);
    let prodJs = JSON.parse(prod);

    var nume_elev = prodJs.nume_elev;
    var materia = prodJs.materia;
    var data = prodJs.data;

    var sqlInserare = "INSERT INTO absente(nume_elev,data) VALUES ?";
    var values = [
        [nume_elev,materia,data]
    ]
    db.getConnection(function(error) {
        if (error) { console.log("Conexiune la DB: ERROR !" + error.message); } else {
            console.log("Conexiune la DB: SUCCES !");
        }
        db.query(sqlInserare, [values], function(err, result) {

            if (err) {
                console.log("Eroare executare query: " + err.message);
            } else {
                console.log('Inserarea a fost efectuata cu succes!');
                res.redirect(302, '/2');
            }
        });

    });
});

app.post('/adauga_cos_lista', (req, res) => {

    var absente = Object.keys(req.body);

    let prod = JSON.stringify(req.body);
    let prodJs = JSON.parse(prod);

    req.session.cos += "\n" + "Nume elev:  " + prodJs.nume_elev  + "Materia: "+prodJs.materia+ "        Data:" + prodJs.data;
    console.log(req.session.cos);
    var id_produs = prodJs.id_elev;

    var sqlSelect = "SELECT * FROM  absente  WHERE id_elev =  ?";
    db.getConnection(function(error) {
        if (error) { console.log("Conexiune la DB: ERROR !" + error.message); } else {
            console.log("Conexiune la DB: SUCCES !");
        }
        db.query(sqlSelect, [id_produs], function(err, result) {

            if (err) {
                console.log("Eroare executare query: " + err.message);
            } else {
                req.session.cosCumparaturi = result;
                res.render('vizualizare-cos', { detaliiUtilizator: req.session.detaliiUtilizator, logat: req.session.utilizator, absente: req.session.cosCumparaturi, tipUtilizator: req.session.tipUtilizator, cos: req.session.cos });
            }
        });

    });
    console.log(req.session.detaliiUtilizator);
});

var getClientIp = function(req) {
    var ipAddress = req.connection.remoteAddress;
    if (!ipAddress) {
        return '';
    }

    return ipAddress;

};
app.get('*', limiter2, function(req, res, next) {
    var ipAddress = getClientIp(req);
    var ipType = net.isIP(ipAddress);
 
    var BLACKLIST = [ipAddress];
    console.log(BLACKLIST);
    b.writeFile('blacklist.txt', BLACKLIST[0], function(err) {
            if (err) return console.log(err);

            console.log("Scriere efectuata");
        })
 
    res.send('Ai accesat o resursa inexistenta pe server! Ip.ul tau este:' + BLACKLIST + ' si este de tip  IPv' + ipType + '\n');

})

app.use(blacklist.blockRequests('blacklist.txt'));

app.use(expressDefend.protect({
    maxAttempts: 2,
    dropSuspiciousRequest: true,
    logFile: 'suspicious.log',
    onMaxAttemptsReached: function(ipAddress, url) {
        blacklist.addAddress(ipAddress);
    }
}));