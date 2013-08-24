(function () {
    /*jslint node: true */
    'use strict';

    var cfg = require('./config');
    var https = require('https');
    var async = require('async');

    var confirm = function (question, test, confusion, callback) {
        var stdin = process.stdin, stdout = process.stdout;
        stdin.setEncoding('utf8');

        stdin.resume();
        stdout.write(question + ': ');

        stdin.once('data', function (data) {
             if(test(data)) {
                callback(data.trim());
             }
             else {
                stdout.write(confusion + '\n');
                confirm(question, test, confusion, callback);
             }
        });
    };

    var test = function (input) {
        return (/^(yes|no|quit)\n/).test(input);
    };

    // first read all gists
    // foreach gist id prompt if user wants to delete gist
    // if yes, delete gist
    var readAllGists = function () {
        var getGistsOptions = {
            host: 'api.github.com',
            port: 443,
            path: '/gists',
            method: 'GET',
            headers: {
                'Authorization': 'token ' + cfg.github_token,
                'Content-Type': 'application/json'
            }
        };

        var req = https.request(getGistsOptions, function (res) {
            if(res.statusCode !== 200) {
                throw {msg: 'Could Not Read Gists', code: res.statusCode};
            }

            var output = '';
            res.on('data', function (chunk) {
                output += chunk;
            });

            res.on('end', function () {
                var jsonGists = JSON.parse(output);
                iterateOverGists(jsonGists);

            });
        });

        req.on('error', function (err) {
            throw err;
        });
        req.end();
    };

    var iterateOverGists = function (jsonGists)  {
        console.log('Found ' + jsonGists.length + ' gists.');

        async.eachSeries(jsonGists, function (gist, done) {

            confirm('delete the following gist ? (' + gist.description + ')', test, 'sorry, didn\'t catch that (yes, no, quit)', function (res) {
                if(res === 'yes') {
                    console.log('OK, I will delete this');
                    deleteGist(gist.id, function (err) {
                        done(err);
                    });
                }
                else if(res === 'no'){
                    console.log('Alright, I will keep this');
                    done();
                } else {
                    console.log('Stopping now');
                    done({msg: 'Early Termination'});
                }
            });
        }, function (err) {
            if(err) {
                if(err.msg !== null && err.msg === 'Early Termination') {
                    console.log('exiting');
                }
                else {
                    console.log(err);
                    throw err;
                }
            }

            console.log('finished');
        });
    };

    var deleteGist = function (gistId, callback) {
        var deleteGistsOptions = {
            host: 'api.github.com',
            port: 443,
            path: '/gists/' + gistId,
            method: 'DELETE',
            headers: {
                'Authorization': 'token ' + cfg.github_token,
                'Content-Type': 'application/json; charset=UTF-8'
            }
        };

        var req = https.request(deleteGistsOptions, function (res) {
            res.setEncoding('utf8');

            if(res.statusCode === 204) {
                console.log('deleted gist: ' + gistId);
                callback();
                return;
            }
            else {
                callback({statusCode: res.statusCode});
                return;
            }
        });

        req.on('error', function (err) {
            callback(err);
        });

        req.end();
    };

    readAllGists();

}).call(this);