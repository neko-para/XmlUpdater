const fs = require('fs').promises
const { exit } = require('process')
const path = require('path')
const leven = require('leven')

let config

async function parseXml (path) {
    let data = (await fs.readFile(path)).toString()
    data = data
        .replace(/^.?<\?xml version="1.0" encoding="utf-8"\?>\r?\n<LanguageData>[ \n\r\t]*/, '')
        .replace(/[ \n\r\t]*<\/LanguageData>$/, '')
    const result = []
    let prev = {
        data: {},
        content: []
    }
    while (true) {
        data = data.replace(/^[ \n\r\t]+/, '')
        if (data.length === 0) {
            return result
        }
        if (/^<!--/.exec(data)) {
            const idx = data.indexOf('-->')
            if (idx === -1) {
                console.error(`FATAL: In file ${path}, no matched --> found for comment.`)
                exit(1)
            }
            const comment = data.substring(0, idx + 3)
            const m = /^<!-- ([-A-Z]{2,}): ([\s\S]*) -->$/.exec(comment)
            if (m) {
                if (m[1] in config.lang) {
                    prev.data[m[1]] = m[2]
                    prev.content.push(comment)
                } else {
                    console.warn(`WARNING: In file ${path}, meet unknown language specifier >${m[1]}<. Ignored.`)
                    prev.content.forEach(x => {
                        result.push({
                            type: 'comment',
                            value: x
                        })
                    })
                    prev = {
                        data: {},
                        content: []
                    }
                    result.push({
                        type: 'comment',
                        value: comment
                    })
                }
            } else {
                result.push({
                    type: 'comment',
                    value: comment
                })
            }
            data = data.substring(idx + 3)
        } else {
            const m = /^<([a-zA-Z0-9._]+)>([\s\S]*)<\/\1>([\s\S]*)$/.exec(data)
            if (m) {
                result.push({
                    type: 'node',
                    tag: m[1],
                    comment: prev,
                    data: m[2]
                })
                prev = {
                    data: {},
                    content: []
                }
                data = m[3]
            } else {
                console.error(`ERROR: In file ${path}, syntax error around ${data.substring(0, 10)}.`)
                exit(1)
            }
        }
    }
}

async function genXml(path, data) {
    let res = `<?xml version="1.0" encoding="utf-8"?>
<LanguageData>

`
    for (const d of data) {
        if (d.type === 'comment') {
            res += `  ${d.value}\n\n`
        } else {
            for (const k in d.comment.data) {
                res += `  <!-- ${k}: ${d.comment.data[k].replace('--', '- -')} -->\n`
            }
            res += `  <${d.tag}>${d.data}</${d.tag}>\n\n`
        }
    }
    res += '</LanguageData>'
    await fs.writeFile(path, res)
}

