const httpServer = require('http-server');
const should = require('chai').should();
var path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer')
const { percySnapshot } = require('@percy/puppeteer')
const platform = require("os").platform()
// We need to change the args passed to puppeteer based on the platform they're using
const puppeteerArgs = /^win/.test(platform) ? ['--no-sandbox'] : [ '--no-sandbox' ]
const PORT = process.env.PORT_NUMBER || 8000;
const TEST_URL = `http://localhost:${PORT}/`


describe('Snapshot', function() {
  let page
  let server
  let browser

  before(() => {
    server = httpServer.createServer({ root: `${__dirname}/..`})
    server.listen(PORT)
  });

  after(() => {
    server.close()
  });

  beforeEach(async function() {
    // Create a new Puppeteer browser instace for each test case
    browser = await puppeteer.launch({
      headless: true,
      timeout: 10000,
      args: puppeteerArgs
    })
    page = await browser.newPage()
  })

  afterEach(function() {
    // Close the Puppeteer browser instance.
    browser.close()
  })
  launchHtmlView('./','.html');
 
  function launchHtmlView(startPath,filter){

      //console.log('Starting from dir '+startPath+'/');

      if (!fs.existsSync(startPath)){
          return;
      }

      var files=fs.readdirSync(startPath);
      for(var i=0;i<files.length;i++){
          var filename=path.join(startPath,files[i]);
          var stat = fs.lstatSync(filename);
          console.log("filamen:"+ filename + " detected");
          if (stat.isDirectory() && (filename.indexOf("..")<0 && filename.indexOf("./")<0 && filename.indexOf("node_modules")<0 && filename.indexOf("tests")<0)) {
            console.log("Subdirectory:"+ filename + " detected");
            launchHtmlView(filename,filter); //recurse
          }
          else if (filename.indexOf(filter)>=0) {
             it(filename, async function() {
                let title = this.test.fullTitle().replace('Snapshot ','');
                await page.goto(TEST_URL + title);
                console.log("Go to:"+TEST_URL +title);                
              
                await percySnapshot(page, this.test.fullTitle(), { widths: [768, 992, 1200] });
              })
          
          };
      };
  };

})
