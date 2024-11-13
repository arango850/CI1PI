const fs= require('fs')
const path =require('path')

const readJSON = (file) => {
    const filePath = path.join(__dirname,'data',file)
    return JSON.parse(fs.readFileSync(filePath,'utf8'))
}

const writeJSON = (file,data) =>{
    const filePath =path.join(__dirname,'data',file)
    fs.writeFileSync(filePath,JSON.stringify(data,null,2),'utf8')
}

module.exports = { readJSON, writeJSON }