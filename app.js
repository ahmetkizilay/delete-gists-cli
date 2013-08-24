(function () {
    /*jslint node: true */
    'use strict';

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
        return '/^(yes|no)\n/'.test(input);
    };

    confirm('can I delete this?', test, 'sorry, didn\'t catch that (yes or no)', function (res) {
        if(res === 'yes') {
            console.log('positive');
        }
        else {
            console.log('negative');
        }

        process.exit();
    });

}).call(this);