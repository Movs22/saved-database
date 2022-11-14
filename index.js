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
 * const db = new Database("./db.json", { formatting: "compact", backups: "daily" })
 * @constructor
 * @param {string} location - The location of the database.
 * @param {object} [options] - The database options, such as formatting.
 * @param {string} [options.formatting=compact] - The formatting settings for the JSON file.
 * @param {string} [options.backups=daily] - The backup settings for the JSON file.
 */
module.exports = function (location, options) {
	function stringifyWithOptions(databaseOBJ) {
	    if(options.formatting) {
		    if(options.formatting === "compact") {
				return JSON.stringify(databaseOBJ)
		    } else if(options.formatting === "expanded") {
				return JSON.stringify(databaseOBJ, null, 2)
		    } else { throw new DatabaseError("Invalid formatting type.") }
	    } else { return JSON.stringify(databaseOBJ) }
	}
    
    if(!location) throw new DatabaseError("Argument missing. Please put a location when creating a database.")
    let database
    try {
        database = JSON.parse(fs.readFileSync(location))
    } catch {
        database = {}
    }
    fs.writeFileSync(location, JSON.stringify(database))
    
    function backup(backups) {
	if(backups === "daily") {
		let d = new Date()
		fs.writeFileSync(location.split["/"].pop().join("/") + "/backups/" + location.split["/"][-1] + "-" + d.getDate() + "-" + d.getMonth() + d.getYear(), JSON.stringify(database))
	} else if(backups === "monthly") {
		let d = new Date()
		fs.writeFileSync(location.split["/"].pop().join("/") + "/backups/" + location.split["/"][-1] + "-" + "00" + "-" + d.getMonth() + d.getYear(), JSON.stringify(database))
	} else throw new DatabaseError("Invalid backup option. It should be either daily or monthly")
    }
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
    * console.log(db.options) // {format: "expanded", backups: "daily"}
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
        if(typeof key != "string") throw new DatabaseError("Key name must be a string.")
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
	backup(this.options.backups)
        if(!key || !value) throw new DatabaseError("Please send a valid key and a value to set.")
        if(typeof key != "string") throw new DatabaseError("Key name must be a string.")
        try {
            eval("database." + key + " = value")
            fs.writeFileSync(location, stringifyWithOptions(database))
        } catch(e) {
            throw new DatabaseError(e)
        }
    }

    /**
    * Returns the value of the current database
    * @example 
    * db.value() 
    * @readonly
    */
    this.value = function() {
        try {
            return eval("database")
        } catch {
            return null
        }
    }

    /**
    * Cleans the database
    * @example 
    * db.clear()
    */
    this.clear = function() {
        try {
            database = {}
            fs.writeFileSync(location, JSON.stringify(database))
        } catch(e) {
            throw new DatabaseError(e)
        }
    }

    /**
    * Deletes one or more keys from the database
    * @example 
    * db.delete("door")
    * db.delete(["window", "door"])
    * @param (string|string[]) key
    * @todo Error handling
    */
    this.delete = function(key) {
	if(!key) throw new DatabaseError("Please send a valid key to delete")
	if(typeof key == "string") {
		delete database[`${key}`]
		fs.writeFileSync(location, JSON.stringify(database))
	} else if(typeof key == "object") {
		for (const keyToChange of key) {
			delete database[`${keyToChange}`]
		}
		fs.writeFileSync(location, JSON.stringify(database))
	} else { throw new DatabaseError("Please send a valid key to delete") }
    }
}
