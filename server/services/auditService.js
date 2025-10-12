const puppeteer = require('puppeteer');
const axeCore = require('axe-core');

const runAccessibilityAudit = async (url) => {
    let browser;
    try {
        
        browser = await puppeteer.launch();
        const page = await browser.newPage();

       
        await page.goto(url, { waitUntil: 'networkidle0' }); 

        
        await page.addScriptTag({ path: require.resolve('axe-core') });

        
        const results = await page.evaluate(() => axe.run());

        
        await browser.close();

        
        return results;

    } catch (error) {
        
        if (browser) {
            await browser.close();
        }
        console.error('Error running audit:', error);
        
        throw error;
    }
};

module.exports = { runAccessibilityAudit };
