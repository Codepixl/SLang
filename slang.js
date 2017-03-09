var code = (function(){
	var codeBox;
	var inBox;
	var outBox = "";
	const ignoreRegexp = /\t| |\n|([#]+.*)/g;
	const stringRegexp = /(["'])(?:(?=(\\?))\2.)*?\1/;

	self.onmessage = function(e) {
		codeBox = e.data.codeBox;
		inBox = e.data.inBox;
		run();
		out();
		postMessage({done: true})
		close();
	};

	var stack = [0]
	var stacki = 0;
	var funcs = {}
	var callstack = []
	var labels = {}
	var input = []

	function run(){
		if(!codeBox) return
		stack = [0]
		stacki = 0
		funcs = {}
		callstack = []
		labels = {}
		input = inBox.match(/.{1}/g) || [];

		var code = codeBox.replace(ignoreRegexp,"").match(/(["'])(?:(?=(\\?))\2.)*?\1|(.{2})/g)
		var matched = []

		//verifying and adding funcs
		for(var i = 0; i < code.length; i++){
			var inst = instructionTypes[code[i]];
			if(!inst && !code[i].match(/(["'])(?:(?=(\\?))\2.)*?\1/)){
				outBox = "Unknown instruction "+code[i]
				return;
			}
			if(inst) matched.push(inst.do);
			else matched.push(err);
			if(inst && inst.preexec)
				inst.do({code: code, i:i});
		}

		outBox = "Output:\n";
		var ret,c = 0;
		for(var i = 0; i < code.length; i++){
			ret = matched[i]({code: code, i:i});
			i = ret == undefined ? i : ret-1;
			if(c++ > 500000){
				c = 0;
				out();
			}
		};
	}

	function err(message){
		outBox+=(message || "UNKNOWN ERROR")+"\n";
	}

	function out(){
		postMessage({stack:stack, stacki: stacki, output: outBox})
	}

	function nextStack(){
		stacki++
		if(stacki >  stack.length-1) stack.push(0)
	}

	function prevStack(){
		stacki--;
		if(stacki < 0) stacki = 0;
	}

	const instructionTypes = {
		':{':{ //start while
			do:function(args){
				if(!stack[stacki]){
					var count = 1;
					while(count != 0 && args.i < args.code.length){
						args.i++;
						if(args.code[args.i] === ':{') count++;
						else if(args.code[args.i] === '}:') count--;
					}
					if(args.i >= args.code.length){
						outBox+="WARNING: Unbalanced :{ }: !\n";
						return;
					}
					args.i++;
					return args.i;
				}
			}
		},
		'}:':{ //end while
			do:function(args){
				var count = 1;
				while(count != 0 && args.i >= 0){
					args.i--;
					if(args.code[args.i] === ':{') count--;
					else if(args.code[args.i] === '}:') count++;
				}
				if(args.i < 0){
					outBox+="WARNING: Unbalanced :{ }: !\n";
					return;
				}
				return args.i;
			}
		},
		':)':{ //next in stack
			do: nextStack
		},
		'(:':{ //same
			do: nextStack
		},
		':(':{ //previous in stack
			do: prevStack
		},
		'):':{ //same
			do: prevStack
		},
		':D':{ //add
			do: function(){
				stack[stacki]++;
			}
		},
		'D:':{ //sub
			do: function(){
				stack[stacki]--;
			}
		},
		';D':{ //add 5
			do: function(){
				stack[stacki]+=5;
			}
		},
		'D;':{ //sub 5
			do: function(){
				stack[stacki]-=5;
			}
		},
		'XD':{ //add 20
			do: function(){
				stack[stacki]+=20;
			}
		},
		'DX':{ //sub 20
			do: function(){
				stack[stacki]-=20;
			}
		},
		':P':{ //print num
			do: function(){
				outBox+=stack[stacki]+"\n";
			}
		},
		';P':{ //Print char
			do: function(){
				outBox+=String.fromCharCode(stack[stacki])
			}
		},
		'!!':{ //reset stack
			do: function(){
				stack = [0]
				stacki = 0
			}
		},
		':[':{ //function start
			do: function(args){
				var oi = args.i;
				var name = args.code[args.i+1]
				if(name && (name = name.match(stringRegexp))){
					if(funcs[name]){
						outBox+="WARNING: Attempted to redefine func!\n";
						return;
					}
					args.i+=2;
					while(args.code[args.i] != ']:' && args.i < args.code.length) args.i++;
					if(args.i >= args.code.length){
						outBox+="WARNING: Func w/o ending bracket!\n";
						return;
					}
					funcs[name] = oi+2;
					return args.i+1;
				}else{
					outBox+="WARNING: Func w/o name!\n";
				}
			}
		},
		']:':{ //function end
			do: function(){
				var goto = callstack.pop()
				if(!goto){
					outBox+="WARNING: Return from func w/o calling it!\n";
					return;
				}
				return goto;
			}
		},
		';)':{ //call function
			do: function(args){
				var name = args.code[args.i+1]
				if(name && (name = name.match(stringRegexp))){
					var func = funcs[name];
					if(func === undefined){
						outBox+="WARNING: Call func that doesn't exist!\n";
						return;
					}
					callstack.push(args.i+2);
					return func;
				}else{
					outBox+="WARNING: Call func w/o name!\n";
				}
			}
		},
		';{':{ //if begin
			do:function(args){
				if(!stack[stacki]){
					var count = 1;
					while(count != 0 && args.i < args.code.length){
						args.i++;
						if(args.code[args.i] === ';{') count++;
						else if(args.code[args.i] === '};') count--;
					}
					if(args.i >= args.code.length){
						outBox+="WARNING: Unbalanced ;{ }; !\n";
						return;
					}
					args.i++;
					return args.i;
				}
			}
		},
		'};':{ //if end
			do:function(){}
		},
		'|{':{ //!if begin
			do:function(args){
				if(stack[stacki]){
					var count = 1;
					while(count != 0 && args.i < args.code.length){
						args.i++;
						if(args.code[args.i] === '|{') count++;
						else if(args.code[args.i] === '}|') count--;
					}
					if(args.i >= args.code.length){
						outBox+="WARNING: Unbalanced |{ }| !\n";
						return;
					}
					args.i++;
					return args.i;
				}
			}
		},
		'}|':{ //!if end
			do:function(){}
		},
		'X)':{ //label
			do: function(args){
				var name = args.code[args.i+1]
				if(name && (name = name.match(stringRegexp))){
					labels[name] = args.i+2;
					return args.i+2;
				}else{
					outBox+="WARNING: Label w/o name!\n";
				}
			},
			preexec: true
		},
		'X(':{ //goto
			do: function(args){
				var name = args.code[args.i+1]
				if(name && (name = name.match(stringRegexp))){
					var label = labels[name];
					if(label === undefined){
						outBox+="WARNING: Goto label that doesn't exist!\n";
						return;
					}
					return label;
				}else{
					outBox+="WARNING: Goto w/o name!\n";
				}
			}
		},
		'XX':{ //exit
			do:function(args){
				return args.code.length;
			}
		},
		':O':{ //input
			do:function(){
				stack[stacki] = (input.shift() || "\0").charCodeAt(0)
			}
		}
	}
}).toString();

code = code.substring(code.indexOf("{")+1, code.length-1);

const codeBox = document.getElementById("slangCode");
const inBox = document.getElementById("slangInput");
const outBox = document.getElementById("slangOutput");
const debugBox = document.getElementById("debug");
const runButton = document.getElementById("runButton");

var stack = [0]
var stacki = 0

var running = false
var blob = new Blob([code], { type: "text/javascript" })
var worker

function run(){
	if(!running){
		runButton.innerHTML = "Stop";
	    worker = new Worker(window.URL.createObjectURL(blob));
		worker.onmessage = function(e){
			if(!e.data.done){
				outBox.value = e.data.output;
				stack = e.data.stack;
				stacki = e.data.stacki;
				debugOut();
			}else{
				runButton.innerHTML = "Run";
				running = false;
			}
		}
		worker.postMessage({codeBox: codeBox.value, inBox: inBox.value});
	}else{
		worker.terminate();
		worker = undefined;
		runButton.innerHTML = "Run";
	}
	running = !running;
}

function convert(){
	codeBox.value = codeBox.value.replace(/\+/g,":D ").replace(/\-/g,"D: ").replace(/</g,"): ").replace(/>/g, ":) ").replace(/\[/g,":{ ").replace(/\]/g, "}: ").replace(/\./g,";P ").replace(/\,/g,":O ");
}

function debugOut(){
	debugBox.innerHTML = "[";
	for(var i = 0; i < stack.length; i++)
		if(i == stacki)
			debugBox.innerHTML+="<b>"+stack[i]+"</b>, ";
		else
			debugBox.innerHTML+=stack[i]+", ";
	debugBox.innerHTML = debugBox.innerHTML.slice(0, -2)+"]<br>[";
	for(var i = 0; i < stack.length; i++)
		if(i == stacki)
			debugBox.innerHTML+="<b>'"+String.fromCharCode(stack[i])+"'</b>, ";
		else
			debugBox.innerHTML+="'"+String.fromCharCode(stack[i])+"', ";
	debugBox.innerHTML = debugBox.innerHTML.slice(0, -2)+"]";
}

function selectDemo(){
	var demo = document.getElementById("demoSelection").value;
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
	    if (this.readyState == 4 && this.status == 200)
	       codeBox.value = xhttp.responseText;
		else
			alert("There was an error getting the demo.")
	};
	xhttp.open("GET", "/examples/"+demo+".sl", true);
	xhttp.send();
}
