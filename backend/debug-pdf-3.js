try {
    const pdf = require('./node_modules/pdf-parse/dist/pdf-parse/cjs/index.cjs');
    console.log('Type:', typeof pdf);
    console.log('Is function?', typeof pdf === 'function');
    console.log('Keys:', Object.keys(pdf));
} catch (e) {
    console.error(e);
}
