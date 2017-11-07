/*
 * Copyright (c) 2017, Joyent, Inc.
 *
 * `jirash versions ...`
 */

var tabula = require('tabula');
var UsageError = require('cmdln').UsageError;
var vasync = require('vasync');
var VError = require('VError');

var common = require('../common');


var columnsDefault = 'name,releaseDate,released,archived'.split(/,/g);
var columnsDefaultLong = 'id,name,releaseDate,released,archived'.split(/,/g);
var sortDefault = 'releaseDate'.split(/,/g);

function do_versions(subcmd, opts, args, cb) {
    if (opts.help) {
        this.do_help('help', {}, [subcmd], cb);
        return;
    } else if (args.length !== 1) {
        return cb(new UsageError('incorrect number of args'));
    }

    var self = this;
    var log = this.log;
    var proj = args[0];

    var columns = columnsDefault;
    if (opts.o) {
        columns = opts.o;
    } else if (opts.long) {
        columns = columnsDefaultLong;
    }

    vasync.pipeline({arg: {cli: this}, funcs: [
        function getVers(ctx, next) {
            ctx.cli.jirashApi.listVersions(proj, function (err, vers) {
                ctx.vers = vers;
                next(err);
            });
        },

        function filterVers(ctx, next) {
            if (opts.a) {
                ctx.vers = ctx.vers.filter(
                    function (v) { return !v.archived; });
            }
            if (opts.r) {
                ctx.vers = ctx.vers.filter(
                    function (v) { return !v.released; });
            }
            next();
        },

        function listVers(ctx, next) {
            if (opts.json) {
                common.jsonStream(ctx.vers);
            } else {
                tabula(ctx.vers, {
                    skipHeader: opts.H,
                    columns: columns,
                    sort: opts.s
                });
            }
            next();
        }
    ]}, cb);
}

do_versions.options = [
    {
        names: ['help', 'h'],
        type: 'bool',
        help: 'Show this help.'
    },
    {
        names: ['a'],
        type: 'bool',
        help: 'Exclude archived versions.'
    },
    {
        names: ['r'],
        type: 'bool',
        help: 'Exclude released versions.'
    }
].concat(common.getCliTableOptions({
    includeLong: true,
    sortDefault: sortDefault
}));

do_versions.synopses = ['{{name}} {{cmd}} [OPTIONS] PROJECT'];

do_versions.completionArgtypes = ['jirashproject', 'none'];

do_versions.help = [
    'List versions for the given project.',
    '',
    '{{usage}}',
    '',
    '{{options}}'
].join('\n');

module.exports = do_versions;