export interface TableConfig {
  columns: { [columnName: string]: string };
  PRIMARY_KEY?: string;
  jsType: "root" | "array" | "string-array" | "object-map" | "array-map" | "json-map";
  version: number;
}

const dbConfig: { [tableName: string]: TableConfig } = {
  options: {
    columns: {
      key: "TEXT PRIMARY KEY",
      value: "TEXT"
    },
    jsType: "root",
    version: 1
  },
  shalat: {
    columns: {
      room: "TEXT PRIMARY KEY",
      status: "INTEGER",
      kode: "INTEGER"
    },
    jsType: "array",
    version: 1
  },
  ban: {
    columns: {
      jid: "TEXT PRIMARY KEY"
    },
    jsType: "string-array",
    version: 1
  },
  newmem: {
    columns: {
      room: "TEXT PRIMARY KEY",
      message: "TEXT",
      image: "TEXT"
    },
    jsType: "object-map",
    version: 1
  },
  restrict: {
    columns: {
      room: "TEXT",
      jid: "TEXT"
    },
    PRIMARY_KEY: "room, jid",
    jsType: "array-map",
    version: 1
  },
  rpg: {
    columns: {
      user_id: "TEXT PRIMARY KEY",
      data: "TEXT"
    },
    jsType: "json-map",
    version: 1
  },
  wordle: {
    columns: {
      room: "TEXT PRIMARY KEY",
      data: "TEXT"
    },
    jsType: "json-map",
    version: 1
  },
  penting: {
    columns: {
      topic: "TEXT PRIMARY KEY",
      data: "TEXT"
    },
    jsType: "json-map",
    version: 1
  },
  specialpermission: {
    columns: {
      jid: "TEXT PRIMARY KEY"
    },
    jsType: "string-array",
    version: 1
  },
  run: {
    columns: {
      room: "TEXT PRIMARY KEY",
      data: "TEXT"
    },
    jsType: "json-map",
    version: 1
  }
};

export default dbConfig;
