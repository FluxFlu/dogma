const { validTypes } = require("./flag");

function finalize (filename, file) {
    let final = ""
    for (let i in file) {
        const token = file[i];

        if (validTypes[token.type]) final += token.value;
        if (token.value == '\n') final += '\n';
        final += ' '
    }
    return final;
}

module.exports = { finalize }