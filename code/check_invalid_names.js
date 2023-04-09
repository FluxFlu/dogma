const { updateLine } = require("../dogma");
const { getCompilerFlags } = require("../dogma");
const { log_error } = require("../dogma");

const invalid_names = [
    name => name.match(/dogma_early_fn_[0-9]+/)
]

const flag_checks = [
    "ignore-early-fn-name-check"
]

const name_errors = [
    "early_fn_name"
]

function checkInvalidNames(file) {
    for (let i = 0; i < invalid_names.length; i++) {
        if (getCompilerFlags()[flag_checks[i]] == "true") {
            delete invalid_names[i];
        }
    }
    for (let i = 0; i < file.length; i++) {
        updateLine(file[i])
        if (file[i].type == "Identifier")
            for (let name in invalid_names) {
                if (invalid_names[name](file[i].value)) {
                    log_error(name_errors[name], true);
                }
            }
    }
}

module.exports = { checkInvalidNames }