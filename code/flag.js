const fs = require("fs")
const path = require("path");
const { getCompilerFlags, fileData } = require("../dogma");
const { variables } = require("./tokenizer");


const validTypes = { Identifier: true, Number: true, Operator: true, Separator: true, String: true, Variable: true, post_flag: true, cooked: true, token_group: true }

const definitions = {};
const publicDefinitions = {}


function handleFlag(compile, filename, line) {
    line.shift();
    const fn = line.shift().value;
    let flag = line.map(e => e.value);
    let brack = 0;
    const values = [[]];
    let value = 0;
    let final = ""
    for (let i = 0; i < flag.length; i++) {
        if (flag[i] == '[') brack++;
        if (flag[i] == ']') brack--;
        if (validTypes[line[i].type])
            values[value].push(line[i]);
        if (!brack) {
            values[value] = values[value].slice(1, -1)
            if (!flag[i + 1])
                break;
            values.push([]);
            value++;
        }
    }
    switch (fn) {
        case "define": {
            for (let i = 0; i < values[0].length; i++) {
                if (values[0][i].value == '$') {
                    values[0][i].value = '$' + values[0].splice(i + 1, 1)[0].value;
                    values[0][i].type = "Substitution"
                }
            }
            for (let i = 0; i < values[1].length; i++) {
                if (values[1][i].value == '$') {
                    values[1][i].value = '$' + values[1].splice(i + 1, 1)[0].value;
                    values[1][i].type = "Substitution"
                }
            }
            const name = values[3] || values[0];
            definitions[filename][name[0].value] = { name: name[0].value, from: values[0], to: values[1] }
            break;
        }
        case "export": {
            flag = flag.join('').slice(1, -1).split(',')

            const realVariables = Object.entries(variables[filename]).filter(([key, value]) => flag.includes(value.name)).map(e => e[0]);
            if (realVariables.length) {
                switch (getCompilerFlags()["type"]) {
                    case "node": {
                        final += "module.exports = { "
                        let i = 0;
                        for (; ++i < realVariables.length; i++) final += realVariables + ', '
                        final += realVariables[i - 1]
                        final += ' }'
                        break;
                    }
                }
            }
            publicDefinitions[filename] = Object.fromEntries(Object.entries(definitions[filename]).filter(([key, value]) => flag.includes(value.name)));

            break;
        }
        case "require": {
            const requires = flag.join('').split('from')
            const include = requires[0].slice(1, -1).split(',')
            const from = requires[1].slice(1, -1)
            
            fs.writeFileSync(from.replaceAll('.dm', '.js'), compile(from))
            fileData.current_file = filename;

            // const variables = 
            const fakeVariables = Object.fromEntries(Object.entries(publicDefinitions[from]).filter(([key, value]) => include.includes(key)))
            const fakeKeys = Object.keys(fakeVariables);
            for (let i = 0; i < fakeKeys.length; i++)
                definitions[filename][fakeKeys[i]] = fakeVariables[fakeKeys[i]]
            
                const realVariables = include.filter(e => !publicDefinitions[from][e]);
            
            if (realVariables.length) {
                switch (getCompilerFlags()["type"]) {
                    case "node": {
                        final += "const { "
                        let i = 0
                        for (; ++i < realVariables.length;) final += realVariables + ', '
                        final += realVariables[i - 1]
                        final += ' } = require("' + from.replaceAll(".dm", ".js") + '");'
                        break;
                    }
                }
            }
            break;
        }
        case "with": {
            switch (getCompilerFlags()["type"]) {
                case "node": {
                    final = "#!" + flag.slice(1, -1).join(' ')
                        .replaceAll('/ ', '/')
                        .replaceAll(' /', '/')
                }
            }
        }
    }

    return final;
}

module.exports = { handleFlag, definitions, publicDefinitions, validTypes }