async function update (from, to, bak) {
    const paths = await fs.readdir(from)
    for (const p of paths) {
        const fp = path.join(from, p)
        const tp = path.join(to, p)
        const bp = path.join(bak, p)
        const fst = await fs.stat(fp)
        if (fst.isDirectory()) {
            try {
                const tst = await fs.stat(tp)
                if (!tst.isDirectory()) {
                    console.error(`ERROR: ${fp} is directory but ${tp} is file.`)
                    exit(1)
                }
            } catch (e) {
                console.warn(`WARN: According to ${fp}, create directory ${tp}.`)
                await fs.mkdir(tp)
            }
            await fs.mkdir(bp)
            await update(fp, tp, bp)
        } else {
            try {
                const tst = await fs.stat(tp)
                if (tst.isDirectory()) {
                    console.error(`ERROR: ${fp} is file but ${tp} is directory.`)
                    exit(1)
                }
            } catch (e) {
                console.warn(`WARN: Copy ${fp} to ${tp}`)
                await fs.copyFile(fp, tp)
            }
            const fd = await parseXml(fp)
            const td = await parseXml(tp)
            await fs.copyFile(tp, bp)
            const result = []
            let fi = 0, ti = 0
            while (fi < fd.length) {
                if (ti == td.length) {
                    while (fi < fd.length) {
                        const fn = fd[fi++]
                        if (!(config.with in fn.comment.data)) {
                            fn.comment.data[config.with] = fn.data
                        }
                        result.push(fn)
                    }
                    break
                }
                const fn = fd[fi]
                const tn = td[ti]
                if (fn.type === 'comment') {
                    if (tn.type === 'comment') {
                        const l = leven(fn.value, tn.value)
                        if (l < config.commentSimilarity) {
                            fi++
                            ti++
                            result.push(fn)
                        } else {
                            if (l < config.commentSimilarityWarn) {
                                console.warn(`WARN: In ${fp} and ${tp}, found quite similar comment. Started with ${fn.value.substring(0, 10)} and ${tn.value.substring(0, 10)}.`)
                            }
                            fi++
                            result.push(fn)
                        }
                    } else {
                        fi++
                        result.push(fn)
                    }
                } else {
                    if (tn.type === 'comment') {
                        console.warn(`WARN: In ${tp}, found mismatched comment. Started with ${tn.value.substring(0, 10)}.`)
                        ti++
                        result.push(tn)
                    } else {
                        if (fn.tag !== tn.tag) {
                            console.warn(`WARN: Mismatch tag found. In ${fp} is ${fn.tag}, but in ${tp} is ${tn.tag}.`)
                            if (!(config.with in fn.comment.data)) {
                                fn.comment.data[config.with] = fn.data
                            }
                            fi++
                            result.push(fn)
                        } else {
                            if (config.with in tn.comment.data) {
                                const l = leven(fn.data, tn.comment.data[config.with])
                                if (l > 0) {
                                    if (l < config.commentSimilarity) {
                                        console.warn(`WARN: Similar translation refer for tag ${fn.tag} found. In ${fp} is ${fn.data}, but in ${tp} is ${tn.comment.data[config.with]}.`)
                                    } else {
                                        console.error(`FATAL: Mismatch translation refer for tag ${fn.tag} found. In ${fp} is ${fn.data}, but in ${tp} is ${tn.comment.data[config.with]}.`)
                                        exit(1)
                                    }
                                }
                            } else {
                                tn.comment.data[config.with] = fn.data
                            }
                            fi++
                            ti++
                            result.push(tn)
                        }
                    }
                }
            }
            if (ti < td.length) {
                console.warn(`WARN: In ${tp}, extra ${td.length - ti} nodes found. Will copy their contents as refer.`)
                while (ti < td.length) {
                    const tn = td[ti++]
                    if (!(config.with in tn.comment.data)) {
                        tn.comment.data[config.with] = tn.data
                    }
                    result.push(tn)
                }
            }
            genXml(tp, result)
        }
    }
}

async function main () {
    config = JSON.parse(await fs.readFile('config.json'))
    const root = config.directory
    if (!(config.update in config.lang)) {
        console.error(`ERROR: Unknown language ${config.update}`)
        exit(1)
    }
    if (!(config.with in config.lang)) {
        console.error(`ERROR: Unknown language ${config.with}`)
        exit(1)
    }
    try {
        if (!(await fs.stat(config.directory)).isDirectory()) {
            throw Error('')
        }
    } catch (e) {
        console.error(`ERROR: ${config.directory} is not a valid directory.`)
        exit(1)
    }
    try {
        if (!(await fs.stat(path.join(root, config.lang[config.with]))).isDirectory()) {
            throw Error('')
        }
    } catch (e) {
        console.error(`ERROR: ${path.join(root, config.lang[config.with])} is not a valid directory.`)
        exit(1)
    }
    try {
        if (!(await fs.stat(path.join(root, config.lang[config.update]))).isDirectory()) {
            throw Error('')
        }
    } catch (e) {
        console.error(`ERROR: ${path.join(root, config.lang[config.update])} is not a valid directory.`)
        exit(1)
    }
    try {
        await fs.stat(config.backup)
        console.error(`ERROR: ${config.backup} is already exist. Please remove it manually.`)
        exit(1)
    } catch (e) {
        await fs.mkdir(config.backup)
    }
    update(path.join(root, config.lang[config.with]), path.join(root, config.lang[config.update]), path.join(config.backup))
}

main()