# XmlUpdater

> [中文](https://github.com/neko-para/XmlUpdater/blob/master/README_CN.md)

This tool adds refer comments for contents to be translated, which can help translators better understand.

It reads the xml from A language and adds it as a refer in xml from B language.

For example:

(assume that content inside the tags have been translated)
from
```xml
<?xml version="1.0" encoding="utf-8"?>
<LanguageData>

  <NephiliticFog.label>nephilitic fog</NephiliticFog.label>
  <NephiliticFog.description>Nephilitic fog reduces the accuracy of ranged weapons. On its own, it's largely harmless, but, if it become more severe, it can sicken humanoid pawns that spend too much time outside in it.</NephiliticFog.description>


</LanguageData>
```
to
```xml
<?xml version="1.0" encoding="utf-8"?>
<LanguageData>

  <!-- EN: nephilitic fog -->
  <NephiliticFog.label>nephilitic fog</NephiliticFog.label>

  <!-- EN: Nephilitic fog reduces the accuracy of ranged weapons. On its own, it's largely harmless, but, if it become more severe, it can sicken humanoid pawns that spend too much time outside in it. -->
  <NephiliticFog.description>Nephilitic fog reduces the accuracy of ranged weapons. On its own, it's largely harmless, but, if it become more severe, it can sicken humanoid pawns that spend too much time outside in it.</NephiliticFog.description>

</LanguageData>
```

This tool will also ignore the comment and won't remove it. Meanwhile, it will also check the differences between the tags, text and comment in two file and warn you.

## reference

```json
{
    "lang": {
        "ZH": "ChineseSimplified",
        "EN": "English"
    },
    "directory": "Languages",
    "backup": "Backup",
    "update": "ZH",
    "with": "EN",
    "commentSimilarity": 5,
    "commentSimilarityWarn": 10
}
```

This config will use all xml files under `Languages/English` to update the corresponding files under `Languages/ChineseSimplified`, and copy all the files(all xml files under `Languages/ChineseSimplified`) to `Backup` before overwritting them.

* lang

  This part contains the full name of each locale. It will be used during file scanning and comment checking.

  > about comment checking
  > 
  > As this tool can alter the files that already have refer comments, it uses a simple rule to check whether a comment is a refer or not:
  > 
  > If a comment is in form of `<!-- XX: YYYYY -->`, and `XX` is defined in `lang`, then the comment will be treated as refer comment.

* directory

  This entry is the target directory(relatively) that will be processed. You can refer the example above.

* backup

  This entry is the directory to store the backup files. **This directory should not exist at first**

* update and with

  This two entry contains the lang that are used to update and updated. `update` is the language that need refer. `with` is the language that provide refer.

* commentSimilarity and commentSimilarityWarn

  This two number is the parameter for the [Levenshtein distance](https://en.wikipedia.org/wiki/Levenshtein_distance) algorithm.

  If two comments' difference is lower than `commentSimilarity`, the tool ignores; if lower than `commentSimilarityWarn`, it generate warning; otherwise it generate error.

  If two translations' difference is lower than `commentSimilarity`, the tool generate warning; otherwise it generate error.

  > If in EN: `<X>abc</X>`, in ZH(corresponding node): `<!-- EN: def -->`, then it generates warning.

## Running

You can just download the release, change the `config.json`, and run `XmlUpdater.bat`(For Windows) or `XmlUpdater`(For Linux).

Also, you can download the source, install the require package(via `npm install`), change the `config.json`, and run `node index.js`.

> need `nodejs` been installed