"use strict"

const path = window.require('path')
const crypto = window.require('crypto')
const electron = window.require('electron')
const remote = electron.remote

const db = remote.getGlobal('db')

const TAG_NAME_LENGTH = 32
const DEBUG_TIMEOUT = 0

db.serialize(function () {
    db.exec(`
    BEGIN;
    CREATE TABLE IF NOT EXISTS images (
                   id            INTEGER PRIMARY KEY AUTOINCREMENT,
                   src           TEXT                NOT NULL,
                   hash          CHAR(32)            NOT NULL,
                   created_at    INTEGER             NOT NULL,
                   UNIQUE(hash)
               );
    CREATE TABLE IF NOT EXISTS tags (
                   id            INTEGER PRIMARY KEY   AUTOINCREMENT,
                   name          CHAR(${TAG_NAME_LENGTH})              NOT NULL,
                   UNIQUE(name)
                );
    CREATE TABLE IF NOT EXISTS images_tags (
                   id            INTEGER PRIMARY KEY AUTOINCREMENT,
                   image_id      INTEGER NOT NULL,
                   tag_id        INTEGER NOT NULL,
                   UNIQUE(image_id, tag_id)
                );
    COMMIT;
    
    BEGIN;
    CREATE INDEX IF NOT EXISTS tags_name_index ON tags(name);
    CREATE INDEX IF NOT EXISTS images_tags_image_id_index ON images_tags (image_id);
    CREATE INDEX IF NOT EXISTS images_tags_tag_id_index ON images_tags (tag_id);
    COMMIT;
    `)

    // dev seed
    // let ar = ['aa','bb','cc','dd','ee','ff','gg','hh','ii','jj','kk','ll','mm','nn','oo','pp','qq','rr','ss','tt','uu','vv','ww','xx','yy','zz']
    // db.exec( `BEGIN` )
    // ar.forEach((val)=>{db.run(`INSERT INTO tags (name) VALUES ('${val}')`)})
    // db.exec( `COMMIT` )
})


