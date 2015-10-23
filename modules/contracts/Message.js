var private = {},
    self = null,
    library = null,
    modules = null;

function Message(cb, _library) {
    self = this;
    self.type = 6
    library = _library;
    cb(null, self);
}

function getAccountDetails(keypair, cb) {

    var acc;
    modules.blockchain.accounts.getAccount({
        publicKey: keypair.publicKey.toString('hex')
    }, function(err, account) {
        if (err) {
            return cb(err);
        }
        acc = account;
    });
    return acc;
}

Message.prototype.create = function(data, trs) {

    trs.recipientId = data.recipientId;
    trs.asset = {
        message: data.message
    };
    trs.numLikes = data.numLikes;
    trs.numDislikes = data.numDislikes;
    trs.creditsIa = data.creditsIa;
    trs.address = data.sender.address;
    trs.credits = data.credits;
    trs.asset = {
        url: data.url
    };
    return trs;
}

Message.prototype.calculateFee = function(trs) {
    return 1000;
}

Message.prototype.verify = function(trs, sender, cb, scope) {
    if (trs.asset.message.length > 320) {
        return setImmediate(cb, "Max length of message is 320 characters");
    }

    setImmediate(cb, null, trs);
}

Message.prototype.getBytes = function(trs) {
    //return new Buffer(trs.asset.message, 'hex');
    var msgBuffer = new Buffer(trs.asset.message, 'utf8');
    var urlBuffer = new Buffer(trs.asset.url, 'utf8');
    return Buffer.concat([msgBuffer, urlBuffer]);
}

Message.prototype.apply = function(trs, sender, cb, scope) {
    modules.blockchain.accounts.mergeAccountAndGet({
        address: sender.address,
        balance: -trs.fee
    }, cb);
}

Message.prototype.undo = function(trs, sender, cb, scope) {
    modules.blockchain.accounts.undoMerging({
        address: sender.address,
        balance: -trs.fee
    }, cb);
}

Message.prototype.applyUnconfirmed = function(trs, sender, cb, scope) {
    if (sender.u_balance < trs.fee) {
        return setImmediate(cb, "Sender doesn't have enough coins");
    }

    modules.blockchain.accounts.mergeAccountAndGet({
        address: sender.address,
        u_balance: -trs.fee
    }, cb);
}

Message.prototype.undoUnconfirmed = function(trs, sender, cb, scope) {
    modules.blockchain.accounts.undoMerging({
        address: sender.address,
        u_balance: -trs.fee
    }, cb);
}

Message.prototype.ready = function(trs, sender, cb, scope) {
    setImmediate(cb);
}

Message.prototype.save = function(trs, cb) {
    modules.api.sql.insert({
        table: "asset_likes",
        values: {
            transactionId: trs.id,
            message: trs.asset.message,
            numLikes: trs.numLikes,
            numDislikes: trs.numDislikes
        }
    }, cb);

    modules.api.sql.insert({
        table: "asset_messages",
        values: {
            transactionId: trs.id,
            creditsIa: trs.creditsIa,
            publicKey: trs.address
        }
    }, cb);

    modules.api.sql.insert({
        table: "credits",
        values: {
            transactionId: trs.id,
            url: trs.asset.url,
            credits: trs.credits
        }
    }, cb);
}

Message.prototype.dbRead = function(row) {
    if (!row.a_l_transactionId) {
        return null;
    } else {
        return {
            message: row.a_l_message
        };
    }
}

Message.prototype.normalize = function(asset, cb) {
    library.validator.validate(asset, {
        type: "object", // It is an object
        properties: {
            message: { // It contains a message property
                type: "string", // It is a string
                minLength: 1 // Minimum length of string is 1 character
            }
        },
        required: ["message"] // Message property is required and must be defined
    }, cb);
}

Message.prototype.onBind = function(_modules) {
    modules = _modules;
    modules.logic.transaction.attachAssetType(self.type, self);
}

/***** this function accepts the credits from the ajax request ******/

