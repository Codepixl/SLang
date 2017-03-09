# SLang
### Otherwise known as: How I realized I have too much free time.

SLang is an esoteric programming language consisting of smiley faces. It is based on Brainf**k, with added features.

In order to understand SLang, first you must understand Brainf**k.

# Quick guide:

Before the guide starts, know that in pseudocode/javascript representations, `value` is representative of the value of the current location in memory.

## The basics

### :D/D: and ;D/D; and XD/DX
Equivalent to `+`/`-` in BF (adds/subtracts current memory location).

:D/D: adds/subs one, ;D/D; adds/subs 5, and XD/DX adds/subs 20.

For instance, `+` in BF is equivalent to `:D` in SLang, and `+++++` in BF is equivalent to `;D` or `:D :D :D :D :D` in SLang, and `++++++++++++++++++++` in BF is equivalent to `XD` or `;D ;D ;D ;D` or `:D :D :D :D :D :D :D :D :D :D :D :D :D :D :D :D :D :D :D :D ` in SLang.

That means that `-` in BF is equivalent to `D:` in SLang, and so on.

### :) and ):

Equivalent to `>`/`<` in BF (Moves forwards/backwards in memory).

So, `>` in BF is equivalent to `:)` in SLang, and `<` in BF is equivalent to `):` in SLang.

`(:` and `:(` are also acceptable.

### :P and ;P

Equivalent to `.` in BF (Prints value in current memory location).

However, `:P` prints the numerical value followed by a newline, while `;P` prints the UTF-8/ASCII representation of the value like `.` in BF.

### :{ and }:

Equivalent to `[`/`]` in BF. (The code between the brackets is repeated until the current value is 0.)

So, for instance, with `:{ D: }:`, the current value would be decreased until it is 0.

This would be like having `while(value){...}`.

## The interesting stuff

Now here's where it gets a little different from BF.

### !!

This just resets all memory locations to 0 and moves back to memory location 0.

### :[ and ]: and ;)

`:[` and `]:` are used to define functions. Functions must be declared before they are used, and can only be declared once. Functions cannot have parameters (yet). It's usually best to declare all of your functions at the beginning of the program.

For instance,

	:["FUNCTION_NAME"
		<CODE>
	]:

is equivalent to

	function FUNCTION_NAME(){
		<CODE>
	}

in JavaScript.

It's worth mentioning that SLang ignores all whitespace characters and indentation, so

	:["FUNCTION_NAME"<CODE>]:

or

	:[
	"FUNCTION_NAME"
	<CODE>
	]:

would do the same thing.

To call your function, use `;)"FUNCTION_NAME"`.

### ;{ and }; and |{ and }|

`;{` / `};` and `|{` / `}|` are `if` and `if not` statements, that use the current memory location.

For instance,

	;{
		<CODE>
	};

is equivalent to

	if(value){
		<CODE>
	}

and

	|{
		<CODE>
	}|

is equivalent to

	if(!value){
		<CODE>
	}

Again, whitespace is ignored in SLang, so you don't *need* to indent your code, but you should.

### X) and X(

`X)` defines a label. Labels can be used before they are defined, unlike functions.

`X(` is a goto statement.

For instance,

	X)"HELLO"
	<CODE>

is equivalent to

	HELLO:
	<CODE>

in C, and

	X("HELLO"

is equivalent to

	goto HELLO;

in C.

### XX

`XX` stops the program.
