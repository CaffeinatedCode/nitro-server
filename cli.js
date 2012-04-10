/* Nitro CLI 
 *
 * Copyright (C) 2012 Caffeinated Code <http://caffeinatedco.de>
 * Copyright (C) 2012 Jono Cooper
 * Copyright (C) 2012 George Czabania
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * Neither the name of Caffeinated Code nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

console.info('Nitro 1.0\nCopyright (C) 2012 Caffeinated Code\nBy George Czabania & Jono Cooper');
var cli = {
	escape: function(str) {
		//Regexes a bunch of shit that breaks the Linux version

		if (typeof str == 'string') {
			//Backslash, Pipe, newline, quote
			str = str.replace(/\\/g, "&#92;").replace(/\|/g, "&#124").replace(/\"/g, "&#34;").replace(/\'/g, "&#39;");
			return str;
		} else {
			return str;
		}
		
	},
	addTask: function(name, list) {
		name = cli.escape(name);
		// Creates a task

		//Id of task
		var id = cli.storage.tasks.length;
		cli.storage.tasks.length++;

		//Saves to Localstorage
		cli.storage.tasks[id] = { 
			content: name,
			priority: 'none',
			date: '',
			notes: '',
			today: 'false',
			showInToday: '1',
			list: list,
			logged: false
		};

		if (list == 'today') {
			cli.today(id).add();
		} else {
			//Pushes to array
			cli.storage.lists.items[list].order.unshift(id);		
		};

		//Saves to disk
		cli.storage.save();

		//Returns something
		console.log("Created Task: '" + name + "' with id: " + id + " in list: " + list);

	},
	deleteTask: function(id) {
		var task = cli.taskData(id).display();

		cli.calc.removeFromList(id, task.list);

		//Changes task List to 0 so today.calculate removes it.
		task.list = 0;
		cli.taskData(id).edit(task);

		//Removes from Today and Next
		cli.today(id).calculate();

		//Removes from list
		cli.calc.removeFromList(id, 0);

		//Deletes Data
		delete cli.storage.tasks[id];

		//Saves
		cli.storage.save();
	},
	populate: function(type, query) {
		query = cli.escape(query);
		// Displays a list
		switch(type) {
			case "list":
				// Get tasks from list

				switch(query) {
					case "logbook":

						var logbook = [];

						for (var t = 0; t < cli.storage.tasks.length; t++) {
							// looooooping through the tasks
							if (cli.storage.tasks[t]) {
								if(cli.storage.tasks[t].logged) {
									var data = cli.taskData(t).display()
									//remove today & date data
									data.date = '';
									data.today = 'false';
									cli.taskData(t).edit(data);

									logbook.push(t)
								}
							}
						}

						return logbook;

						break;
					default:
						if(query in cli.storage.lists.items) return cli.storage.lists.items[query].order;
						else return [];
				}

				break;

			case "search":
				// Run search

				// Set vars
				var query = query.split(' '),
					results = [],
					search;

				// Search loop
				for (var t = 0; t < cli.storage.tasks.length; t++) {

					// If task exists
					if (cli.storage.tasks[t]) {

						// Exclude logged tasks
						if(!cli.storage.tasks[t].logged) {

							var pass1 = [],
								pass2  = true;

							// Loop through each word in the query
							for (var q = 0; q < query.length; q++) {

								// Create new search
								search = new RegExp(query[q], 'i');

								// Search
								if (search.test(cli.storage.tasks[t]['content'] + cli.storage.tasks[t]['notes'])) pass1.push(true);
								else pass1.push(false);
							}

							// This makes sure that the task has matched each word in the query
							for (var p = 0; p < pass1.length; p++) {
								if(pass1[p] == false) pass2 = false;
							}

							// If all terms match then add task to the results array
							if(pass2) results.push(t)
						}
					}
				}
				return results;
		}
	},
	moveTask: function(id, list) {
		// Moves task to list

		var task = cli.taskData(id).display(),
			lists = cli.storage.lists.items

		// Remove task from old list
		cli.calc.removeFromList(id, task.list);

		// Add task to new list
		lists[list].order.push(id);

		// Update task.list
		task.list = list;

		cli.today(id).calculate();

		//If it's dropped in Someday, we strip the date & today
		if (list == 'someday') {
			task.date = '';
			cli.today(id).remove();
		}

		// Save
		cli.taskData(id).edit(task);
		cli.storage.lists.items = lists;
		cli.storage.save();

		console.log('The task with the id: ' + id + ' has been moved to the ' + list + ' list')
	},
	today: function(id) {
		return {
			add: function() {
				// Adds to Today Manually
				var task = cli.taskData(id).display();

				task.today = 'manual';
				task.showInToday = '1';
				cli.today(id).calculate()

			},
			remove: function() {
				// Removes from Today Manually
				var task = cli.taskData(id).display();

				task.today = 'false';
				task.showInToday = 'none';

				if (task.list == 'today') {
					task.list = 'next';
				};

				cli.today(id).calculate();
			},
			calculate: function() {
				/* This is the function that I wish I had.
				 * Removes from today or next then
				 * Depending on the due date etc, the function chucks it into today, next etc
				 */
				 
				//Removes from Today & Next
				var task = cli.taskData(id).display(),
					lists = cli.storage.lists.items;
				
				// Remove task from Today
				cli.calc.removeFromList(id, 'today');
				
				// Remove task from Next
				cli.calc.removeFromList(id, 'next');
				
				console.log('List: ' + task.list);

				//If the task is due to be deleted, then delete it
				if (task.list == 0) {
					return;
				}

				//If task is in logbook, do nothing
				if (task.logged) {
					return;
				}

				//Calculates date. Changes today Status
				cli.calc.date(id);
				
				//If the list is today, we place back in today & next
				if (task.list == 'today') {
					
					lists.today.order.unshift(id);
					lists.next.order.unshift(id);

					console.log('List in today, placed in today');
				} else {
					//If the task is either manually in today, or has a date, we place in Today and next
					if (task.today == 'manual' || task.today == 'yesAuto') {
						//Adds to Today & Next arrays
						console.log('List either manually set or Date set. In today');
						lists.today.order.unshift(id);
						lists.next.order.unshift(id);
					} else {
						console.log('Not in today');
						//Do nothing unless in Next list
						if (task.list == 'next') {
							//Adds to Next array
							lists.next.order.unshift(id);
						};
					};
				}
				
				//Saves data
				cli.storage.save();
			}
		}
	},
	logbook: function(id) {
		// Toggles an item to/from the logbook

		var task = cli.taskData(id).display(),
			lists = cli.storage.lists.items;

		// Check if task exists
		if(!task) {
			console.log('No task with id: ' + id + ' exists');
			return;
		}

		task.logged = !task.logged;

		//If list is deleted, set to next
		if(!(task.list in lists)) task.list = 'next';

		if(task.logged) { // Uncomplete -> Complete
			//Gets name of list
			var oldlist = task.list;

			//Puts it in List 0 where it goes to die
			cli.moveTask(id, 0);
			cli.calc.removeFromList(id, 0);

			//Moves it back to original list
			task.list = oldlist;

			console.log("Task with id: " + id + " has been completed");
		} else {
			// Complete -> Uncomplete

			// Add task to list
			lists[task.list].order.push(id);

			console.log("Task with id: " + id + " has been uncompleted");	
		}

		cli.taskData(id).edit(task);
		cli.storage.lists.items = lists;
		cli.storage.save();
	},
	priority: function(id) {
		return {
			get: function() {
				var priority = cli.storage.tasks[id].priority;
				return priority;
			},
			set: function() {
				var priority = cli.storage.tasks[id].priority;
				switch(priority) {
					case "low":
						priority = "medium";
						break;
					case "medium":
						priority = "important";
						break;
					case "important":
						priority = "none";
						break;
					case "none":
						priority = "low";
						break;
				}
				cli.storage.tasks[id].priority = priority;
				cli.storage.save();
				return priority;
			}
		}
	},
	taskData: function(id) {
		return {
			display: function () {
				// Returns taskData as object
				return cli.storage.tasks[id];

			},
			edit: function(obj) {
				// Edit taskData
				$.each(obj, function(index, value) { 
  					if (typeof value == "string") {
  						obj[index] = cli.escape(value);
  					}
				});

				cli.storage.tasks[id] = obj;
				cli.storage.save();
				
			}
		};
	},
	list: function(id, name) {
		name = cli.escape(name);

		return {
			add: function() {
				// Adds a list
				var newId = cli.storage.lists.items.length;

				//Chucks data in object
				cli.storage.lists.items[newId] = { name: name, order: []};

				//Adds to order array
				cli.storage.lists.order.push(newId);

				//Returns something
				console.log("Created List: '" + name + "' with id: " + newId);

				//Updates Total
				cli.storage.lists.items.length++;
				cli.storage.save();
			},
			rename: function() {
				// Renames a list
				cli.storage.lists.items[id].name = name;

				//Saves to localStorage
				cli.storage.save();

				//Returns something
				console.log("Renamed List: " + id + " to: '" + name + "'");
			},
			delete: function() {
				//Deletes data in list
				for (var i=0; i<cli.storage.lists.items[id].order.length; i++) {
					cli.today(cli.storage.lists.items[id].order[i]).remove();
					delete cli.storage.tasks[cli.storage.lists.items[id].order[i]];
				};


				//Deletes actual list
				delete cli.storage.lists.items[id];
				cli.storage.lists.order.splice(jQuery.inArray(parseInt(id), cli.storage.lists.order), 1);

				//Saves to disk
				cli.storage.save();

				//Returns something
				console.log("Deleted List: " + id);
			},
			taskOrder: function(order) {
				//Order of tasks
				cli.storage.lists.items[id].order = order;
				cli.storage.save();
			},
			order: function(order) {
				// Order of lists
				cli.storage.lists.order = order;
				cli.storage.save();
			}
		}
	},
	calc: {
		//Another object where calculations are done
		removeFromList: function(id, list) {

			var task = cli.taskData(id).display(),
				lists = cli.storage.lists.items;

			// DOES NOT REMOVE LIST FROM TASK
			// List must be manually removed from task.list
			// task.list = '';
			
			// Remove task from Today
			for(var i = 0; i < lists[list].order.length; i++) {
				if(lists[list].order[i] == id) {
					lists[list].order.splice(i, 1);
					console.log('Removed: ' + id + ' from ' + list);
				};
			};

			// cli.taskData(id).edit(task);
			cli.storage.lists.items = lists;
			cli.storage.save();
		},

		date: function(id) {
			var task = cli.taskData(id).display(),
			lists = cli.storage.lists.items;

			//If it's already in today, do nothing. If it doesn't have a date, do nothing.
			if (task.today != 'manual' && task.date != '') {
				if (task.showInToday == 'none') {
					//Remove from today
					task.today = 'false';
					console.log('Specified to not show in today')

					//Remove from queue
					if (cli.storage.queue[id]) {
						delete cli.storage.queue[id];
					};

				} else {
					console.log('Due date, running queue function')

					//Due date + days to show in today
					var date = new Date(task.date);
					date.setDate(date.getDate() - parseInt(task.showInToday));
					var final = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getUTCFullYear();

					cli.storage.queue[id] = final;

					cli.storage.save();

					//Refreshes Date Queue
					cli.calc.todayQueue.refresh();
				};
			};
		},
		dateConvert: function(olddate) {
			//Due date + days to show in today
			var date = new Date(olddate);
			var final = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getUTCFullYear();

			return final;
		},
		prettyDate: {
			convert: function(date) {
				date = date.split('/');
				date = new Date(date[2], date[0] - 1, date[1]);
				//If it's the current year, don't add the year.
				if (date.getFullYear() == new Date().getFullYear()) {
					date = date.toDateString().substring(4).replace(" 0"," ").replace(" " + new Date().getFullYear(), '');
				} else {
					date = date.toDateString().substring(4).replace(" 0"," ");
				};
				return date;
			},
			difference: function(date) {

				if (date == '') {
					return ['', '']
				} else {
					var	now = new Date(),
						date = date.split('/'),
						difference = 0,
						oneDay = 86400000; // 1000*60*60*24 - one day in milliseconds

					// Convert to JS
					date = new Date(date[2], date[0] - 1, date[1]);
					
					// Find difference between days
					difference = Math.ceil((date.getTime() - now.getTime()) / oneDay);

					// Show difference nicely
					if(difference < 0) {
						// Overdue
						difference = Math.abs(difference);
						if(difference != 1) return [$.i18n._('daysOverdue', [difference]), 'due'];
						else return [$.i18n._('dayOverdue'), 'due'];
					} else if(difference == 0) {
						// Due
						return ["due today", 'due']
					} else if(difference < 15) {
						// Due in the next 15 days
						if(difference != 1) return [$.i18n._('daysLeft', [difference]), ''];
						else return [$.i18n._('dayLeft'), '']
					} else {
						// Due after 15 days
						var month = $.i18n._('month');
						return [month[date.getMonth()] + " " + date.getDate(), ''];
					};	
				};
			}
		},
		todayQueue: {
			
			refresh: function() {

				for (var key in cli.storage.queue) {
					if (cli.storage.queue.hasOwnProperty(key)) {
					    console.log(key +  " -> " + cli.storage.queue[key]);

						var targetdate = new Date(cli.storage.queue[key]);
					    var todaydate = new Date();

						//Reset to 0:00
						todaydate.setSeconds(0);
						todaydate.setMinutes(0);
					    todaydate.setSeconds(0);

						//If today is the same date as the queue date or greater, put the task in today and next
					    if (todaydate >= targetdate) {
					    	
					    	cli.storage.tasks[key].today = 'yesAuto';

					    	//Adds to today & next lists
					    	cli.storage.lists.items.today.order.push(key);

					    	//Makes sure it doesn't it doesn't double add to next
					    	if (cli.storage.tasks[key].list != 'next') {
					    		cli.storage.lists.items.next.order.push(key);
					    	}

					    	delete cli.storage.queue[key];

					    } else {
							//Wait till tomorrow.
							cli.storage.tasks[key].today = 'noAuto';
					    };
						cli.storage.save();
					};
				};
			}
		}
	},

	storage: {
		//Object where data is stored
		tasks: $.jStorage.get('tasks', {length: 0}),
		queue: $.jStorage.get('queue', {}),
		lists: $.jStorage.get('lists', {order: [], items:{today: {name: "Today", order:[]}, next: {name: "Next", order:[]}, someday: {name: "Someday", order:[]}, 0: {order:[]}, length: 1}}),
		prefs: $.jStorage.get('prefs', {deleteWarnings: false, gpu: false, nextAmount: 'threeItems', over50: true, lang: 'english'}),
		// NB: Over 50 caps amount of tasks in List to 50 but causes drag and drop problems.
		// I CBF fixing it.

		save: function() {
			//Saves to localStorage
			$.jStorage.set('tasks', cli.storage.tasks);
			$.jStorage.set('lists', cli.storage.lists);
			$.jStorage.set('queue', cli.storage.queue);
			$.jStorage.set('prefs', cli.storage.prefs);
		}
	}
}