
const util = require('util');
const ping = require('ping');
const execPromise = util.promisify(require('child_process').execFile);

const speedTestArgs = ['-f', 'json-pretty', '-u', 'bps', '--accept-license' ];

async function checkConnection() {
  const res = await ping.promise.probe('www.google.com');

  // Observe and store packet loss here
  
  return res.alive;
}

async function getResults() {
  await execPromise('speedtest', speedTestArgs,  (err, stdout, stderr) => {
    if(err) {
      // Here we'll log in the database an outage whenever we hit an error
      // Both tables will be read and sorted in chrono order for reports
      console.log(err);
      if(err.signal === 'SIGSEGV') {
        // this error usually means a failure on speedtest, so 
        // we want to run it recursively until it returns something
        getResults();
      }
      if(err.code === 2) {
        console.log('outage')
      }
    } else {
      // Here I want to take all of the pertinent data and store in a database
      // to come back and create reports for day, week, month
      const res = JSON.parse(stdout);
      console.log(`Download: ${res.download.bandwidth / 125000}Mbps\n` +
                   `Upload: ${res.upload.bandwidth / 125000}Mbps\n` +
                   `Ping: ${res.ping.latency * 10}ms`)
    }
  })

}

async function app() {
  const connected = await checkConnection();
  if(connected){
    getResults();
  } else {
    console.log('outage')
    // log outage here
  }
}

app();