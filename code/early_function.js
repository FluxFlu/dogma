const terminateCharacters = {';': true};

const slightTerminateCharacters = {')': true, ',': true}

const { token } = require("./tokenizer");

function handleEarlyFunctions(filename, file) {
    let curr_early_function = 0;
    for (let i in file) {
        if (file[i].value == "==>" && file[i].type == "Operator") {
            file.splice(i, 1);
            const curr = [ ];
            i--;
            if (file[i].value == ')') {
                let brack = -1;
                for (curr.push(file.splice(i--, 1)[0]); brack; i--) {
                    if (file[i].value == '(') brack++;
                    if (file[i].value == ')') brack--;
                    curr.unshift(file.splice(i, 1)[0]);
                }
                i++
            } else {
                curr.push(file.splice(i, 1)[0]);
            }
            curr.push(token("Operator", "=>"))
            if (file[i].value == '{') {
                let brack = 1;
                curr.push(file.splice(i, 1)[0]);
                while (brack) {
                    if (file[i].value == '{') brack++;
                    if (file[i].value == '}') brack--;
                    curr.push(file.splice(i, 1)[0]);
                }
            } else {
                let brack = 0;
                while (!(terminateCharacters[file[i].value] || slightTerminateCharacters[file[i].value] && !brack)) {
                    if (file[i].value == '(') brack++;
                    if (file[i].value == ')') brack--;
                    curr.push(file.splice(i, 1)[0]);
                }
            }
            file.splice(i, 0, token("Identifier", 'dogma_early_fn_' + curr_early_function))
            let fn_location = 0;
            for (let j = 0; j < file.length; j++) {
                if (file[j].type == "compiler_value" && file[j].value == "FN_LOCATION") {
                    fn_location = j;
                    break;
                }
            }
            file.splice(fn_location, 0, token("Line Break", '\n'))
            file.splice(fn_location + 1, 0, token("Identifier", 'const'))
            file.splice(fn_location + 2, 0, token("Identifier", 'dogma_early_fn_' + curr_early_function++))
            file.splice(fn_location + 3, 0, token("Operator", '='))
            file.splice(fn_location + 4, 0, curr)
            file.splice(fn_location + 5, 0, token("Separator", ';'))
            file = file.flat();
        }
    }
    return file;
}

module.exports = { handleEarlyFunctions }