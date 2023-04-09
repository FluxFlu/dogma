const { definitions } = require("./flag");
const { token } = require("./tokenizer");

let current_substitutions = {}

function tokenMatch(sets, file, index) {
    current_substitutions = {}
    const originalIndex = index;
    for (let set of sets) {
        index = originalIndex
        if (set.from.length + index > file.length) continue;
        const start = index--;
        let is_valid = true;
        while (++index - start < set.from.length) {
            if (set.from[index - start].type == "Substitution") {
                current_substitutions[set.from[index - start].value] = token(file[index].type, file[index].value)
                continue;
            }
            if (file[index].type != set.from[index - start].type || file[index].value != set.from[index - start].value) {
                is_valid = false;
                break;
            }
        }
        if (is_valid)
            return set;
    }
    return 0;
}

function handleDefinitions(filename, file) {
    const sets = Object.values(definitions[filename]);
    for (let i = 0; i < file.length; i++) {
        const set = tokenMatch(sets, file, i);
        if (set) {
            let start = --i + 1;
            while (++i - start < set.to.length) {
                if (i - start < set.from.length) {
                    file[i].value = (set.to[i - start].type == "Substitution") ? (current_substitutions[set.to[i - start].value].value) : (set.to[i - start].value);
                } else {
                    file.splice(i, 0, set.to[i - start].type == "Substitution" ? token(current_substitutions[set.to[i - start].value].type, current_substitutions[set.to[i - start].value].value) : set.to[i - start])
                }
            }
            while (i - start-- < set.from.length) {
                file.splice(i, 1)
            }
            i--;
        }
    }
    return file;
}

module.exports = { handleDefinitions }