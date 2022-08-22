const fs = require("fs")

class DatabaseError extends Error {
    constructor(message) {
        super(message)
        this.name = "DatabaseError"
    }
}


/**
 * Creates a Database on the specified file location
 * @example 
 * const db = new Database("./db.json", {backups: "daily"})
 * @constructor
 * @param {string} location - The location of the database.
 * @param {object} options - The database options, such as backups.
 */
module.exports = function (location, options) {
    if(!location) throw new DatabaseError("Argument missing. Please put a location when creating a database.")
    let database
    try {
        database = JSON.parse(fs.readFileSync(location))
    } catch {
        database = {}
    }
    fs.writeFileSync(location, JSON.stringify(database))
    
    /**
    * The database name
    * @example 
    * console.log(db.name) // test.json
    * @readonly
        * @returns {string} name - The name of the database.
    */
    this.name = location.split("/")[location.split("/").length - 1]
    
    this.location = location
    
    /**
    * Database options, such as amount of backups
    * @example 
    * console.log(db.options) // {backups: "daily"}
    * @readonly
        * @returns {object} options - The options of the database.
    */
    this.options = options || {}

    /**
    * Reads a specific key of the database
    * @example 
    * console.log(db.read("test.status")) // "sucess"
    * @param {object} value - Value of the specified key.
    */
    this.read = function(key) {
        if(!key) throw new DatabaseError("Please send a valid key.")
        try {
            return eval("database." + key)
        } catch {
            return null
        }
    }

    /**
    * Checks if a specific key exists on the database
    * @example 
    * console.log(db.exists("test.status")) // true
    * @param {string} key - The key to check.
    * @returns {boolean} exists - True if the key exists.
    */
    this.exists = function(key) {
        try {
            return eval("database." + key) ? true :  false
        } catch {
            return false
        }
    }

    /**
    * Writes a value to the specified key
    * @example 
    * db.write("site","google") 
    * @param {string} key
    */
    this.write = function(key, value) {
        if(!key || !value) throw new DatabaseError("Please send a valid key and a value to set.")
        if(typeof key != "string") throw new DatabaseError("Key name must be a string.")
        try {
            eval("database." + key + " = value")
            fs.writeFileSync(location, JSON.stringify(database))
        } catch(e) {
            throw new DatabaseError(e)
        }
    }
}
