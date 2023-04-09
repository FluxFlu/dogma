const { definitions } = require("./flag");
const { handleDefinitions } = require("./sub_definitions");


const non_value = { Operator: true, Separator: true, "Line Break": true}

function end_format (value) {
    switch (typeof value) {
        case "string": {
            return `"${value.replaceAll('"', '\"')}"`
        }
        default: {
            return String(value);
        }

    }
}

function cook (filename, file) {
    for (let i in file) {
        const token = file[i];
        if (token.value == '<' && non_value[file[i - 1].type] && file[i - 1].value != ')') {
            let brack = 1;
            let to_cook = [file.splice(i, 1)[0]]
            let current_last_token = 0;
            while (brack && file[i]) {
                if (file[i].value == '<' && (current_last_token && non_value[to_cook[current_last_token - 1].type] && to_cook[current_last_token - 1].value != ')' || !file[+i + 1] || non_value[file[+i + 1].type] && file[+i + 1].value != '(')) brack++;
                if (file[i].value == '>' && (current_last_token && non_value[to_cook[current_last_token - 1].type] && to_cook[current_last_token - 1].value != ')' || !file[+i + 1] || non_value[file[+i + 1].type] && file[+i + 1].value != '(')) brack--;
                to_cook.push(file.splice(i, 1)[0]);
                current_last_token++;
            }

            to_cook = to_cook.slice(1, -1);
            to_cook = handleDefinitions(filename, to_cook)
                .map(e => e.value)
                .join(' ')
            const out = eval(to_cook);
            file.splice(i, 0, {type: "cooked", value: end_format(out)})
        }
    }
    return file;
}

module.exports = { cook }