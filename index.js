const fs = require("fs")

class DatabaseError extends Error {
    constructor(message) {
        super(message)
        this.name = "DatabaseError"
    }
}

const backupFrequency = {
	'debug': 7,
	'every-half-minute': 30,
	'every-minute': 60,
	'hourly': 3600,
	'daily': 86400,
	'weekly': 604800,
	'monthly': 2629743
}

/**
 * Creates a Database on the specified file location
 * @example 
 * const db = new Database("./db.json", { formatting: "compact", backups: "daily" })
 * @constructor
 * @param {string} location - The location of the database.
 * @param {object} [options] - The database options, such as formatting.
 * @param {string} [options.formatting=compact] - The formatting settings for the JSON file.
 * @param {('monthly'|'weekly'|'daily'|'hourly'|'every-minute'|'every-half-minute'} [options.backups=daily] - The backup settings for the JSON file.
 * @param {string} [options.backupDirectory=./backups/] - The directory in the file system where the backups will be stored. Default is './'.
 */
module.exports = function (location, options) {
	/**
	 * Stringifies an object using selected formatting option
	 * @todo Make the function not hardcoded 
 	*/
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
    fs.writeFileSync(location, stringifyWithOptions(database))
	
	
	const backup = () => {
		let current = Math.floor(Date.now()).toString() //Saving current unix time (in milliseconds)
		this.write('LAST_BACKUP', current, false) //Saving in db last backup (current one)
		try {
      fs.writeFileSync(options.backupDirectory + this.name + '_BACKUP_' + current + '.json', stringifyWithOptions(this.value()))
		} catch (error) {
			throw new DatabaseError('An error occurred while saving a backup. Please make sure the backupDirectory is correct.\n' + error)
		}

	}
	
	const checkLastBackup = () => { //Checking if a previous backup was made
		if (this.exists('LAST_BACKUP') == false) {
			this.write('LAST_BACKUP', Math.floor(Date.now()).toString(), false)			
		}
		backup()
	}

	
    /**
    * The database name
    * @example 
    * console.log(db.name) // test.json
    * @readonly
        * @returns {string} name - The name of the database.
    */
    this.name = location.split("/")[location.split("/").length - 1]

	/**
    * Database location in the file system
    * @example 
    * console.log(db.location) // './db.json'
    * @readonly
        * @returns {string} location - The location on the file system of the database.
    */
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
    * Returns the unix time in milliseconds of the last backup
    * @example 
    * console.log(db.lastBackup) // 1668528491
    * @readonly
        * @returns {string} time - The time in unix time.
    */
    this.lastBackup = this.read('LAST_BACKUP')
  
    /**
    * Writes a value to the specified key
    * @example 
    * db.write("site","google") 
    * @param {string} key
    * @param {string} value
    */
    this.write = function(key, value) {
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
            fs.writeFileSync(location, stringifyWithOptions(database))
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
			fs.writeFileSync(location, stringifyWithOptions(database))
		} else if(typeof key == "object") {
			for (const keyToChange of key) {
				delete database[`${keyToChange}`]
			}
			fs.writeFileSync(location, stringifyWithOptions(database))
		} else { throw new DatabaseError("Please send a valid key to delete") }
    }

	
	//Automatic backup system
	//IF (CURRENT TIME - LAST BACKUP) > BACKUP FREQUENCY (to ms, 1s = 1000ms)
	if (((Date.now()) - (Number(this.read('LAST_BACKUP')))) > Math.floor(backupFrequency[options.backups] * 1000)) { //Pretty confusing right?
		//Too much time passed since last backup; doing one right now
		checkLastBackup()
		const interval = setInterval(() => { //Loop to make backups
				checkLastBackup()
		}, Math.floor(backupFrequency[options.backups] * 1000)); //Converting seconds to milliseconds
	} else {
		//We still need to wait; creates a timer until it's time
		const timeout = setTimeout(() => {
			//Time has passed; making a backup and stopping the timer
			checkLastBackup()
			clearTimeout(timeout)
			const interval = setInterval(() => { //Loop to make backups
				checkLastBackup()
			}, Math.floor(backupFrequency[options.backups] * 1000)); //Converting seconds to milliseconds
		}, ((Date.now()) - (Number(this.read('LAST_BACKUP')))));
	}
}
