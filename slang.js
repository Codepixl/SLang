const inBox = document.getElementById("slangInput");
const outBox = document.getElementById("slangOutput");
const debugBox = document.getElementById("debug");
const ignoreRegexp = /\t| |\n|([#]+.*)/g;
const stringRegexp = /(["'])(?:(?=(\\?))\2.)*?\1/;

var stack = [0]
var stacki = 0;

var funcs = {}
var callstack = []
var labels = {}

function run(){
	if(!inBox.value) return
	stack = [0]
	stacki = 0
	funcs = {}
	callstack = []
	labels = {}
	outBox.value = "Interpreting..."
	var code = inBox.value.replace(ignoreRegexp,"").match(/(["'])(?:(?=(\\?))\2.)*?\1|(.{2})/g)

	//verifying and adding funcs
	for(var i = 0; i < code.length; i++){
		var inst = instructionTypes[code[i]];
		if(!inst && !code[i].match(/(["'])(?:(?=(\\?))\2.)*?\1/)){
			outBox.value = "Unknown instruction "+code[i]
			return;
		}
		if(inst && inst.preexec)
			inst.do({code: code, i:i});
	}

	outBox.value = "Output:\n";

	var start = performance.now();
	for(var i = 0; i < code.length && performance.now()-start < 2000; i++){
		var it = instructionTypes[code[i]];
		if(!it){
			outBox.value += "\nUnexpected String Literal.\n";
			return;
		}
		var ret = it.do({code: code, i:i});
		if(ret !== undefined)
			i = ret-1;
		debugOut();
	}
	if(performance.now()-start >= 2000)
		alert("Execution took too long. Check for infinite loops!");
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
					outBox.value+="WARNING: Unbalanced :{ }: !\n";
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
				outBox.value+="WARNING: Unbalanced :{ }: !\n";
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
			outBox.value+=stack[stacki]+"\n";
		}
	},
	';P':{ //Print char
		do: function(){
			outBox.value+=String.fromCharCode(stack[stacki])
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
					outBox.value+="WARNING: Attempted to redefine func!\n";
					return;
				}
				args.i+=2;
				while(args.code[args.i] != ']:' && args.i < args.code.length) args.i++;
				if(args.i >= args.code.length){
					outBox.value+="WARNING: Func w/o ending bracket!\n";
					return;
				}
				funcs[name] = oi+2;
				return args.i+1;
			}else{
				outBox.value+="WARNING: Func w/o name!\n";
			}
		}
	},
	']:':{ //function end
		do: function(){
			var goto = callstack.pop()
			if(!goto){
				outBox.value+="WARNING: Return from func w/o calling it!\n";
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
					outBox.value+="WARNING: Call func that doesn't exist!\n";
					return;
				}
				callstack.push(args.i+2);
				return func;
			}else{
				outBox.value+="WARNING: Call func w/o name!\n";
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
					outBox.value+="WARNING: Unbalanced ;{ }; !\n";
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
					outBox.value+="WARNING: Unbalanced |{ }| !\n";
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
				outBox.value+="WARNING: Label w/o name!\n";
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
					outBox.value+="WARNING: Goto label that doesn't exist!\n";
					return;
				}
				return label;
			}else{
				outBox.value+="WARNING: Goto w/o name!\n";
			}
		}
	},
	'XX':{ //exit
		do:function(args){
			return args.code.length;
		}
	}
}
