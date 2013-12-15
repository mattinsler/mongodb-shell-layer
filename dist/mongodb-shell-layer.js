(function() {
  var exec, mongodb_shell;

  exec = require('child_process').exec;

  module.exports = function(app) {
    app.commandline.commands['mongodb'] = mongodb_shell.bind(app);
    app.commandline.commands['mongodb'].help = 'mongodb [connection]';
    return app.commandline.commands['mongodb'].description = 'Open a mongodb shell to your configured database\n  (uses the config.mongodb.url field)';
  };

  mongodb_shell = function(connection, callback) {
    var betturl,
      _this = this;
    betturl = require('betturl');
    if (typeof connection === 'function') {
      callback = connection;
      connection = null;
    }
    return this.execute('init', function() {
      var command, config, host, parsed, port, proc, _ref, _ref1;
      config = _this.config.mongodb;
      if (config == null) {
        return callback(new Error('To access the mongodb shell, you must have a mongodb configuration'));
      }
      if (connection != null) {
        config = config[connection];
        if (config == null) {
          return callback(new Error('Could not find the ' + connection + ' connection in your mongodb configuration'));
        }
      }
      parsed = betturl.parse(config.url);
      host = parsed.hosts[0].host;
      port = parsed.hosts[0].port;
      command = 'mongo';
      if ((((_ref = parsed.auth) != null ? _ref.user : void 0) != null) && (((_ref1 = parsed.auth) != null ? _ref1.password : void 0) != null)) {
        command += " -u " + parsed.auth.user + " -p " + parsed.auth.password;
      }
      command += (" " + host) + (port != null ? ':' + port : '') + (parsed.path || '');
      switch (require('os').type()) {
        case 'Darwin':
          command = 'script -q /dev/null ' + command;
          break;
        case 'Linux':
          command = 'script -c "' + command + '" /dev/null';
      }
      proc = exec(command);
      process.stdin.setRawMode(true);
      process.stdin.resume();
      proc.stdout.pipe(process.stdout);
      proc.stderr.pipe(process.stderr);
      process.stdin.pipe(proc.stdin);
      proc.on('exit', function() {
        return callback();
      });
      return process.on('exit', function() {
        return proc.kill('SIGKILL');
      });
    });
  };

}).call(this);
