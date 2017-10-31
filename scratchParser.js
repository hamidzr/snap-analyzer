const fse = require('fs-extra'),
    fs = require('fs'),
    jq = require('json-query'),
    inspect = require('util').inspect,
    program = require('commander'),
    _ = require('lodash');

program
    .option('-o, --output <output>', 'output file location')
    .option('-i, --input <input>', 'projects directory')
    .parse(process.argv);

// get the dataset directory location
const DATASET_PATH = program.input;

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
        return this.sprites().map(sprite => sprite.scripts).filter(i => i);
    }

    toString(){
        const BLOCK_SEPARATOR = ' ';
        const SCRIPT_SEPARATOR = ' ESC ';
        const SPRITE_SEPARATOR = ' ESP ';
        const ROLE_SEPARATOR = '\n'; // or proj separator in this case
        return this.sprites()
            .filter(sprite => sprite.scripts)
            .map(sprite => {
                return sprite.scripts
                    .map(script => script.join(BLOCK_SEPARATOR))
                    .join(SCRIPT_SEPARATOR);
            }).join(SPRITE_SEPARATOR);
    }

}

let outFile = program.output || 'scratchProjectTexts.txt';
let outStream = fs.createWriteStream(outFile, {flags: 'w'});
let corruptedProjs = 0;
fse.readdir(DATASET_PATH)
    .then( projNames => {
        let numProjs = projNames.length;
        const REPORT_EVERY = Math.floor(numProjs / 100); // config the fraction 1/reportf
        console.log('processing #', numProjs);
        projNames.forEach( (fileName, idx) => {
            try {
                if (idx % REPORT_EVERY === 0) console.log(`${idx/numProjs}`);
                let project = new Project(DATASET_PATH + fileName);
                let projectText = project.toString();
                if (projectText.length > 3) {
                    outStream.write(projectText + '\n');
                }
            } catch (e) {
                /* handle error */
                corruptedProjs++;
                // console.error(e);
            }
        })
        console.log('corruptedProjs', corruptedProjs);
    })
    .catch(console.error);

