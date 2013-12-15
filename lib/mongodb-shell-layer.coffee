{exec} = require 'child_process'

module.exports = (app) ->
  app.commandline.commands['mongodb'] = mongodb_shell.bind(app)
  app.commandline.commands['mongodb'].help = 'mongodb [connection]'
  app.commandline.commands['mongodb'].description = 'Open a mongodb shell to your configured database\n  (uses the config.mongodb.url field)'

mongodb_shell = (connection, callback) ->
  betturl = require 'betturl'
  
  if typeof connection is 'function'
    callback = connection
    connection = null
  
  @execute 'init', =>
    config = @config.mongodb
    return callback(new Error('To access the mongodb shell, you must have a mongodb configuration')) unless config?
    
    if connection?
      config = config[connection]
      return callback(new Error('Could not find the ' + connection + ' connection in your mongodb configuration')) unless config?
    
    parsed = betturl.parse(config.url)
    host = parsed.hosts[0].host
    port = parsed.hosts[0].port
    
    command = 'mongo'
    command += " -u #{parsed.auth.user} -p #{parsed.auth.password}" if parsed.auth?.user? and parsed.auth?.password?
    command += " #{host}" + (if port? then ':' + port else '') + (parsed.path or '')
    
    switch require('os').type()
      when 'Darwin' then command = 'script -q /dev/null ' + command
      when 'Linux' then command = 'script -c "' + command + '" /dev/null'
    proc = exec(command)
    
    process.stdin.setRawMode(true)
    process.stdin.resume()
    
    proc.stdout.pipe(process.stdout)
    proc.stderr.pipe(process.stderr)
    process.stdin.pipe(proc.stdin)
    
    proc.on 'exit', -> callback()
    process.on 'exit', -> proc.kill('SIGKILL')
