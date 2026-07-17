import * as fs from "fs"
import * as path from "path"
import Database from "better-sqlite3"
import "dotenv/config"
import dbConfig from "./db-table"

const dbPath = path.resolve(process.cwd(), "option.db")
const db = new Database(dbPath)

// Initialize the version tracking table
db.exec(`
  CREATE TABLE IF NOT EXISTS table_versions (
    table_name TEXT PRIMARY KEY,
    version INTEGER
  )
`)

// Function to initialize or migrate database tables based on db-table definitions
function initializeDatabase() {
  for (const tableName of Object.keys(dbConfig)) {
    try {
      if (tableName === "table_versions") continue

      const table = dbConfig[tableName]
      const expectedVersion = table.version
      
      // Get currently stored version
      const versionRow = db.prepare("SELECT version FROM table_versions WHERE table_name = ?").get(tableName) as { version: number } | undefined
      const activeVersion = versionRow ? versionRow.version : null

      // Check if table exists
      const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(tableName) as { name: string } | undefined
      
      // Construct CREATE TABLE query
      const columnParts: string[] = []
      const expectedColumnsMap = new Map<string, string>() // columnName -> type (e.g. TEXT)

      for (const colName of Object.keys(table.columns)) {
        columnParts.push(`${colName} ${table.columns[colName]}`)
        const typeWord = table.columns[colName].split(" ")[0].toUpperCase()
        expectedColumnsMap.set(colName, typeWord)
      }
      if (table.PRIMARY_KEY) {
        columnParts.push(`PRIMARY KEY (${table.PRIMARY_KEY})`)
      }
      const createTableSql = `CREATE TABLE ${tableName} (${columnParts.join(", ")})`

      if (!tableExists) {
        console.log(`Creating table ${tableName}...`)
        db.exec(createTableSql)
        db.prepare("INSERT OR REPLACE INTO table_versions (table_name, version) VALUES (?, ?)").run(tableName, expectedVersion)
      } else {
        // Table exists, check if version changed
        if (activeVersion !== null && activeVersion !== expectedVersion) {
          // Destructive migration requested by bumping the version
          console.log(`Version change detected for table "${tableName}" (${activeVersion} -> ${expectedVersion}). Recreating table (deleting data)...`)
          db.transaction(() => {
            db.exec(`DROP TABLE IF EXISTS ${tableName}`)
            db.exec(createTableSql)
            db.prepare("INSERT OR REPLACE INTO table_versions (table_name, version) VALUES (?, ?)").run(tableName, expectedVersion)
          })()
          console.log(`Recreated table "${tableName}" successfully.`)
        } else {
          // Non-destructive migration: version is same or not yet recorded. Only alter/copy if columns changed
          const activeColumns = db.prepare(`PRAGMA table_info(${tableName})`).all() as { name: string; type: string }[]
          const activeColMap = new Map<string, string>()
          for (const col of activeColumns) {
            activeColMap.set(col.name, col.type.toUpperCase())
          }

          // Compare expected columns
          let needsMigration = false
          const expectedColNames = Array.from(expectedColumnsMap.keys())
          
          for (const colName of expectedColNames) {
            const activeType = activeColMap.get(colName)
            const expectedType = expectedColumnsMap.get(colName)
            if (!activeType || activeType !== expectedType) {
              needsMigration = true
              break
            }
          }

          for (const activeColName of activeColMap.keys()) {
            if (!expectedColumnsMap.has(activeColName)) {
              needsMigration = true
              break
            }
          }

          if (needsMigration) {
            console.log(`Schema mismatch detected for table "${tableName}". Altering table (copying data)...`)
            db.transaction(() => {
              const tempBackupName = `${tableName}_temp_backup`
              db.exec(`DROP TABLE IF EXISTS ${tempBackupName}`)
              db.exec(`ALTER TABLE ${tableName} RENAME TO ${tempBackupName}`)
              db.exec(createTableSql)
              
              const oldColNames = Array.from(activeColMap.keys())
              const intersect = oldColNames.filter(c => expectedColNames.includes(c))
              if (intersect.length > 0) {
                const colsJoined = intersect.join(", ")
                db.exec(`INSERT INTO ${tableName} (${colsJoined}) SELECT ${colsJoined} FROM ${tempBackupName}`)
              }
              db.exec(`DROP TABLE ${tempBackupName}`)
              db.prepare("INSERT OR REPLACE INTO table_versions (table_name, version) VALUES (?, ?)").run(tableName, expectedVersion)
            })()
            console.log(`Altered table "${tableName}" successfully.`)
          } else {
            // Version tracking sync (if activeVersion was null)
            db.prepare("INSERT OR REPLACE INTO table_versions (table_name, version) VALUES (?, ?)").run(tableName, expectedVersion)
          }
        }
      }
    } catch (err: any) {
      console.error(`Error initializing or migrating table "${tableName}":`, err.message)
    }
  }
}

console.log("Starting database initialization...")
initializeDatabase()

// Run migration from option.json or option.json.backup if it exists and database tables are empty
const jsonPath = path.resolve(process.cwd(), "option.json")
const backupPath = path.resolve(process.cwd(), "option.json.backup")

