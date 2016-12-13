// Forked from showModalDialog Polyfill by Jerzy Głowacki under Apache 2.0 License (https://github.com/niutech/showModalDialogPolyfill)
// Requires jquery and bootstrap
(function() {
    window.spawn = window.spawn || function(gen) {
        function continuer(verb, arg) {
            var result;
            try {
                result = generator[verb](arg);
            } catch (err) {
                return Promise.reject(err);
            }
            if (result.done) {
                return result.value;
            } else {
                return Promise.resolve(result.value).then(onFulfilled, onRejected);
            }
        }
        var generator = gen();
        var onFulfilled = continuer.bind(continuer, 'next');
        var onRejected = continuer.bind(continuer, 'throw');
        return onFulfilled();
    };

    window.showModalDialogPolyfill = function(url, arg, opt) {
        url = url || ''; //URL of a dialog
        arg = arg || null; //arguments to a dialog
        opt = opt || 'dialogWidth:300px;dialogHeight:200px'; //options: dialogTop;dialogLeft;dialogWidth;dialogHeight or CSS styles
        var style = opt.replace(/dialog/gi, '');
        var contentsStyle = (style.match(/(width|height):\s*\d+\w*/gi) || []).join(';'); // extract width and height
        var style = opt.replace(/(width|height):\s*\d+\w*;*/gi, '');

        var caller = showModalDialogPolyfill.caller.toString();
        var dialog = document.body.appendChild(document.createElement('div'));
        var dialogInner = dialog.appendChild(document.createElement('div'));
        var dialogContents = dialogInner.appendChild(document.createElement('div'));

        dialog.setAttribute('style', style);
        dialogContents.setAttribute('style', contentsStyle);

        dialog.setAttribute('class', 'modal fade');
        dialog.setAttribute('tabindex', '-1');
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-hidden', 'true');

        dialogInner.setAttribute('class', 'modal-dialog');
        dialogContents.setAttribute('class', 'modal-content');

        dialogContents.innerHTML = '<a href="#" id="dialog-close" style="position: absolute; top: 0; right: 4px; font-size: 20px; color: #000; text-decoration: none; outline: none;">&times;</a><iframe id="dialog-body" src="' + url + '" style="border: 0; width: 100%; height: 100%;"></iframe>';
        document.getElementById('dialog-body').contentWindow.dialogArguments = arg;
        document.getElementById('dialog-close').addEventListener('click', function(e) {
            e.preventDefault();
            dialog.close();
        });

        $(dialog).modal('show');

        //if using yield
        if(caller.indexOf('yield') >= 0) {
            return new Promise(function(resolve, reject) {
                dialog.addEventListener('close', function() {
                    var returnValue = document.getElementById('dialog-body').contentWindow.returnValue;
                    document.body.removeChild(dialog);
                    resolve(returnValue);
                });
            });
        }
        //if using eval
        var isNext = false;
        var nextStmts = caller.split('\n').filter(function(stmt) {
            if(isNext || stmt.indexOf('showModalDialogPolyfill(') >= 0)
                return isNext = true;
            return false;
        });
        dialog.addEventListener('close', function() {
            var returnValue = document.getElementById('dialog-body').contentWindow.returnValue;
            document.body.removeChild(dialog);
            nextStmts[0] = nextStmts[0].replace(/(window\.)?showModalDialogPolyfill\(.*\)/g, JSON.stringify(returnValue));
            eval('{\n' + nextStmts.join('\n'));
        });
        throw 'Execution stopped until showModalDialogPolyfill is closed';
    };
})();