const Db = {
    TAG_NAME_LENGTH: TAG_NAME_LENGTH,

    insertImages (images) {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                const stmt = db.prepare(`INSERT OR IGNORE INTO images (src, hash, created_at) VALUES (?, ?, datetime('now','localtime'))`)
                db.exec(`BEGIN`) // use transaction for speed improvement
                images.forEach((image) => {
                    const hash = crypto.createHash('md5').update(image).digest('hex')
                    stmt.run(image, hash)
                })
                db.exec(`COMMIT`)
                stmt.finalize(() => {
                    setTimeout(() => {
                        resolve()
                    }, DEBUG_TIMEOUT)
                })
            })
        })
    },

    getImages ({limit = 48, offset = 0, filter = []} = {}) {

        let selectQuery = filter.length === 0 ?
            `
            SELECT images.*, COUNT(images_tags.image_id) as tagsNum  
            FROM images
            LEFT JOIN images_tags ON images_tags.image_id = images.id
            GROUP BY images.id
            ` :
            `
            SELECT images.*, count(*) AS count, COUNT(images_tags.image_id) as tagsNum  
            FROM images
            LEFT JOIN images_tags ON images_tags.image_id = images.id
            INNER JOIN tags ON images_tags.tag_id = tags.id
            WHERE tags.name IN (${filter.map((flt)=>`'${flt}'`).join(',')})
            GROUP BY images.id
            HAVING count = ${filter.length}
            `

        return new Promise((resolve, reject) => {
            let countQuery =
                `
                SELECT COUNT(*) AS total 
                FROM (${selectQuery})
                `
            db.get(countQuery, [], (err, row) => {
                if (err) {
                    reject(err)
                } else {
                    let filterQuery =
                        `
                        ${selectQuery}
                        ORDER BY created_at DESC 
                        LIMIT ? OFFSET ?
                        `
                    db.all(filterQuery, [limit, offset], (err, rows) => {
                        setTimeout(() => {
                            rows ? resolve({images: rows, total: row.total}) : reject(err)
                        }, DEBUG_TIMEOUT)
                    })
                }
            })
        })
    },

    removeImage (id) {
        return new Promise((resolve, reject) => {
            db.exec(`BEGIN`, () => {
                db.run(`DELETE FROM images WHERE id = ?`, [id], (err) => {
                    if (err) {
                        db.exec(`ROLLBACK`, () => {
                            reject(err)
                        })
                    } else {
                        db.run(`DELETE FROM images_tags WHERE image_id = ?`, [id], (err) => {
                            if (err) {
                                db.exec(`ROLLBACK`, () => {
                                    reject(err)
                                })
                            } else {
                                db.exec(`COMMIT`, () => {
                                    setTimeout(() => {
                                        resolve()
                                    }, DEBUG_TIMEOUT)
                                })
                            }
                        })
                    }
                })
            })
        })
    },

    insertTag (name) {
        return new Promise((resolve, reject) => {
            db.run(`INSERT OR IGNORE INTO tags (name) VALUES (?)`, [name], (err) => {
                setTimeout(() => {
                    err ? reject(err) : resolve()
                }, DEBUG_TIMEOUT)
            })
        })
    },

    updateTag (tag) {
        return new Promise((resolve, reject) => {
            db.run(`UPDATE tags SET name = ? WHERE id = ?`, [tag.name, tag.id], (err) => {
                setTimeout(() => {
                    err ? reject(err) : resolve()
                }, DEBUG_TIMEOUT)
            })
        })
    },

    getTagsAvailable ({limit = 48, offset = 0, nameLike = ''} = {}) {
        return new Promise((resolve, reject) => {
            db.get(`
            SELECT COUNT(*) AS count 
            FROM tags 
            WHERE tags.name LIKE (SELECT '%' || ? || '%')
            `, [nameLike], (err, row) => {
                if (err) {
                    reject(err)
                } else {
                    db.all(`
                    SELECT tags.*, COUNT(images_tags.tag_id) as imagesNum  
                    FROM tags 
                    LEFT JOIN images_tags ON tags.id = images_tags.tag_id
                    WHERE tags.name LIKE (SELECT '%' || ? || '%')
                    GROUP BY tags.id
                    ORDER BY tags.name LIMIT ? OFFSET ?`,
                        [nameLike, limit, offset],
                        (err, rows) => {
                            setTimeout(() => {
                                rows ? resolve({tags: rows, total: row.count}) : reject(err)
                            }, DEBUG_TIMEOUT)
                        })
                }
            })
        })
    },

    getTagsForImage (imageId) {
        return new Promise((resolve, reject) => {
            db.all(`
            SELECT tags.* FROM images_tags 
            INNER JOIN tags ON tags.id = images_tags.tag_id
            WHERE images_tags.image_id = ? 
            ORDER BY tags.name
            `,
                [imageId],
                (err, rows) => {
                    setTimeout(() => {
                        rows ? resolve(rows) : reject(err)
                    }, DEBUG_TIMEOUT)
                })
        })
    },

    removeTag (id) {
        return new Promise((resolve, reject) => {
            db.exec(`BEGIN`, () => {
                db.run(`DELETE FROM tags WHERE id = ?`, [id], (err) => {
                    if (err) {
                        db.exec(`ROLLBACK`, () => {
                            reject(err)
                        })
                    } else {
                        db.run(`DELETE FROM images_tags WHERE tag_id = ?`, [id], (err) => {
                            if (err) {
                                db.exec(`ROLLBACK`, () => {
                                    reject(err)
                                })
                            } else {
                                db.exec(`COMMIT`, () => {
                                    setTimeout(() => {
                                        resolve()
                                    }, DEBUG_TIMEOUT)
                                })
                            }
                        })
                    }
                })
            })
        })
    },

    insertImageTag (imageId, tagId) {
        return new Promise((resolve, reject) => {
            db.run(`INSERT OR IGNORE INTO images_tags (image_id, tag_id) VALUES (?, ?)`, [imageId, tagId], (err) => {
                setTimeout(() => {
                    err ? reject(err) : resolve()
                }, DEBUG_TIMEOUT)
            })
        })
    },

    removeImageTag (imageId, tagId) {
        return new Promise((resolve, reject) => {
            db.run(`DELETE FROM images_tags WHERE images_tags.image_id = ? AND images_tags.tag_id = ?`, [imageId, tagId], (err) => {
                setTimeout(() => {
                    err ? reject(err) : resolve()
                }, DEBUG_TIMEOUT)
            })
        })
    },
}


module.exports = Db