// Fallback migration check if SQLite database is completely unpopulated and option.json.backup is present
if (!fs.existsSync(jsonPath) && fs.existsSync(backupPath)) {
  try {
    const optionsTableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='options'").get() as { name: string } | undefined
    if (optionsTableExists) {
      const prefixCheck = db.prepare("SELECT COUNT(*) as count FROM options WHERE key = 'prefix'").get() as { count: number }
      if (prefixCheck.count === 0) {
        console.log("Empty SQLite database detected. Re-triggering migration using backup file...")
        fs.copyFileSync(backupPath, jsonPath)
      }
    }
  } catch (e) {
    // Ignore check failures
  }
}

if (fs.existsSync(jsonPath)) {
  try {
    console.log(`Migrating data from option.json to SQLite database...`)
    const raw = fs.readFileSync(jsonPath, "utf-8")
    const data = JSON.parse(raw)
    
    db.transaction(() => {
      // Dynamic migration based on dbConfig and option JSON keys
      for (const jsonKey of Object.keys(data)) {
        if (jsonKey === "owner") {
          continue
        }

        const table = dbConfig[jsonKey]
        if (table) {
          const colNames = Object.keys(table.columns)
          const pkName = colNames[0]
          const val = data[jsonKey]

          if (table.jsType === "array") {
            db.prepare(`DELETE FROM ${jsonKey}`).run()
            const colPlaceholders = colNames.map(() => "?").join(", ")
            const insert = db.prepare(`INSERT INTO ${jsonKey} (${colNames.join(", ")}) VALUES (${colPlaceholders})`)
            
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
            db.prepare(`DELETE FROM ${jsonKey}`).run()
            const insert = db.prepare(`INSERT INTO ${jsonKey} (${pkName}) VALUES (?)`)
            for (const jid of val || []) {
              insert.run(jid)
            }
          } 
          else if (table.jsType === "object-map") {
            db.prepare(`DELETE FROM ${jsonKey}`).run()
            const colPlaceholders = colNames.map(() => "?").join(", ")
            const insert = db.prepare(`INSERT INTO ${jsonKey} (${colNames.join(", ")}) VALUES (${colPlaceholders})`)
            
            for (const k of Object.keys(val || {})) {
              const item = val[k]
              const rowValues = colNames.map(colName => {
                if (colName === pkName) return k
                return item[colName]
              })
              insert.run(...rowValues)
            }
          } 
          else if (table.jsType === "array-map") {
            db.prepare(`DELETE FROM ${jsonKey}`).run()
            const secondColName = colNames[1]
            const insert = db.prepare(`INSERT INTO ${jsonKey} (${pkName}, ${secondColName}) VALUES (?, ?)`)
            
            for (const k of Object.keys(val || {})) {
              for (const jid of val[k] || []) {
                insert.run(k, jid)
              }
            }
          } 
          else if (table.jsType === "json-map") {
            db.prepare(`DELETE FROM ${jsonKey}`).run()
            const insert = db.prepare(`INSERT INTO ${jsonKey} (${pkName}, data) VALUES (?, ?)`)
            for (const k of Object.keys(val || {})) {
              insert.run(k, JSON.stringify(val[k]))
            }
          }
        } else {
          // Root key-value option (like prefix), save in options table
          const stmt = db.prepare("INSERT OR REPLACE INTO options (key, value) VALUES (?, ?)")
          stmt.run(jsonKey, JSON.stringify(data[jsonKey]))
        }
      }
    })()

    // Sync OWNER in .env if owner list exists in option.json
    const ownersList = data.owner || []
    if (ownersList.length > 0) {
      const ownersStr = ownersList.filter(Boolean).join(",")
      const envPath = path.resolve(process.cwd(), ".env")
      let envContent = ""
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, "utf-8")
      }
      if (!envContent.includes("OWNERS=") && !envContent.includes("OWNER=")) {
        console.log(`Writing owners on start to .env file: OWNER="${ownersStr}"`)
        const prefixNewline = envContent.endsWith("\n") ? "" : "\n"
        fs.appendFileSync(envPath, `${prefixNewline}OWNER="${ownersStr}"\n`)
      } else {
        console.log(`Syncing OWNER in .env on start/restart with JSON: "${ownersStr}"`)
        let updatedEnv = envContent
        if (envContent.includes("OWNERS=")) {
          updatedEnv = envContent.replace(/OWNERS=["'][^"']*["']/g, `OWNERS="${ownersStr}"`)
        } else if (envContent.includes("OWNER=")) {
          updatedEnv = envContent.replace(/OWNER=["'][^"']*["']/g, `OWNER="${ownersStr}"`)
        }
        fs.writeFileSync(envPath, updatedEnv, "utf-8")
      }
      process.env.OWNER = ownersStr
    }

    console.log("Migration complete!")
    fs.renameSync(jsonPath, backupPath)
    console.log(`Renamed option.json to option.json.backup`)
  } catch (err) {
    console.error("Failed to migrate option.json:", err)
  }
}

console.log("Database initialization finished.")
db.close()
