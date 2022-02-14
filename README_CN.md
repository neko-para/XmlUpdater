# XmlUpdater

这个工具为需要翻译的内容添加原文的注释，旨在帮助译者更好理解原文。

它将读取一个语言的XML文件，并且将其添加到另一个语言的XML文件中，作为其原文的引用。

例子：

(假设里面的文本已经被翻译了)
从
```xml
<?xml version="1.0" encoding="utf-8"?>
<LanguageData>

  <NephiliticFog.label>nephilitic fog</NephiliticFog.label>
  <NephiliticFog.description>Nephilitic fog reduces the accuracy of ranged weapons. On its own, it's largely harmless, but, if it become more severe, it can sicken humanoid pawns that spend too much time outside in it.</NephiliticFog.description>


</LanguageData>
```
到
```xml
<?xml version="1.0" encoding="utf-8"?>
<LanguageData>

  <!-- EN: nephilitic fog -->
  <NephiliticFog.label>nephilitic fog</NephiliticFog.label>

  <!-- EN: Nephilitic fog reduces the accuracy of ranged weapons. On its own, it's largely harmless, but, if it become more severe, it can sicken humanoid pawns that spend too much time outside in it. -->
  <NephiliticFog.description>Nephilitic fog reduces the accuracy of ranged weapons. On its own, it's largely harmless, but, if it become more severe, it can sicken humanoid pawns that spend too much time outside in it.</NephiliticFog.description>

</LanguageData>
```

这个工具也会忽略但保留注释。同时，它也会比较两个文件，在出现不同的标签、文本或注释时警告你。

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

依据这个配置，工具将会依据所有`Languages/English`下的XML文件来更新`Languages/ChineseSimplified`的对应文件，并且将会被修改的文件（`Languages/ChineseSimplified`下的XML文件）在被覆盖前复制到`Backup`文件夹下。

* lang

  这一部分包含了每个语言的全名。将会在搜索文件和检查注释时用到。

  > 关于检查注释
  > 
  > 由于这个工具可以修改已经包含引用的文件，因此它使用了一个简单的规则来判断某个注释是否为引用：
  > 
  > 如果一个注释形如`<!-- XX: YYYYY -->`，其中`XX`在`lang`中存在，那这个注释将会被视为一个引用。

* directory

  这一项是将要被处理的目录（相对路径）。你可以参考上面的实例。

* backup

  这一项是用来存储备份的目录。**这个目录在一开始应当不存在**

* update 和 with

  这两项为着将要被更新和被引用的语言。`update`是将要被更新的语言，`with`是被引用的语言。

* commentSimilarity 和 commentSimilarityWarn

  这两个数字是[莱文斯坦距离](https://en.wikipedia.org/wiki/Levenshtein_distance)使用的参数。

  如果两个注释的差异小于`commentSimilarity`，则工具会忽略；如果小于`commentSimilarityWarn`，则会生成警告；否则会生成错误。

  如果两个翻译文本的差异小于`commentSimilarity`，则会生成警告；否则会生成错误。

  > 如果在英文文件中有`<X>abc</X>`，在中文的对应标签处有`<!-- EN: def -->`，则会生成警告。

## 运行

你可以直接下载发布版，修改`config.json`，然后运行`XmlUpdater.bat`（Windows用户）或`XmlUpdater`（Linux用户）。

你也可以下载源码，安装依赖库（通过`npm install`），修改`config.json`，然后运行`node index.js`。

> 需要安装`nodejs`
