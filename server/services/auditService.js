const puppeteer = require('puppeteer');
const axeCore = require('axe-core');

const runAccessibilityAudit = async (url, resolvedIp = null) => {
    let browser;
    try {
        const parsedUrl = new URL(url);
        
        const launchOptions = {};
        if (resolvedIp) {
            launchOptions.args = [
                `--host-resolver-rules=MAP ${parsedUrl.hostname} ${resolvedIp}`
            ];
        }
        
        browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();

        await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

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
