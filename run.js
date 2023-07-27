const axios = require('axios');
const cheerio = require('cheerio');
const xmlbuilder = require('xmlbuilder');

// Function to fetch HTML from the URL
async function fetchHTML(url) {
  const response = await axios.get(url);
  return response.data;
}

// Function to parse HTML and get stable URLs
function getStableURLs(html) {
  const $ = cheerio.load(html);
  const stableURLs = [];
  $('tr.status-ok').each((i, row) => {
    const binary = $(row).find('th').first().text();
    const platform = $(row).find('th').last().text();
    const url = $(row).find('td').first().text();
    if (binary === 'chromedriver') {
      stableURLs.push({
        key: `${url}`,
      });
    }
  });
  return stableURLs;
}


// Function to convert URLs to XML
function convertToXML(urls) {
  const root = xmlbuilder.create('ListBucketResult', { encoding: 'UTF-8' });
  root.att('xmlns', 'http://doc.s3.amazonaws.com/2006-03-01');
  root.ele('Name', 'chromedriver');
  root.ele('Prefix');
  root.ele('Marker');
  root.ele('IsTruncated', 'false');
  urls.forEach((url) => {
    const contents = root.ele('Contents');
    contents.ele('Key', url.key);
    contents.ele('LastModified', new Date().toISOString()); // Use current date as last modified
  });
  return root.end({ pretty: true });
}

// Main function
async function main() {
  const url = 'https://googlechromelabs.github.io/chrome-for-testing';
  const html = await fetchHTML(url);
  const stableURLs = getStableURLs(html);
  const xml = convertToXML(stableURLs);
  console.log(xml);
}

main();

