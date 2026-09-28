const path = require('path');
const fs = require('fs');

const file = '\SANJIV PRASAD\OneDrive\Desktop\SmartTraffic\server\Controller\exp.js'
// // console.log(__dirname)
// console.log(__filename)

console.log(path.basename(file))
console.log(path.extname(file))
const filePath = path.join(__dirname,'exp.js')
console.log(path.parse(filePath))
console.log(path.extname(filePath))
// console.log()