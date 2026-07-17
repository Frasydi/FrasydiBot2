import Database from "better-sqlite3"
import * as path from "path"
import "dotenv/config"
import dbConfig from "./db-table"

const dbPath = path.resolve(process.cwd(), "option.db")
const db = new Database(dbPath)

export function getOptions(requestedTables?: string | string[]) {
  try {
    const optionsObj: any = {}

    // 1. owner from .env (owner hanya 1)
    const ownerEnv = process.env.OWNER || process.env.OWNERS || ""
    optionsObj.owner = ownerEnv.split(",").map(o => o.trim()).filter(Boolean)

    // Normalisasikan daftar tabel yang akan di-query
    let tablesToQuery: string[]
    if (requestedTables) {
      const arr = Array.isArray(requestedTables) ? requestedTables : [requestedTables]
      // Selalu sertakan tabel 'options' untuk memuat prefix dan opsi dasar lainnya
      tablesToQuery = arr.includes("options") ? arr : ["options", ...arr]
    } else {
      tablesToQuery = Object.keys(dbConfig)
    }

    // Query tables dynamically from dbConfig
    for (const tableName of tablesToQuery) {
      const table = dbConfig[tableName]
      if (!table) continue

      if (tableName === "options") {
        const rows = db.prepare("SELECT key, value FROM options").all() as { key: string; value: string }[]
        for (const r of rows) {
          try {
            optionsObj[r.key] = JSON.parse(r.value)
          } catch (e) {
            optionsObj[r.key] = r.value
          }
        }
        continue
      }

      const rows = db.prepare(`SELECT * FROM ${tableName}`).all() as any[]
      const colNames = Object.keys(table.columns)
      const pkName = colNames[0]

      if (table.jsType === "array") {
        optionsObj[tableName] = rows.map(r => {
          const mappedRow = { ...r }
          for (const colName of colNames) {
            if (table.columns[colName].toUpperCase().startsWith("INTEGER") && (colName === "status" || colName.includes("status"))) {
              mappedRow[colName] = r[colName] === 1
            }
          }
          return mappedRow
        })
      } 
      else if (table.jsType === "string-array") {
        optionsObj[tableName] = rows.map(r => r[pkName])
      } 
      else if (table.jsType === "object-map") {
        optionsObj[tableName] = {}
        for (const r of rows) {
          const key = r[pkName]
          const valObj = { ...r }
          delete valObj[pkName]
          optionsObj[tableName][key] = valObj
        }
      } 
      else if (table.jsType === "array-map") {
        optionsObj[tableName] = {}
        const secondColName = colNames[1]
        for (const r of rows) {
          const key = r[pkName]
          const val = r[secondColName]
          if (!optionsObj[tableName][key]) {
            optionsObj[tableName][key] = []
          }
          optionsObj[tableName][key].push(val)
        }
      } 
      else if (table.jsType === "json-map") {
        optionsObj[tableName] = {}
        for (const r of rows) {
          const key = r[pkName]
          try {
            optionsObj[tableName][key] = JSON.parse(r.data)
          } catch (e) {
            optionsObj[tableName][key] = {}
          }
        }
      }
    }

    return optionsObj
  } catch (err) {
    console.error("Error reading options from database tables:", err)
    return {}
  }
}

export function setOptions(val: any, key: string) {
  try {
    db.transaction(() => {
      const rootTable = dbConfig["options"]
      if (key === "prefix" || (rootTable && rootTable.columns[key])) {
        const stmt = db.prepare("INSERT OR REPLACE INTO options (key, value) VALUES (?, ?)")
        stmt.run(key, JSON.stringify(val))
        return
      }

      const table = dbConfig[key]
      if (table) {
        const colNames = Object.keys(table.columns)
        const pkName = colNames[0]

        if (table.jsType === "array") {
          db.prepare(`DELETE FROM ${key}`).run()
          const colPlaceholders = colNames.map(() => "?").join(", ")
          const insert = db.prepare(`INSERT INTO ${key} (${colNames.join(", ")}) VALUES (${colPlaceholders})`)
          
          for (const item of val || []) {
            const rowValues = colNames.map(colName => {
              if (table.columns[colName].toUpperCase().startsWith("INTEGER") && (colName === "status" || colName.includes("status"))) {
                return item[colName] ? 1 : 0
              }
              return item[colName]
            })
            insert.run(...rowValues)
          }
        } 
        else if (table.jsType === "string-array") {
          db.prepare(`DELETE FROM ${key}`).run()
          const insert = db.prepare(`INSERT INTO ${key} (${pkName}) VALUES (?)`)
          for (const jid of val || []) {
            insert.run(jid)
          }
        } 
        else if (table.jsType === "object-map") {
          const keys = Object.keys(val || {})
          const colPlaceholders = colNames.map(() => "?").join(", ")
          const insert = db.prepare(`INSERT OR REPLACE INTO ${key} (${colNames.join(", ")}) VALUES (${colPlaceholders})`)
          
          for (const k of keys) {
            const item = val[k]
            const rowValues = colNames.map(colName => {
              if (colName === pkName) return k
              return item[colName]
            })
            insert.run(...rowValues)
          }
          
          if (keys.length > 0) {
            const placeholders = keys.map(() => "?").join(",")
            db.prepare(`DELETE FROM ${key} WHERE ${pkName} NOT IN (${placeholders})`).run(...keys)
          } else {
            db.prepare(`DELETE FROM ${key}`).run()
          }
        } 
        else if (table.jsType === "array-map") {
          const secondColName = colNames[1]
          const insert = db.prepare(`INSERT OR REPLACE INTO ${key} (${pkName}, ${secondColName}) VALUES (?, ?)`)
          
          for (const k of Object.keys(val || {})) {
            db.prepare(`DELETE FROM ${key} WHERE ${pkName} = ?`).run(k)
            for (const jid of val[k] || []) {
              insert.run(k, jid)
            }
          }
          
          const keys = Object.keys(val || {})
          if (keys.length > 0) {
            const placeholders = keys.map(() => "?").join(",")
            db.prepare(`DELETE FROM ${key} WHERE ${pkName} NOT IN (${placeholders})`).run(...keys)
          } else {
            db.prepare(`DELETE FROM ${key}`).run()
          }
        } 
        else if (table.jsType === "json-map") {
          const keys = Object.keys(val || {})
          const insert = db.prepare(`INSERT OR REPLACE INTO ${key} (${pkName}, data) VALUES (?, ?)`)
          for (const k of keys) {
            insert.run(k, JSON.stringify(val[k]))
          }
          if (keys.length > 0) {
            const placeholders = keys.map(() => "?").join(",")
            db.prepare(`DELETE FROM ${key} WHERE ${pkName} NOT IN (${placeholders})`).run(...keys)
          } else {
            db.prepare(`DELETE FROM ${key}`).run()
          }
        }
      }
    })()
  } catch (err) {
    console.error(`Error writing key "${key}" to database table:`, err)
  }
}