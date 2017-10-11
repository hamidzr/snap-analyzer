const fse = require('fs-extra'),
    jq = require('json-query'),
    inspect = require('util').inspect,
    _ = require('lodash');

const DATASET_PATH = '/home/hmd/datasets/scratchProjs/text/';

// const filePath = process.argv[2];
// if (! filePath) throw('pass in a project or role xml');

function spriteParser(sprite) {
    let spriteObj = {
        name: sprite.objName,
    };
    if (sprite.scripts) spriteObj.scripts = sprite.scripts.map(scriptParser);
    return spriteObj;
}

function scriptParser(script) {
    let blocks = script[2];
    return blocks.map(block => block[0]);
    // return blocks.map(block => block.join(': '));
}

class Project {
    constructor(filePath){
        let inputString = fse.readFileSync(filePath, 'utf8');
        let proj = JSON.parse(inputString);
        this._proj = proj;
        this._sprites = this._proj.children;
    }

    sprites(){
       return this._sprites.map(spriteParser);
    }

    scripts(){
        return this.sprites().map(sprite => sprite.scripts);
    }

}


fse.readdir(DATASET_PATH)
    .then( fileNames => {
        console.log('processing #', fileNames.length);
        fileNames.forEach( fileName => {
            // console.log('reading', fileName);
            let project = new Project(DATASET_PATH + fileName);
            let data = project.scripts();
            console.log(data);
            console.log('=========');
        })
    })
    .catch(console.error);

