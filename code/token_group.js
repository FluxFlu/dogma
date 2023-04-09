function tokenGroup(filename, file) {
    for (let i = 0; i < file.length; i++) {
        const token = file[i];
        if (token.value == '$' && file[i + 1].value == '(') {
            token.value = ''
            let brack = 1;
            token.value += file.splice(++i, 1)[0].value;
            while (brack) {
                if (file[i].value == '(') brack++;
                if (file[i].value == ')') brack--;
                token.value += ' ' + file.splice(i, 1)[0].value;
            }
            token.type = "token_group"
        }
    }
    return file;
}

module.exports = { tokenGroup }