Message.prototype.credit = function(cb, query) {
	
	library.validator.validate(query, {
        type: "object",
        properties: {
            recipientId: {
                type: "string",
                minLength: 1,
                maxLength: 21
            },
            secret: {
                type: "string",
                minLength: 1,
                maxLength: 100
            },
			url: {
                type: "string",
                minLength: 1,
                maxLength: 320
            },
			credits: {
                type: "BigInt"
            }
        }
    }, function(err) {

        // If error exists, execute callback with error as first argument
        if (err) {
            return cb(err[0].message);
        }
	
        var keypair = modules.api.crypto.keypair(query.secret);
        var account = getAccountDetails(keypair);

            var transaction = library.modules.logic.transaction.create({
                type: self.type,
                url: query.url,
                credits: query.credits,
                recipientId: query.recipientId,
                sender: account,
                keypair: keypair
            });

        console.log(transaction);
        modules.blockchain.transactions.processUnconfirmedTransaction(transaction, cb);
	});
}
/***** end credit *****************************/



Message.prototype.add = function(cb, query) {

    library.validator.validate(query, {
        type: "object",
        properties: {
            recipientId: {
                type: "string",
                minLength: 1,
                maxLength: 21
            },
            secret: {
                type: "string",
                minLength: 1,
                maxLength: 100
            }
        }
    }, function(err) {

        // If error exists, execute callback with error as first argument
        if (err) {
            return cb(err[0].message);
        }

        var keypair = modules.api.crypto.keypair(query.secret);
        modules.blockchain.accounts.getAccount({
            publicKey: keypair.publicKey.toString('hex')
        }, function(err, account) {
            // If error occurs, call cb with error argument
            if (err) {
                return cb(err);
            }

            try {
                var transaction = library.modules.logic.transaction.create({
                    type: self.type,
                    message: query.message,
                    creditsIa: query.creditsIa,
                    numLikes: query.numLikes,
                    numDislikes: query.numDislikes,
                    recipientId: query.recipientId,
                    sender: account,
                    keypair: keypair
                });
            } catch (e) {
                // Catch error if something goes wrong
                return setImmediate(cb, e.toString());
            }
            // Send transaction for processing
            modules.blockchain.transactions.processUnconfirmedTransaction(transaction, cb);
        });
    });
}


Message.prototype.list = function(cb, query) {

    // Verify query parameters
    library.validator.validate(query, {
        type: "object",
        properties: {
            recipientId: {
                type: "string",
                minLength: 2,
                maxLength: 21
            }
        },
        required: ["recipientId"]
    }, function(err) {
        if (err) {
            return cb(err[0].message);
        }

        var i = 0;
        var len;

        /* 
         select all inactive credits where publicKey = address. 
         NOTE: pubKey is the wrong column name. I'll change this when i have a better idea about 
         which field is the best to search by. 
        */
        var keypair = modules.api.crypto.keypair(query.secret);
        var account = getAccountDetails(keypair);
        var totalCreditsIa = 0;
        modules.api.sql.select({
            table: "asset_messages",
            alias: "tm",
            condition: {
                publicKey: account.address
            }
        }, ['publicKey', 'creditsIa', 'transactionId'], function(err, credits) {
            var creditsIaMap = credits.map(function(tx) {
                return tx.creditsIa
            });
            for (i = 0, len = creditsIaMap.length; i < len; i++) {
                totalCreditsIa += parseInt(creditsIaMap[i]);
            }
        });

        /***************** end select ****************/


        modules.api.sql.select({
            table: "asset_likes",
            alias: "t_al",
            condition: {
                message: query.message
            }
        }, ['message', 'numLikes', 'numDislikes'], function(err, transactions) {
            if (err) {
                return cb(err.toString());
            }

            // Map results to asset object
            //var msg = transactions.map(function (tx) { return tx.message });
            var likes = transactions.map(function(tx) {
                return parseInt(tx.numLikes);
            });
            var dislikes = transactions.map(function(tx) {
                return parseInt(tx.numDislikes);
            });

            var totalLikes = 0;
            var totalDislikes = 0;


            for (i = 0, len = likes.length; i < len; i++) {
                totalLikes += parseInt(likes[i]);
            }

            for (i = 0, len = dislikes.length; i < len; i++) {
                totalDislikes += parseInt(dislikes[i]);
            }

            return cb(null, {
                //messages: msg,
                likes: totalLikes,
                dislikes: totalDislikes,
                InactiveCredits: totalCreditsIa
            })
        });
    });
}


module.exports = Message;