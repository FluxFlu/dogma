const { definitions } = require("./flag");

function token(type, value) {
    return { type: type, value: value };
}

const operatorList = ['(', ')', '#', "=>", '+', '-', '=', '*', "**", '/', '~', '^', '|', '&', "<<", ">>", ">>>", '%', "||", "&&", "++", "--", '!', '{', '}', '<', '>', "<=", ">=", "!==", "===", "==", "!=", "+=", "-=", "*=", "/=", "%=", "**=", "||=", ',', "&&=", "^=", "&=", "|=", ">>=", ">>>=", "<<=", ':', '[', ']', '$'];

const endLines = [";", "{", "}", "\n"];

const variables = {};

// let operateFinal;
function finality(operator) {
    for (let i = 0; i < operatorList.length; i++) {
        for (let x = 0; x < operator.length; x++) {
            if (operator[x] != operatorList[i][x])
                break;
            if (x == operator.length - 1)
                return false;
        }
    }
    return true;
}

function Tokenize(filename, string) {
    let literal = false;
    let insideTemplateString = false;
    let templateBrack = 0;
    const tokens = [];
    let currentToken = "";
    let currentTokenType;
    let dotCheck;
    let lineBreaks = 1;
    let commented = false;
    variables[filename] = {}
    for (let i = 0; i < string.length; i++) {
        if (string[i] == '\n') {
            tokens.push(token(currentTokenType, currentToken));
            currentToken = "";
            currentTokenType = "";
            tokens.push(token("Line Break", ++lineBreaks));
            tokens.push(token("Line Break", '\n'));
        }

        if (string[i] == "/" && string[i + 1] == "*") {
            commented = true;
        }
        if (string[i] == "*" && string[i + 1] == "/") {
            commented = false;
            i++;
            continue;
        }
        if (commented)
            continue;

        if (templateBrack && string[i] == '{') templateBrack++;
        if (templateBrack && string[i] == '}') templateBrack--;


        if (string[i] == '"' || string[i] == '\'' || string[i] == '`') {
            if (!literal) {
                tokens.push(token(currentTokenType, currentToken))
                if (string[i] == '`') insideTemplateString = true;
                currentToken = "";
                literal = string[i];
                if (string[i] == '\'')
                    currentToken += '`';
                currentToken += string[i];
            }
            else if (literal && literal == string[i]) {
                literal = false;
                if (insideTemplateString && literal == '`') insideTemplateString = false
                currentToken += string[i];
                if (string[i] == '\'')
                    currentToken += '`';
            }
            continue;
        } else if (literal) {
            currentTokenType = "String";
            
            if (insideTemplateString && string[i] == '$' && string[i + 1] == '{') {
                literal = false;
                tokens.push(token("String", currentToken + '`'))
                tokens.push(token("Operator", "+"))
                tokens.push(token("Operator", "("))
                currentToken = ""
                templateBrack = 1;
                i++;
                continue;
            }

            currentToken += string[i];
        } else if (insideTemplateString && !templateBrack && string[i] == '}') {
            tokens.push(token(currentTokenType, currentToken))
            tokens.push(token("Operator", ')'))
            if (string[i + 1] != '`')
                tokens.push(token("Operator", '+'))
            currentToken = '`'
            currentTokenType = "String"
            literal = '`';
            continue;
        } else if (string[i].match(eval(`/[0-9${dotCheck ? '.' : ''}${currentToken == "Number" ? '' : '-'}]/`)) && (string[i] != '-' || string[i + 1].match(/[0-9]/)) && currentTokenType != "Identifier") {
            dotCheck = true;
            if (currentTokenType != 'Number' && currentToken) {
                tokens.push(token(currentTokenType, currentToken));
                currentToken = "";
            }
            currentTokenType = "Number";
            currentToken += string[i];
            if (string[i].includes('.'))
                dotCheck = false;
        } else if (string[i] == ';') {
            tokens.push(token(currentTokenType, currentToken));
            tokens.push(token("Separator", ';'));
            currentToken = "";
            currentTokenType = undefined;
        } else if (string[i].match(/[A-Za-z_]/) || (currentTokenType == "Identifier" && string[i].match(/[A-Za-z_0-9]/))) {
            if (currentTokenType != "Identifier" && currentToken) {
                tokens.push(token(currentTokenType, currentToken));
                currentToken = "";
            }
            currentTokenType = "Identifier";
            currentToken += string[i];
        } else if (string[i].match(/[\#\(\)\{\}\[\]\.\+\=\-\*\/\~\^\%\!\&\|\,\<\>\:\$]/)) {
            if ((currentTokenType != "Operator" && currentToken) || finality(currentToken + string[i])) {
                tokens.push(token(currentTokenType, currentToken));
                currentToken = "";
            }
            currentTokenType = "Operator";
            currentToken += string[i];
        } else if (string[i] == ' ' && currentTokenType != "String") {
            tokens.push(token(currentTokenType, currentToken));
            currentToken = "";
            currentTokenType = undefined;
        }
    }
    tokens.push(token(currentTokenType, currentToken));
    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].type == undefined || tokens[i].value == '') {
            tokens.splice(i, 1);
            i--;
        }
        if (!tokens[i])
            continue;
        if (tokens[i].type == "Identifier" && tokens[i - 1] && (tokens[i - 1].value == "let" || tokens[i - 1].value == "const" || tokens[i - 1].value == "var")) {
            tokens[i].type = "Variable"
            tokens[i].variable_type = tokens[i - 1].value;
            variables[filename][tokens[i].value] = { name: tokens[i].value, type: tokens[i - 1].value }
        }

        if (tokens[i].type == "Number" && tokens[i].value?.match(/[\-]/g)?.join('')?.length > 1)
            tokens[i].type = "Operator";
    }

    return tokens.filter(e => !(e.type == "String" && e.value.length <= 2))
}


module.exports = { Tokenize, operatorList, token, variables };