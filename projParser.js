const fse = require('fs-extra'),
    jq = require('json-query'),
    inspect = require('util').inspect,
    Snap2Js = require('snap2js'),
    XmlElement = require('./lib/snap/xml.js'),
    _ = require('lodash');

const xmlPath = process.argv[2];
let inputString = fse.readFileSync(xmlPath, 'utf8');
let rootEl = new XmlElement();
rootEl.parseString(inputString);

// requires rootEl
function detectType(rootEl){
    let type;
    if (rootEl.tag === 'project') type = 'role';
    if (rootEl.tag === 'room') type = 'project';
    // console.log('type is', type);
    return type;
}

// pull out roles if any
// return an array of roles
function extractRoles(rootEl){
    let roles = [];
    if (detectType(rootEl) == 'role') roles.push(rootEl);
    if (detectType(rootEl) == 'project'){
        roles = rootEl.childrenNamed('role').map(wrapper => wrapper.childNamed('project'));
    }
    // console.log('detected roles', roles);
    return roles;
}

let showTag = el => el.tag;

// parse role
// NOTICE the element with project tag is the role!
function parseRole(projEl){
        var stage = projEl.childNamed('stage');
        var sprites = stage.childNamed('sprites').childrenNamed('sprite');

        var globalVars = parseInitialVariables(projEl.childNamed('variables').children);
        var tempo = +stage.attributes.tempo;
        var blocks = projEl.childNamed('blocks').children;
        // let metadata = {
        //     variables: globalVars,
        //     tempo: tempo,
        //     stage: Snap2Js.parseStage(stage),
        //     customBlocks: blocks.map(Snap2Js.parseBlockDefinition)
        // };
        let metadata = {
            variables: globalVars,
            blocks,
            sprites
        }
        console.log('parsed role', metadata.sprites[0].children.map(showTag));
        return metadata;
}


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


extractRoles(rootEl).map(role => parseRole(role));
// console.log(detectType(rootEl));
// parseString(xml, function (err, result) {
//     let proj = filterProject(result, baseStructure);
//     console.log(inspect(proj,{depth: 3}));
// });


// console.log(ast);
// console.log(xq.size());
