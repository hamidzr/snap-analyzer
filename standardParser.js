const fse = require('fs-extra'),
    parseString = require('xml2js').parseString,
    jq = require('json-query'),
    inspect = require('util').inspect,
    xmlReader = require('xml-reader'),
    XmlQuery = require('xml-query'),
    _ = require('lodash');

const xmlPath = './Dice.xml';
let xml = fse.readFileSync(xmlPath, 'utf8');
let ast = xmlReader.parseSync(xml);
let xq = XmlQuery(ast);


// scripts or stage 
const tabStructure = {
    blocks: 'blocks',
    messageTypes: 'messageTypes',
    scripts: 'scripts',
    variables: 'variables'
};

const roleStructure = {
    name: '$.name',
    stage: 'project[0]stage[0]',
    // sprites: ['project[0]stage[0].sprites', tabStructure]
};

const baseStructure = {
    name: 'room.$.name',
    roles: ['room.role', roleStructure]
};

function filterProject(json, structure){
    let proj = {};
    Object.keys(structure).forEach(key => {
        let instruction = structure[key];
        if (typeof instruction === 'string'){
            proj[key] = jq(instruction, {data: json}).value;
        }else if (Array.isArray(instruction)){
            let [selector, struct] = instruction;
            proj[key] = [];
            jq(instruction, {data: json}).value.forEach(item => {
                proj[key].push(filterProject(item, struct));
            })
        }else{
            // custom fn TODO how to pick atters in stage
            // assuming it is an obj and then filter? 

        }
    })
    return proj;
}

parseString(xml, function (err, result) {
    let proj = filterProject(result, baseStructure);
    console.log(inspect(proj,{depth: 3}));
});


// console.log(ast);
// console.log(xq.size());
