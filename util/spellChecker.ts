var SpellChecker = require('simple-spellchecker');
var dictionary = SpellChecker.getDictionarySync("command", "db");

export function checkSpell(word:string) : boolean {
    return dictionary.spellCheck(word)
}

export function getSuggesSpell(word:string) : {misspelled:boolean, suggestions : string[]}  {
   return dictionary.checkAndSuggest(word)
}
